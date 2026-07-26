const User = require("../../models/User");
const { getFullImageUrl } = require("../../utils/config");

// --- 🧠 FLUTTER-ALIGNED SERIALIZER ---
// Custom-built for GetProfileModel & MyProfileScreen UI
const serializeMobileUser = (user) => {
  if (!user) return null;
  
  return {
    id: user._id.toString(),
    userId: String(user.sql_id || 0),
    userType: String(user.user_type || "3"),
    role: user.role || "user",
    
    // CamelCase keys for Flutter UI:
    firstName: user.first_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    mobileNumber: user.mobile_number || "",
    dateOfBirth: user.date_of_birth || "",
    gender: String(user.gender || "1"),
    profilePicture: user.profile_picture ? getFullImageUrl(user.profile_picture) : "",
    
    // Snake_case key specifically required by my_profile_screen.dart:
    banner_image: user.banner_image ? getFullImageUrl(user.banner_image) : ""
  };
};

// --- MOBILE LOGIN ---
exports.loginMobile = async (req, res) => {
  try {
    const { mobile_number, password } = req.body;
    
    const cleanMobile = String(mobile_number).replace(/[^\d+]/g, ""); 
    const rawDigits = cleanMobile.replace('+', '');
    
    const query = { 
        $or: [
            { mobile_number: cleanMobile },                            
            { mobile_number: `+${rawDigits}` },                     
            { mobile_number: rawDigits },                    
            { mobile_number: rawDigits.slice(-10) } 
        ] 
    };

    const user = await User.findOne(query);
    
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ status: "false", message: "Invalid credentials" });
    }
    if (!user.is_verified) {
      return res.status(401).json({ status: "false", message: "Account unverified." });
    }

    const token = require("jsonwebtoken").sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    return res.status(200).json({
      status: "true",
      message: "Login successful.",
      token,
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// --- MOBILE PROFILE FETCH ---
exports.getMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ status: "false", message: "User not found" });

    return res.status(200).json({
      status: "true",
      // 🎯 EXACT MATCH for Constants.profileSuccessMsg
      message: "Profile retrieved successfully.", 
      data: serializeMobileUser(user)
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

// --- MOBILE PROFILE UPDATE ---
exports.updateMobileProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: "false", message: "User not found" });

    // The Flutter BLoC sends these as snake_case in the updateProfile payload
    const { first_name, last_name, email, mobile_number, date_of_birth, gender } = req.body;
    
    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (email) user.email = email.toLowerCase();
    if (date_of_birth) user.date_of_birth = date_of_birth;
    if (gender) user.gender = gender;
    
    if (mobile_number) {
        let cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;
        user.mobile_number = cleanMobile;
    }

    // Parse Multer arrays with web-safe forward slashes
    if (req.files) {
        if (req.files.profile_picture && req.files.profile_picture.length > 0) {
            user.profile_picture = req.files.profile_picture[0].path.replace(/\\/g, "/");
        }
        if (req.files.banner_image && req.files.banner_image.length > 0) {
            user.banner_image = req.files.banner_image[0].path.replace(/\\/g, "/");
        }
    }

    await user.save();
    return res.status(200).json({ 
        status: "true", 
        // 🎯 EXACT MATCH for Constants.profileUpdateSuccessMsg
        message: "Profile updated successfully.", 
        data: serializeMobileUser(user) 
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};