// controllers/web/authWebController.js
const User = require("../../models/User");
const jwt = require("jsonwebtoken");

// 🎯 NEW: Importing the Hub from Utils!
const NotificationHub = require("../../utils/NotificationHub"); 
// 🎯 NEW: Importing the lightweight platform-aware service
const { 
    generateAccessToken, 
    serializeUser, 
    normalizeEmail, 
    normalizeMobile, 
    generateOtp 
} = require("../shared/authService");

const COOKIE_OPTIONS = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: "lax", 
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

// ==========================================
// 1. SMART LOGIN (Supports Suffix Matching)
// ==========================================
exports.login = async (req, res) => {
    try {
        const identifier = req.body.identifier || req.body.email || req.body.mobile_number;
        const password = req.body.password;
        
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "Email/Mobile and Password are required." });
        }

        let user;
        const isEmailInput = isValidEmail(identifier);

        if (isEmailInput) {
            user = await User.findOne({ email: normalizeEmail(identifier) });
        } else {
            // Smart Collision Detector
            const rawDigits = String(identifier).replace(/\D/g, "");
            if (rawDigits.length < 7) {
                return res.status(400).json({ success: false, message: "The mobile number format is invalid." });
            }

            const matchedUsers = await User.find({ mobile_number: { $regex: new RegExp(rawDigits + "$") } });

            if (matchedUsers.length === 0) {
                return res.status(404).json({ success: false, message: "This mobile number is not registered. Please sign up." });
            }
            if (matchedUsers.length > 1) {
                return res.status(400).json({ success: false, message: "Multiple regions share this number. Please include your country code (e.g., +1 or +91)." });
            }

            user = matchedUsers[0]; 
        }

        if (!user) return res.status(404).json({ success: false, message: "Account not found." });
        if (!(await user.matchPassword(password))) return res.status(401).json({ success: false, message: "Incorrect password." });

        // 🚨 THE AGGRESSIVE ADMIN BLOCKER
        if ([1, 2].includes(Number(user.user_type)) || ['admin', 'temple_admin'].includes(String(user.role).toLowerCase())) {
            return res.status(403).json({ success: false, message: "Access Denied: Please use the dedicated Admin Portal to log in." });
        }
        
        // 🎯 Passes 'web' to get a 30-day token
        const token = generateAccessToken(user, 'web');
        res.cookie("access_token", token, COOKIE_OPTIONS);
        
        return res.status(200).json({ success: true, user: serializeUser(user, 'web') });
    } catch (error) { 
        console.error("Web Login Error:", error);
        return res.status(500).json({ success: false, message: "Server error." }); 
    }
};

// ==========================================
// 2. REGISTRATION (Creates Unverified User)
// ==========================================
exports.signup = async (req, res) => {
    try {
        const { first_name, last_name, email, mobile_number, password } = req.body;
        
        if (!first_name || !email || !mobile_number || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const cleanEmail = normalizeEmail(email);
        
        // 🎯 React-Phone-Input-2 Formatting: Ensure it always starts with '+'
        let cleanMobile = String(mobile_number).replace(/[^\d+]/g, "");
        if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;

        const existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { mobile_number: cleanMobile }] });

        if (existingUser) {
            const isEmailConflict = existingUser.email === cleanEmail;
            return res.status(409).json({ 
                success: false, 
                message: isEmailConflict ? "This email is already registered." : "This mobile number is already in use." 
            });
        }

        const user = new User({ 
            first_name, 
            last_name: last_name || "",
            email: cleanEmail, 
            mobile_number: cleanMobile, 
            password, 
            is_verified: false, 
            user_type: 3 
        });
        
        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000); 
        await user.save();
        
        // 📡 Dispatch OTP via the unified Hub
        await NotificationHub.dispatchOtp(cleanEmail, cleanMobile, otp, "Verify your STM Club Account");
        
        return res.status(201).json({ success: true, message: "Account created! Verification OTP sent." });
    } catch (error) { 
        console.error("Web Signup Error:", error);
        return res.status(500).json({ success: false, message: "Server error during registration." }); 
    }
};

// ==========================================
// 3. OTP VERIFICATION & AUTO-LOGIN
// ==========================================
exports.verifyOtp = async (req, res) => {
    try {
        let cleanMobile = String(req.body.mobile_number || req.body.mobile).replace(/[^\d+]/g, "");
        if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;
        
        const otp = String(req.body.otp || "").trim();
        
        const user = await User.findOne({ mobile_number: cleanMobile });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        let isOtpValid = false;

        // 📡 1. Try Twilio/QA Magic Key via NotificationHub
        try {
            isOtpValid = await NotificationHub.verifyMobileToken(cleanMobile, otp);
        } catch (twilioError) {
            // ✨ SILENT CATCH: Prevents 500 crashes on Twilio Trial errors
            console.log(`⚠️ [Web Twilio Bypass]: Twilio rejected request (${twilioError.message}). Falling back to DB...`);
        }
        
        // 💾 2. Fallback to Local Database Check
        if (!isOtpValid) {
            if (user.otp === otp && new Date() <= user.otp_expires) {
                isOtpValid = true;
                console.log("✅ [Web OTP Verified]: Successfully matched internal Database OTP.");
            }
        }

        if (!isOtpValid) return res.status(400).json({ success: false, message: "Invalid or expired OTP." });

        user.is_verified = true; 
        user.otp = undefined; 
        user.otp_expires = undefined;
        await user.save();
        
        // 🎯 Passes 'web' to get a 30-day token
        const token = generateAccessToken(user, 'web');
        res.cookie("access_token", token, COOKIE_OPTIONS);
        
        return res.status(200).json({ success: true, message: "Verification successful.", user: serializeUser(user, 'web') });
    } catch (error) { 
        console.error("🔥 Web Verify OTP Error:", error);
        return res.status(500).json({ success: false, message: "Server error during verification." }); 
    }
};
// ==========================================
// 4. SESSION MANAGEMENT
// ==========================================
exports.resendOtp = async (req, res) => {
    try {
        let cleanMobile = String(req.body.mobile_number || req.body.mobile).replace(/[^\d+]/g, "");
        if (!cleanMobile.startsWith('+')) cleanMobile = `+${cleanMobile}`;

        const user = await User.findOne({ mobile_number: cleanMobile });
        
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        if (user.is_verified) return res.status(400).json({ success: false, message: "User is already verified. Please log in." });
        
        const newOtp = generateOtp();
        user.otp = newOtp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        
        await NotificationHub.dispatchOtp(user.email, cleanMobile, newOtp, "STM Club - Resend OTP");

        return res.status(200).json({ success: true, message: "New OTP sent successfully." });
    } catch (error) { 
        return res.status(500).json({ success: false, message: "Server error while resending OTP." }); 
    }
};

exports.logout = (req, res) => {
    res.clearCookie("access_token", { path: '/' });
    res.status(200).json({ success: true, message: "Logged out successfully." });
};

exports.checkAuth = async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.status(200).json({ success: true, authenticated: false });
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            res.clearCookie("access_token", { path: '/' });
            return res.status(200).json({ success: true, authenticated: false });
        }
        
        return res.status(200).json({ success: true, authenticated: true, user: serializeUser(user, 'web') });
    } catch (error) { 
        res.clearCookie("access_token", { path: '/' });
        return res.status(200).json({ success: true, authenticated: false }); 
    }
};