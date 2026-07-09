/**
 * =========================================================================
 * 🌐 Sarvatirthamayi Core Authentication & Omnichannel Notification Controller
 * 🎯 STRICTLY ISOLATED TO DEVOTEES (USER_TYPE: 3)
 * =========================================================================
 */

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// 🛡️ Safe Twilio Initialization Fallback to protect local sandbox instances
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
    console.warn("⚠️ Warning: Twilio credentials missing. Telephony verification layers will fallback to local generation.");
}

/**
 * 🎯 EMAIL ENGINE (NODEMAILER)
 */
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 465),
    secure: true, 
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, 
    },
    family: 4,               
    socketTimeout: 30000,    
    greetingTimeout: 30000,
    tls: {
        rejectUnauthorized: false,
        servername: process.env.MAIL_HOST || 'smtp.gmail.com' 
    }
});

// =========================================================================
// 📡 1. OMNICHANNEL NOTIFICATION HUB (Parallel Execution Pipeline)
// =========================================================================
const NotificationHub = {
    dispatchOtp: async (email, formattedMobile, rawOtp, subject) => {
        const dispatches = [];

        if (Number(process.env.ENABLE_EMAIL_OTP) === 1 && email) {
            dispatches.push(
                transporter.sendMail({
                    from: `Sarvatirthamayi <${process.env.MAIL_FROM}>`,
                    to: email,
                    subject: subject || "Verification Code",
                    html: `<b>Your Sarvatirthamayi verification code is: <span style="font-size: 16px; letter-spacing: 1px;">${rawOtp}</span></b><p>Valid for 10 minutes. Do not share this secure passkey.</p>`,
                })
                .then(() => console.log(`✉️ OTP Email successfully dispatched to: ${email}`))
                .catch(err => console.error(`❌ Email Gateway Failed: ${err.message}`))
            );
        }

        if (Number(process.env.ENABLE_SMS_OTP) === 1 && formattedMobile && twilioClient) {
            dispatches.push(
                twilioClient.verify.v2
                    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                    .verifications.create({ to: formattedMobile, channel: 'sms' })
                    .then((v) => console.log(`📱 Twilio Verify SMS Dispatched. Status: ${v.status}`))
                    .catch(err => console.error(`❌ Twilio SMS Gateway Failed: ${err.message}`))
            );
        }

        if (Number(process.env.ENABLE_WHATSAPP_OTP) === 1 && formattedMobile && twilioClient) {
            dispatches.push(
                twilioClient.verify.v2
                    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                    .verifications.create({ to: `whatsapp:${formattedMobile}`, channel: 'whatsapp' })
                    .then((v) => console.log(`💬 Twilio WhatsApp Dispatched. Status: ${v.status}`))
                    .catch(err => console.error(`❌ WhatsApp Gateway Failed: ${err.message}`))
            );
        }

        await Promise.all(dispatches);
    },

    verifyMobileToken: async (formattedMobile, code) => {
        if (Number(process.env.ENABLE_SMS_OTP) === 0 && Number(process.env.ENABLE_WHATSAPP_OTP) === 0) {
            return true; 
        }
        if (!twilioClient) {
            console.error("🚨 Twilio client unavailable. Blocking code registration verification.");
            return false;
        }
        try {
            const check = await twilioClient.verify.v2
                .services(process.env.TWILIO_VERIFY_SERVICE_SID)
                .verificationChecks.create({ to: formattedMobile, code: String(code).trim() });
                
            return check.status === 'approved';
        } catch (error) {
            console.error("❌ Telephony token validation failure:", error.message);
            return false;
        }
    }
};

// =========================================================================
// 🛠️ 2. UTILITY PARSERS & IDENTITY SERIALIZERS
// =========================================================================

const getFullImageUrl = (path) => {
    if (!path) return "";
    const baseUrl = process.env.BASE_ASSET_URL || "http://localhost:5000";
    const cleanPath = String(path).replace(/\\/g, "/").replace(/^\/+/, ""); 
    return `${baseUrl}/${cleanPath}`;
};

const normalizeEmail = (email) => String(email || "").toLowerCase().trim();

const normalizeMobile = (mobile) => {
    const rawInput = String(mobile || "").trim();
    if (rawInput.startsWith("+")) return `+${rawInput.replace(/\D/g, "")}`;

    let digits = rawInput.replace(/\D/g, "");
    if (!digits || digits.length < 7) return ""; 

    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`; 

    return `+${digits}`;
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateAccessToken = (user) =>
    jwt.sign(
        { 
            id: user._id.toString(), 
            user_type: Number(user.user_type || 3), 
            role: user.role || "user", 
            sql_id: user.sql_id || 0 
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );

const serializeUserBase = (user) => ({
    id: user._id.toString(),
    user_id: user._id.toString(),
    userId: user._id.toString(),
    first_name: user.first_name || "",
    firstName: user.first_name || "",
    last_name: user.last_name || "",
    lastName: user.last_name || "",
    email: user.email || "",
    mobile_number: user.mobile_number || "",
    mobileNumber: user.mobile_number || "",
    user_type: String(user.user_type || 3),
    userType: String(user.user_type || 3),
    profile_picture: getFullImageUrl(user.profile_picture) || ""
});

const handleDuplicateKeyError = (error, res) => {
    if (error?.code !== 11000) return false;
    res.status(400).json({ status: "false", success: false, message: "Email or Mobile already exists." });
    return true;
};

// =========================================================================
// 🔄 3. CORE REGISTRATION & ACCOUNT RECOVERY PIPELINES (DEVOTEES ONLY)
// =========================================================================

exports.signUp = async (req, res) => {
    try {
        const { email, password, first_name } = req.body;
        const emailAddr = normalizeEmail(email);
        const cleanMobile = normalizeMobile(req.body.mobile_number || req.body.mobileNo);

        if (!first_name || !emailAddr || !cleanMobile || !password) {
            return res.status(400).json({ status: "false", message: "Missing required fields." });
        }

        let user = await User.findOne({ $or: [{ email: emailAddr }, { mobile_number: cleanMobile }] });
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        if (user) {
            if (user.is_verified) return res.status(400).json({ status: "false", message: "Account already exists. Please log in." });
            user.otp = otp;
            user.otp_expires = otpExpires;
            user.password = password;
            await user.save();
        } else {
            // 🎯 FORCES user_type: 3 (Devotee). Impossible to create an admin here.
            user = await User.create({
                first_name, email: emailAddr, mobile_number: cleanMobile,
                password, otp, otp_expires: otpExpires, is_verified: false, user_type: 3
            });
        }

        await NotificationHub.dispatchOtp(emailAddr, cleanMobile, otp, "Verify your Sarvatirthamayi Account");

        return res.status(200).json({
            status: "true",
            success: true,
            message: "Verification profile created. Authorization tokens dispatched.",
            data: { id: user._id.toString(), userId: user._id.toString() }
        });
    } catch (error) {
        if (handleDuplicateKeyError(error, res)) return;
        console.error("Signup Orchestration Fault:", error);
        return res.status(500).json({ status: "false", message: "Internal signup orchestration failure." });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const mobile = normalizeMobile(req.body.mobile_number || req.body.mobileNumber || req.body.mobileNo);
        const otp = String(req.body.otp || "").trim();

        const user = await User.findOne({ mobile_number: mobile });
        if (!user) return res.status(404).json({ status: "false", success: false, message: "User profile not found." });

        let isTokenValid = (user.otp === otp && user.otp_expires > Date.now());

        if (!isTokenValid && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
            isTokenValid = await NotificationHub.verifyMobileToken(mobile, otp);
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", success: false, message: "Invalid or expired authorization code." });

        user.is_verified = true;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        const token = generateAccessToken(user);
        return res.status(200).json({
            status: "true",
            success: true,
            message: "Account verification confirmed.",
            token: token,
            data: {
                ...serializeUserBase(user),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", message: error.message });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const mobileNumber = normalizeMobile(req.body.mobile_number || req.body.mobileNo);
        const user = await User.findOne({ mobile_number: mobileNumber });

        if (!user) return res.status(404).json({ status: "false", message: "User not found" });

        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await NotificationHub.dispatchOtp(user.email, mobileNumber, otp, "Resend: Verify your Sarvatirthamayi Account");

        return res.status(200).json({ status: "true", success: true, message: "OTP resent successfully across channels" });
    } catch (error) {
        return res.status(500).json({ status: "false", message: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const mobile = normalizeMobile(req.body.mobile_number || req.body.mobileNo);

        let user = email ? await User.findOne({ email }) : await User.findOne({ mobile_number: mobile });
        if (!user) return res.status(404).json({ status: "false", message: "No account found." });

        const otp = generateOtp();
        user.otp = otp;
        user.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await NotificationHub.dispatchOtp(user.email, user.mobile_number, otp, "Password Reset OTP - Sarvatirthamayi");

        return res.status(200).json({
            status: "true", success: true, message: "Recovery credentials dispatched.",
            data: { id: user._id.toString(), userId: user._id.toString() }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", message: "Server recovery pipeline error" });
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

        const tempToken = generateAccessToken(user);
        return res.status(200).json({
            status: "true",
            success: true,
            message: "OTP verified",
            token: tempToken,
            data: { id: user._id.toString(), accessToken: tempToken, userId: user._id.toString() }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { password, otp } = req.body;
        const confirmPassword = req.body.confirm_password || req.body.confirmPassword;
        const userId = req.body.user_id || req.body.userId;

        if (password !== confirmPassword) {
            return res.status(400).json({ status: "false", message: "Passwords do not match." });
        }

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(404).json({ status: "false", message: "User not found." });

        let isTokenValid = (user.otp === otp && user.otp_expires > Date.now());
        if (!isTokenValid && (Number(process.env.ENABLE_SMS_OTP) === 1 || Number(process.env.ENABLE_WHATSAPP_OTP) === 1)) {
            isTokenValid = await NotificationHub.verifyMobileToken(user.mobile_number, otp);
        }

        if (!isTokenValid) return res.status(400).json({ status: "false", message: "Invalid session or OTP." });

        user.password = password;
        user.otp = undefined;
        user.otp_expires = undefined;
        await user.save();

        const token = generateAccessToken(user);
        return res.status(200).json({
            status: "true",
            success: true,
            message: "Password reset successful",
            data: {
                ...serializeUserBase(user),
                access_token: token,
                accessToken: token
            }
        });
    } catch (error) {
        return res.status(500).json({ status: "false", message: "Server error" });
    }
};

// =========================================================================
// 🛡️ 4. LOGINS (WEB, MOBILE, UNIFIED) - ISOLATED TO DEVOTEES ONLY
// =========================================================================

exports.loginWeb = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password || "";

        if (!email || !password) return res.status(400).json({ success: false, message: "Credentials missing." });

        const user = await User.findOne({ email });
        
        if (!user || !user.is_verified || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: "Authentication failed: Invalid credentials." });
        }

        // 🚨 Failsafe Shield
        const type = Number(user.user_type);
        if (type === 1 || type === 2 || user.role === 'admin' || user.role === 'temple_admin') {
            return res.status(403).json({ success: false, message: "Access Denied: Admin credentials cannot be used here." });
        }

        const token = generateAccessToken(user);

        res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".sarvatirthamayi.com" : undefined,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: "/"
});

        return res.status(200).json({ success: true, message: "Web Portal Authentication Granted.", user: serializeUserBase(user) });
    } catch (error) {
        console.error("🌐 Web Login Crash:", error);
        return res.status(500).json({ success: false, message: "Internal server error during authentication." });
    }
};

exports.loginMobile = async (req, res) => {
    try {
        const mobile = normalizeMobile(req.body.mobile || req.body.mobile_number || req.body.mobileNo);
        const password = req.body.password || "";

        if (!mobile || !password) return res.status(400).json({ status: "false", success: false, message: "Mobile credentials missing." });

        const user = await User.findOne({ mobile_number: mobile });
        
        if (!user || !user.is_verified || !(await user.matchPassword(password))) {
            return res.status(401).json({ status: "false", success: false, message: "Invalid phone number or password." });
        }

        // 🚨 Failsafe Shield
        const type = Number(user.user_type);
        if (type === 1 || type === 2 || user.role === 'admin' || user.role === 'temple_admin') {
            return res.status(403).json({ status: "false", success: false, message: "Access Denied: Admin credentials cannot be used on the App." });
        }

        const token = generateAccessToken(user);

        return res.status(200).json({
            status: "true", success: true, message: "Mobile Session Activated Successfully",
            token: token,
            data: { ...serializeUserBase(user), access_token: token, accessToken: token }
        });
    } catch (error) {
        console.error("📱 Mobile Login Crash:", error);
        return res.status(500).json({ status: "false", success: false, message: "Mobile authentication pipeline error." });
    }
};

exports.loginUnified = async (req, res) => {
    try {
        const { email, mobile_number, password } = req.body;
        if (!password) return res.status(400).json({ status: "false", success: false, message: "Password is required." });

        let query = {};
        let isEmailLogin = false;

        if (email) {
            query.email = normalizeEmail(email);
            isEmailLogin = true;
        } else if (mobile_number) {
            const cleanMobile = normalizeMobile(mobile_number);
            if (!cleanMobile) return res.status(400).json({ status: "false", success: false, message: "Invalid mobile number format." });
            query.mobile_number = cleanMobile;
        } else {
            return res.status(400).json({ status: "false", success: false, message: "Missing fields (provide email or mobile number)." });
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(404).json({ status: "false", success: false, message: isEmailLogin ? "Email is not registered with us." : "Mobile number is not registered with us." });
        }

        // 🚨 Failsafe Shield
        const type = Number(user.user_type);
        if (type === 1 || type === 2 || user.role === 'admin' || user.role === 'temple_admin') {
            return res.status(403).json({ status: "false", success: false, message: "Access Denied: Please use your designated Admin Portal." });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) return res.status(401).json({ status: "false", success: false, message: "Incorrect password." });
        
        const token = generateAccessToken(user);
        res.cookie("access_token", token, { 
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: "lax", path: '/'
        });
        
        return res.status(200).json({ status: "true", success: true, message: "Authentication Granted.", user: serializeUserBase(user) });

    } catch (error) {
        console.error("Unified Login System Fault:", error);
        return res.status(500).json({ status: "false", success: false, message: "Server encountered an error." });
    }
};

// =========================================================================
// 🔄 5. SESSION & STATE MANAGEMENT
// =========================================================================

exports.refreshAccessToken = async (req, res) => {
    try {
        return res.status(200).json({ status: "true", success: true, message: "Token synchronization success.", data: [] });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: error.message });
    }
};

exports.checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User session profile missing" });
        return res.status(200).json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Identity validation error" });
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/"
        });
        return res.status(200).json({ status: "true", success: true, message: "Session tokens cleared successfully." });
    } catch (error) {
        return res.status(500).json({ status: "false", success: false, message: "Logout runtime fault." });
    }
};

// =========================================================================
// ⏳ 6. EXPORTS
// =========================================================================
exports.login = exports.loginUnified;

module.exports = {
    signUp: exports.signUp,
    verifyOtp: exports.verifyOtp,
    resendOtp: exports.resendOtp,
    forgotVerifyOtp: exports.forgotVerifyOtp,
    forgotPassword: exports.forgotPassword,
    resetPassword: exports.resetPassword,
    loginWeb: exports.loginWeb,
    loginMobile: exports.loginMobile,
    login: exports.login,
    logout: exports.logout,
    refreshAccessToken: exports.refreshAccessToken,
    checkAuth: exports.checkAuth
};