const User = require("../../models/User");
const Temple = require("../../models/Temple"); 
const jwt = require("jsonwebtoken");
const mailSender = require("../../utils/mailSender"); 
const { getFullImageUrl } = require("../../utils/config");
// 🎯 THE FIX: Pointing to the new Notification Hub!
const NotificationHub = require("../../utils/NotificationHub"); 
// 🎯 THE FIX: Only pulling what we need from the Shared Service
const { serializeUser, normalizeMobile } = require("../shared/authService");
// --- 🧠 CORE SHARED SERIALIZER ---
const serializeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id.toString(),
    mongo_id: user._id.toString(),
    sql_id: String(user.sql_id || 0),
    email: user.email || "",
    role: user.role || "user",
    is_verified: user.is_verified || false,
    name: user.name || `${user.first_name} ${user.last_name || ''}`.trim(),
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    mobile_number: user.mobile_number || "",
    profile_picture: user.profile_picture ? getFullImageUrl(user.profile_picture) : "",
    banner_image: user.banner_image ? getFullImageUrl(user.banner_image) : "",
    date_of_birth: user.date_of_birth || "",
    gender: String(user.gender || "1"),
    user_type: String(user.user_type || "3")
  };
};

// --- AUTHENTICATION & OTP FLOWS ---
exports.signupUser = async (req, res) => {
  try {
    const { first_name, last_name, email, mobile_number, password } = req.body;
    if (!first_name || !mobile_number || !email || !password) return res.status(400).json({ status: "false", message: "Required fields missing." });

    // 🌍 GLOBAL FIX: Keep digits and '+'. Add '+' if missing.
    let cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
    if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;
    
    const cleanEmail = String(email).toLowerCase().trim();

    let user = await User.findOne({ $or: [{ mobile_number: cleanMobile }, { email: cleanEmail }] });
    if (user && user.is_verified) return res.status(400).json({ status: "false", message: "User exists." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (user) {
      user.first_name = first_name; user.password = password; user.otp = otp; user.otp_expires = otpExpires;
    } else {
      user = new User({ first_name, last_name: last_name || "", email: cleanEmail, mobile_number: cleanMobile, password, user_type: 3, otp, otp_expires: otpExpires });
    }
    await user.save();
    mailSender(cleanEmail, "Verify Account", `OTP: ${otp}`).catch(console.error);

    return res.status(200).json({ status: "true", message: "OTP sent.", data: { id: user._id } });
  } catch (error) { return res.status(500).json({ status: "false", message: error.message }); }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile_number, otp, user_id } = req.body;
    let query = { otp, _id: user_id };

    if (mobile_number) {
        const cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        const rawDigits = cleanMobile.replace('+', '');
        query = { 
            $or: [
                { mobile_number: cleanMobile, otp }, 
                { mobile_number: `+${rawDigits}`, otp }, 
                { mobile_number: rawDigits, otp },
                { mobile_number: rawDigits.slice(-10), otp },
                { _id: user_id, otp }
            ] 
        };
    }
    
    const user = await User.findOne(query);
    if (!user || new Date() > user.otp_expires) return res.status(400).json({ status: "false", message: "Invalid/Expired OTP." });

    user.is_verified = true; user.otp = null;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    return res.status(200).json({ status: "true", token, data: serializeUser(user) });
  } catch (error) { return res.status(500).json({ status: "false", message: error.message }); }
};

exports.resendOtp = async (req, res) => {
  try {
    const { mobile_number } = req.body;
    const cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
    const rawDigits = cleanMobile.replace('+', '');

    const user = await User.findOne({ 
        $or: [
            { mobile_number: cleanMobile }, 
            { mobile_number: `+${rawDigits}` }, 
            { mobile_number: rawDigits },
            { mobile_number: rawDigits.slice(-10) }
        ] 
    });

    if (!user) return res.status(404).json({ status: "false", message: "User not found." });
    
    user.otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    return res.status(200).json({ status: "true", message: "New code sent." });
  } catch (error) { return res.status(500).json({ status: "false", message: error.message }); }
};

// 🎯 LOUD DIAGNOSTIC LOGIN FUNCTION (GLOBAL + LEGACY)
exports.loginUser = async (req, res) => {
    try {
        console.log("-----------------------------------------");
        console.log("📥 [LOGIN ATTEMPT] Raw Body Received:", req.body);
        
        const { identifier, email, mobile_number, mobile, password } = req.body;
        const loginId = String(identifier || email || mobile_number || mobile || "").trim().toLowerCase();

        console.log("🔍 [LOGIN] Parsed Login ID:", loginId);

        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: "Missing credentials." });
        }

        let query = {};
        if (loginId.includes('@')) {
            query = { email: loginId };
            console.log("🔍 [LOGIN] Type: EMAIL");
        } else {
            console.log("🔍 [LOGIN] Type: MOBILE NUMBER");
            
            // 🌍 GLOBAL FIX: The Ultimate Master Query
            const cleanMobile = loginId.replace(/[^\d+]/g, ""); 
            const rawDigits = cleanMobile.replace('+', '');
            
            query = { 
                $or: [
                    { mobile_number: cleanMobile },                            
                    { mobile_number: `+${rawDigits}` },                     
                    { mobile_number: rawDigits },                    
                    { mobile_number: rawDigits.slice(-10) } 
                ] 
            };
        }

        console.log("🔍 [LOGIN] Executing MongoDB Query:", JSON.stringify(query));

        const user = await User.findOne(query);
        
        if (!user) {
            console.log("❌ [LOGIN FAILED] User not found in database for this query!");
            console.log("-----------------------------------------");
            return res.status(404).json({ success: false, message: "Account not found." });
        }

        console.log("✅ [LOGIN] User Found in DB:", user.mobile_number || user.email);

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            console.log("❌ [LOGIN FAILED] Password mismatch!");
            console.log("-----------------------------------------");
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
        
        console.log("✅ [LOGIN] Password Matched. Generating secure token...");
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        res.cookie("access_token", token, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: "lax",
            path: '/'
        });

        console.log("✅ [LOGIN SUCCESS] Cookie injected. Sending response to frontend.");
        console.log("-----------------------------------------");

        return res.status(200).json({ 
            success: true, 
            token, 
            user: { id: user._id, name: user.name, first_name: user.first_name, role: user.role } 
        });
    } catch (error) { 
        console.error("🔥 [LOGIN CRASH]:", error);
        return res.status(500).json({ success: false, message: error.message }); 
    }
};

// --- CORE PROFILE & RECOVERY MANAGEMENT ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return res.status(404).json({ status: "false", message: "User not found" });
    return res.status(200).json({ status: "true", data: serializeUser(user) });
  } catch (error) { return res.status(500).json({ status: "false", message: error.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log("📥 [UPDATE PROFILE] Body:", req.body);
    console.log("📁 [UPDATE PROFILE] Files:", req.files);

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "false", message: "User not found" });

    const { 
        first_name, 
        last_name, 
        email, 
        mobile_number, 
        gender, 
        date_of_birth, 
        remove_profile_picture, 
        remove_banner_image 
    } = req.body;

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (email) user.email = email.toLowerCase();
    if (gender) user.gender = gender;
    if (date_of_birth) user.date_of_birth = date_of_birth; 
    
    // 🌍 GLOBAL FIX: Format updated profile number correctly
    if (mobile_number) {
        let cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;
        user.mobile_number = cleanMobile;
    }

    if (remove_profile_picture === 'true') user.profile_picture = "";
    if (remove_banner_image === 'true') user.banner_image = "";

    if (req.files?.profile_picture) user.profile_picture = req.files.profile_picture[0].path;
    if (req.files?.banner_image) user.banner_image = req.files.banner_image[0].path;

    await user.save();
    return res.status(200).json({ status: "true", data: serializeUser(user) });
    
  } catch (error) { 
    console.error("🔥 PROFILE UPDATE CRASH:", error); 
    return res.status(500).json({ status: "false", message: error.message }); 
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, mobile_number } = req.body;
    
    let query = {};
    if (email) {
        query.email = email.toLowerCase();
    } else if (mobile_number) {
        const cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        const rawDigits = cleanMobile.replace('+', '');
        query = { 
            $or: [
                { mobile_number: cleanMobile }, 
                { mobile_number: `+${rawDigits}` }, 
                { mobile_number: rawDigits },
                { mobile_number: rawDigits.slice(-10) }
            ] 
        };
    } else {
        return res.status(400).json({ status: "false", message: "Provide email or mobile" });
    }
    
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ status: "false", message: "User not found." });

    user.otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // 🌍 GLOBAL FIX: Format correctly for Twilio (Legacy fallback to +91)
    const dbMobile = user.mobile_number;
    const twilioReadyNumber = dbMobile.startsWith('+') ? dbMobile : `+91${dbMobile.replace(/\D/g, "").slice(-10)}`;

    await NotificationHub.dispatchOtp(
        user.email, 
        twilioReadyNumber, 
        user.otp, 
        "STM Club Password Reset"
    );

    return res.status(200).json({ status: "true", message: "OTP sent.", data: { id: user._id } });
  } catch (error) { 
    return res.status(500).json({ status: "false", message: error.message }); 
  }
};

exports.forgotVerifyOtp = async (req, res) => {
  try {
    const { mobile_number, email, otp } = req.body;
    
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    const cleanOtp = otp ? String(otp).trim() : null;

    let query = {};
    if (cleanEmail) {
      query.email = cleanEmail;
    } else if (mobile_number) {
        const cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        const rawDigits = cleanMobile.replace('+', '');
        query = { 
            $or: [
                { mobile_number: cleanMobile }, 
                { mobile_number: `+${rawDigits}` }, 
                { mobile_number: rawDigits },
                { mobile_number: rawDigits.slice(-10) }
            ] 
        };
    } else {
      return res.status(400).json({ status: "false", message: "Mobile number or Email is required." });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ status: "false", message: "User account not found." });

    let isOtpValid = false;

    if (user.mobile_number && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
      const dbMobile = user.mobile_number;
      const twilioReadyNumber = dbMobile.startsWith('+') ? dbMobile : `+91${dbMobile.replace(/\D/g, "").slice(-10)}`;
      isOtpValid = await NotificationHub.verifyMobileToken(twilioReadyNumber, cleanOtp);
    }

    if (!isOtpValid) {
      if (user.otp === cleanOtp && new Date() <= user.otp_expires) {
        isOtpValid = true;
      }
    }

    if (!isOtpValid) {
      return res.status(400).json({ status: "false", message: "Incorrect or expired OTP code." });
    }

    user.otp = cleanOtp;
    user.otp_expires = new Date(Date.now() + 5 * 60 * 1000); 
    await user.save();

    return res.status(200).json({ status: "true", message: "OTP Verified successfully." });
  } catch (error) { 
    return res.status(500).json({ status: "false", message: error.message }); 
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { mobile_number, email, otp, new_password } = req.body;
    
    const cleanEmail = email ? String(email).toLowerCase().trim() : null;
    const cleanOtp = otp ? String(otp).trim() : null;

    let query = {};
    if (cleanEmail) {
      query.email = cleanEmail;
    } else if (mobile_number) {
        const cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        const rawDigits = cleanMobile.replace('+', '');
        query = { 
            $or: [
                { mobile_number: cleanMobile }, 
                { mobile_number: `+${rawDigits}` }, 
                { mobile_number: rawDigits },
                { mobile_number: rawDigits.slice(-10) }
            ] 
        };
    } else {
      return res.status(400).json({ status: "false", message: "Mobile number or Email is required." });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ status: "false", message: "User account not found." });

    let isOtpValid = false;

    if (user.mobile_number && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
      const dbMobile = user.mobile_number;
      const twilioReadyNumber = dbMobile.startsWith('+') ? dbMobile : `+91${dbMobile.replace(/\D/g, "").slice(-10)}`;
      isOtpValid = await NotificationHub.verifyMobileToken(twilioReadyNumber, cleanOtp);
    }

    if (!isOtpValid) {
      if (user.otp === cleanOtp && new Date() <= user.otp_expires) {
        isOtpValid = true;
      }
    }

    if (!isOtpValid) {
      return res.status(400).json({ status: "false", message: "Invalid security credentials or expired session." });
    }

    user.password = new_password; 
    user.otp = null; 
    user.otp_expires = null;
    await user.save();

    return res.status(200).json({ status: "true", message: "Password updated successfully." });
  } catch (error) { 
    return res.status(500).json({ status: "false", message: error.message }); 
  }
};

// --- FAVORITES & LOGOUT ---
exports.toggleFavoriteTemple = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isFavorited = user.favorite_temples.includes(req.body.templeId);
    isFavorited ? user.favorite_temples.pull(req.body.templeId) : user.favorite_temples.push(req.body.templeId);
    await user.save();
    return res.status(200).json({ status: "true", message: isFavorited ? "Removed" : "Added" });
  } catch (error) { return res.status(500).json({ status: "false", message: error.message }); }
};

exports.getMyFavoriteTemples = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'favorite_temples',
      select: 'name image city_name state_name visit_price is_free_today is_discount_active member_discount_percentage'
    });
    if (!user) return res.status(404).json({ status: "false", message: "User not found." });

    const formattedFavorites = user.favorite_temples.map(temple => ({
      ...temple.toObject(),
      image: temple.image ? getFullImageUrl(temple.image) : ""
    }));

    res.status(200).json({ status: "true", success: true, data: formattedFavorites });
  } catch (error) { res.status(500).json({ status: "false", message: error.message }); }
};

exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      path: '/'
    });
    
    return res.status(200).json({ status: "true", message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({ status: "false", message: "Logout failed." });
  }
};

// --- EXPORTS ALIASES ---
module.exports = {
  signupUser: exports.signupUser,
  signUp: exports.signupUser,     
  verifyOtp: exports.verifyOtp,
  verifyOTP: exports.verifyOtp,   
  resendOtp: exports.resendOtp,
  loginUser: exports.loginUser,
  login: exports.loginUser,       
  getProfile: exports.getProfile, 
  updateProfile: exports.updateProfile,
  checkAuth: exports.getProfile,  
  getMe: exports.getProfile,      
  toggleFavoriteTemple: exports.toggleFavoriteTemple,
  getMyFavoriteTemples: exports.getMyFavoriteTemples,
  forgotPassword: exports.forgotPassword, 
  forgotVerifyOtp: exports.forgotVerifyOtp,
  resetPassword: exports.resetPassword,   
  logoutUser: exports.logoutUser
};