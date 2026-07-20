const User = require("../../models/User");
const { 
    generateAccessToken, 
    serializeUser, 
    normalizeEmail, 
    normalizeMobile
} = require("../shared/authService");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

exports.login = async (req, res) => {
    try {
        const identifier = req.body.email || req.body.mobile_number || req.body.mobileNo || req.body.mobile || req.body.identifier;
        const password = req.body.password;

        if (!identifier || !password) {
            return res.status(400).json({ status: "false", message: "Email/Mobile and password are required." });
        }

        let query = {};
        if (isValidEmail(identifier)) {
            query.email = normalizeEmail(identifier);
        } else {
            // 🎯 THE FIX: Use the forgiving Regex match just like the web controller!
            const cleanMobile = String(identifier).replace(/\D/g, "");
            if (cleanMobile.length < 7) {
                 return res.status(400).json({ status: "false", message: "Invalid mobile format." });
            }
            query.mobile_number = { $regex: new RegExp(cleanMobile + "$") };
        }
        
        // 🎯 QUERY ISOLATED DATABASE: Only searches Devotees
        const user = await User.findOne(query);
        
        if (!user) {
            // Admins will naturally trigger this error!
            return res.status(404).json({ status: "false", message: "Account not found. Please sign up." });
        }
        
        if (!user.is_verified) return res.status(403).json({ status: "false", message: "Please verify your account first." });
        
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ status: "false", message: "Incorrect password." });
        }

        const token = generateAccessToken(user);
        return res.status(200).json({ 
            status: "true", 
            success: true,         // 👈 ADDED: The boolean Dart is likely looking for
            message: "Login successful",
            token: token, 
            user: serializeUser(user, 'mobile'), // 👈 ADDED: Fills the "user" key
            data: {
                ...serializeUser(user, 'mobile'),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) { 
        console.error("📱 Mobile Login Error:", error);
        return res.status(500).json({ status: "false", message: "Internal server error during login." }); 
    }
};

// ... (Signup, verifyOtp, and resendOtp remain the same, locked to the User collection)
exports.signUp = async (req, res) => {
    try {
        const { email, password, first_name } = req.body;
        const rawMobile = req.body.mobile_number || req.body.mobileNo || req.body.mobile;

        // 1. Strict Input Validation
        if (!first_name || !email || !rawMobile || !password) {
            return res.status(400).json({ status: "false", message: "All fields (name, email, mobile, password) are required." });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ status: "false", message: "Invalid email address format." });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ status: "false", message: "Password must be at least 6 characters long." });
        }

        const emailAddr = normalizeEmail(email);
        const cleanMobile = normalizeMobile(rawMobile);
        if (!cleanMobile) {
            return res.status(400).json({ status: "false", message: "Invalid mobile number format." });
        }

        // 2. State Awareness Check
        let user = await User.findOne({ $or: [{ email: emailAddr }, { mobile_number: cleanMobile }] });
        
        if (user && user.is_verified) {
            return res.status(409).json({ status: "false", message: "Account already exists. Please log in." });
        }

        // 3. Database Execution
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (user && !user.is_verified) {
            // Update existing unverified profile
            user.otp = otp;
            user.otp_expires = otpExpires;
            user.password = password; // Update to latest requested password
            await user.save();
        } else {
            // Create brand new profile (Force user_type to 3 - Devotee)
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

        // 4. Background Dispatch (Non-blocking)
        NotificationHub.dispatchOtp(emailAddr, cleanMobile, otp, "Verify your STM Club Account")
            .catch(e => console.error("Background dispatch failed:", e));

        return res.status(200).json({
            status: "true",
            success: true, 
            message: "Verification profile created. OTP dispatched.",
            data: { id: user._id.toString(), userId: user._id.toString() }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: "false", message: "Email or Mobile already registered to another account." });
        }
        console.error("🚀 Signup Processing Fault:", error);
        return res.status(500).json({ status: "false", message: "Internal server error during signup." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const rawMobile = req.body.mobile_number || req.body.mobileNumber || req.body.mobileNo || req.body.mobile;
        const otp = String(req.body.otp || "").trim();

        if (!rawMobile || !otp) {
            return res.status(400).json({ status: "false", message: "Mobile number and OTP are required." });
        }

        const mobile = normalizeMobile(rawMobile);
        const user = await User.findOne({ mobile_number: mobile });
        
        if (!user) {
            return res.status(404).json({ status: "false", message: "User profile not found. Please sign up again." });
        }
        if (user.is_verified) {
            return res.status(400).json({ status: "false", message: "Account is already verified. Please log in." });
        }

        let isTokenValid = false;
        if (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1) {
            isTokenValid = await NotificationHub.verifyMobileToken(mobile, otp);
        }

        if (!isTokenValid && user.otp === otp && user.otp_expires > Date.now()) {
            isTokenValid = true;
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", message: "Invalid or expired authorization code." });

        // 🚨 THE BULLETPROOF JACKET: Ensure Admins don't bypass security via OTP verification
        const type = Number(user.user_type);
        if (type === 1 || type === 2 || user.role === 'admin' || user.role === 'temple_admin') {
            return res.status(403).json({ 
                status: "false", 
                message: "Access Denied: Admin accounts cannot be verified through the Mobile Portal." 
            });
        }

        user.is_verified = true;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        const token = generateAccessToken(user);
        return res.status(200).json({
            status: "true",
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
        return res.status(500).json({ status: "false", message: "Internal server error during verification." });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const rawMobile = req.body.mobile_number || req.body.mobileNo || req.body.mobile;
        if (!rawMobile) {
            return res.status(400).json({ status: "false", message: "Mobile number is required." });
        }

        const mobileNumber = normalizeMobile(rawMobile);
        const user = await User.findOne({ mobile_number: mobileNumber });

        if (!user) {
            return res.status(404).json({ status: "false", message: "Account not found." });
        }
        if (user.is_verified) {
            return res.status(400).json({ status: "false", message: "Account is already verified. Please log in." });
        }

        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        // Dispatch in background
        NotificationHub.dispatchOtp(user.email, mobileNumber, otp, "Resend: Verify your STM Club Account")
            .catch(e => console.error("Background dispatch failed:", e));

        return res.status(200).json({ status: "true", message: "OTP resent successfully." });
    } catch (error) {
        console.error("📱 Resend OTP Error:", error);
        return res.status(500).json({ status: "false", message: "Internal server error while resending OTP." });
    }
};

exports.logout = async (req, res) => {
    try {
        // Stateless context: Flutter Client simply drops the token from SecureStorage
        return res.status(200).json({ status: "true", message: "Logged out successfully." });
    } catch (error) {
        return res.status(500).json({ status: "false", message: "Logout processing failed." });
    }
};