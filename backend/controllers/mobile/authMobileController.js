const User = require("../../models/User");
const { 
    generateAccessToken, 
    serializeUser, 
    normalizeEmail, 
    normalizeMobile,
    generateOtp,
    NotificationHub
} = require("../shared/authService");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

exports.login = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.mobile_number || req.body.mobileNo || req.body.mobile || req.body.identifier;
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({ status: "false", success: false, message: "Email/Mobile and password are required." });
        }

        let query = {};
        if (isValidEmail(identifier)) {
            query.email = normalizeEmail(identifier);
        } else {
            // 🎯 STRICT LOOKUP: Relying completely on the normalized E.164 standard
            const cleanMobile = normalizeMobile(identifier);
            if (!cleanMobile) {
                 return res.status(400).json({ status: "false", success: false, message: "Invalid mobile format." });
            }
            query.mobile_number = cleanMobile; 
        }
        
        // 🎯 QUERY ISOLATED DATABASE: Only searches Devotees
        const user = await User.findOne(query);
        
        if (!user) {
            return res.status(404).json({ status: "false", success: false, message: "Account not found. Please sign up." });
        }
        
        if (!user.is_verified) return res.status(403).json({ status: "false", success: false, message: "Please verify your account first." });
        
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ status: "false", success: false, message: "Incorrect password." });
        }

        const token = generateAccessToken(user, 'mobile');
        return res.status(200).json({ 
            status: "true", 
            success: true,
            message: "Login successful",
            token: token, 
            user: serializeUser(user, 'mobile'),
            data: {
                ...serializeUser(user, 'mobile'),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) { 
        console.error("📱 Mobile Login Error:", error);
        return res.status(500).json({ status: "false", success: false, message: "Internal server error during login." }); 
    }
};

exports.signUp = async (req, res) => {
    try {
        const { email, password, first_name } = req.body;
        const rawMobile = req.body.mobile_number || req.body.mobileNo || req.body.mobile;

        // 1. Strict Input Validation
        if (!first_name || !email || !rawMobile || !password) {
            return res.status(400).json({ status: "false", success: false, message: "All fields are required." });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ status: "false", success: false, message: "Invalid email format." });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ status: "false", success: false, message: "Password must be at least 6 characters." });
        }

        const emailAddr = normalizeEmail(email);
        const cleanMobile = normalizeMobile(rawMobile);
        if (!cleanMobile) {
            return res.status(400).json({ status: "false", success: false, message: "Invalid mobile number format." });
        }

        let user = await User.findOne({ $or: [{ email: emailAddr }, { mobile_number: cleanMobile }] });
        
        if (user && user.is_verified) {
            return res.status(409).json({ status: "false", success: false, message: "Account already exists. Please log in." });
        }

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); 

        if (user && !user.is_verified) {
            user.otp = otp;
            user.otp_expires = otpExpires;
            user.password = password; 
            await user.save();
        } else {
            user = await User.create({
                first_name: String(first_name).trim(), 
                email: emailAddr, 
                mobile_number: cleanMobile,
                password, 
                otp, 
                otp_expires: otpExpires, 
                is_verified: false, 
                user_type: 3
            });
        }

        NotificationHub.dispatchOtp(emailAddr, cleanMobile, otp, "Verify your Sarvatirthamayi Account")
            .catch(e => console.error("Background dispatch failed:", e));

        // 🎯 EXACT JSON MATCH FOR signup_model.dart
        return res.status(200).json({
            status: "true",
            success: true, 
            message: "Verification profile created. OTP dispatched.",
            data: { 
                id: user._id.toString(), 
                userId: user._id.toString(),
                first_name: user.first_name,
                mobile_number: user.mobile_number,
                email: user.email 
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: "false", success: false, message: "Email or Mobile already registered." });
        }
        console.error("🚀 Signup Processing Fault:", error);
        return res.status(500).json({ status: "false", success: false, message: "Internal server error during signup." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const rawMobile = req.body.mobile_number || req.body.mobileNumber || req.body.mobileNo || req.body.mobile;
        const otp = String(req.body.otp || "").trim();

        if (!rawMobile || !otp) {
            return res.status(400).json({ status: "false", success: false, message: "Mobile number and OTP are required." });
        }

        // 🎯 STRICT LOOKUP: Standardized E.164 Format
        const mobile = normalizeMobile(rawMobile);
        const user = await User.findOne({ mobile_number: mobile });
        
        if (!user) return res.status(404).json({ status: "false", success: false, message: "User profile not found." });
        if (user.is_verified) return res.status(400).json({ status: "false", success: false, message: "Account is already verified." });

        let isTokenValid = false;
        if (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1) {
            isTokenValid = await NotificationHub.verifyMobileToken(mobile, otp);
        }

        if (!isTokenValid && user.otp === otp && user.otp_expires > Date.now()) {
            isTokenValid = true;
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", success: false, message: "Invalid or expired authorization code." });

        const type = Number(user.user_type);
        if (type === 1 || type === 2 || user.role === 'admin' || user.role === 'temple_admin') {
            return res.status(403).json({ status: "false", success: false, message: "Admin accounts cannot be verified here." });
        }

        user.is_verified = true;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        const token = generateAccessToken(user, 'mobile');
        
        // 🎯 EXACT JSON MATCH FOR register_verify_otp_model.dart
        return res.status(200).json({
            status: "true",
            success: true,
            message: "Account verified successfully.",
            token: token,
            data: {
                ...serializeUser(user, 'mobile'),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) {
        console.error("📱 Mobile Verify Error:", error);
        return res.status(500).json({ status: "false", success: false, message: "Internal server error." });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const rawMobile = req.body.mobile_number || req.body.mobileNo || req.body.mobile;
        if (!rawMobile) return res.status(400).json({ status: "false", success: false, message: "Mobile number is required." });

        // 🎯 STRICT LOOKUP
        const mobileNumber = normalizeMobile(rawMobile);
        const user = await User.findOne({ mobile_number: mobileNumber });

        if (!user) return res.status(404).json({ status: "false", success: false, message: "Account not found." });
        if (user.is_verified) return res.status(400).json({ status: "false", success: false, message: "Account is already verified." });

        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        NotificationHub.dispatchOtp(user.email, mobileNumber, otp, "Resend: Verify your Sarvatirthamayi Account")
            .catch(e => console.error("Background dispatch failed:", e));

        return res.status(200).json({ status: "true", success: true, message: "OTP resent successfully." });
    } catch (error) {
        console.error("📱 Resend OTP Error:", error);
        return res.status(500).json({ status: "false", success: false, message: "Internal server error." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const rawEmail = req.body.email;
        const rawMobile = req.body.mobile_number || req.body.mobileNo;

        let user;

        if (rawEmail) {
            const email = normalizeEmail(rawEmail);
            user = await User.findOne({ email });
        } else if (rawMobile) {
            // 🎯 STRICT LOOKUP: No regex required anymore!
            const cleanMobile = normalizeMobile(rawMobile);
            user = await User.findOne({ mobile_number: cleanMobile });
        }

        if (!user) return res.status(404).json({ status: "false", success: false, message: "No account found." });

        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        NotificationHub.dispatchOtp(user.email, user.mobile_number, otp, "Password Reset OTP - Sarvatirthamayi")
            .catch(e => console.error("Background dispatch failed:", e));

        // 🎯 EXACT JSON MATCH FOR forgot_password_model.dart
        return res.status(200).json({
            status: "true", 
            success: true, 
            message: "Recovery credentials dispatched.",
            data: { 
                id: user._id.toString(), 
                userId: user._id.toString(), 
                first_name: user.first_name,
                mobile_number: user.mobile_number
             }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: "Server recovery pipeline error" });
    }
};

exports.forgotVerifyOtp = async (req, res) => {
    try {
        const userId = req.body.user_id || req.body.userId;
        const otp = String(req.body.otp || "").trim();

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ status: "false", success: false, message: "User not found." });

        let isTokenValid = (user.otp === otp && user.otp_expires > Date.now());
        if (!isTokenValid && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
            isTokenValid = await NotificationHub.verifyMobileToken(user.mobile_number, otp);
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", success: false, message: "Invalid or expired OTP." });

        const tempToken = generateAccessToken(user, 'mobile');
        
        // 🎯 EXACT JSON MATCH FOR forgot_verify_otp_model.dart
        return res.status(200).json({
            status: "true",
            success: true,
            message: "OTP verified",
            token: tempToken,
            data: { 
                ...serializeUser(user, 'mobile'),
                accessToken: tempToken,
                access_token: tempToken
            }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password, otp } = req.body;
        const confirmPassword = req.body.confirm_password || req.body.confirmPassword;
        const userId = req.body.user_id || req.body.userId;

        if (password !== confirmPassword) {
            return res.status(400).json({ status: "false", success: false, message: "Passwords do not match." });
        }

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ status: "false", success: false, message: "User not found." });

        let isTokenValid = (user.otp === otp && user.otp_expires > Date.now());
        if (!isTokenValid && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
            isTokenValid = await NotificationHub.verifyMobileToken(user.mobile_number, otp);
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", success: false, message: "Invalid session or OTP." });

        user.password = password;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        const token = generateAccessToken(user, 'mobile');
        
        // 🎯 EXACT JSON MATCH FOR reset_password_model.dart
        return res.status(200).json({
            status: "true",
            success: true,
            message: "Password reset successful",
            data: {
                ...serializeUser(user, 'mobile'),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: "Server error" });
    }
};

exports.logout = async (req, res) => {
    try {
        return res.status(200).json({ status: "true", success: true, message: "Logged out successfully." });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: "Logout processing failed." });
    }
};