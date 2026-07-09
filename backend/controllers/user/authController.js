const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const { 
    generateAccessToken, 
    serializeUser, 
    normalizeEmail, 
    normalizeMobile, 
    generateOtp, 
    NotificationHub 
} = require("../shared/authService");

const COOKIE_OPTIONS = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", 
    domain: process.env.NODE_ENV === 'production' ? '.sarvatirthamayi.com' : undefined,
    maxAge: 30 * 24 * 60 * 60 * 1000, 
    path: '/'
};

exports.login = async (req, res) => {
    try {
        const { email, mobile_number, password } = req.body;
        
        if (!password) return res.status(400).json({ success: false, message: "Password is required." });

        let query = {};
        if (email) {
            query.email = email.trim().toLowerCase();
        } else if (mobile_number) {
            const cleanMobile = mobile_number.replace(/\D/g, "");
            query.mobile_number = { $regex: new RegExp(cleanMobile + "$") };
        } else {
            return res.status(400).json({ success: false, message: "Missing fields." });
        }

        // 🎯 QUERY ISOLATED DATABASE: Only searches Devotees
        const user = await User.findOne(query);
        
        if (!user) {
            // Because Admins are in different collections, Admin emails will trigger this 404 naturally!
            return res.status(404).json({ success: false, message: "Account not found. Please sign up." });
        }

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: "Incorrect password." });
        }

        // Failsafe check (Even though the collection only holds Devotees now)
        if (Number(user.user_type) !== 3) {
             return res.status(403).json({ success: false, message: "Invalid account type." });
        }
        
        const token = generateAccessToken(user);
        res.cookie("access_token", token, COOKIE_OPTIONS);
        
        return res.status(200).json({ success: true, user: serializeUser(user, 'web') });
    } catch (error) { 
        return res.status(500).json({ success: false, message: "Server error." }); 
    }
};

// ... (Signup, VerifyOTP, ResendOTP, and Logout remain functionally identical to your previous code because they only interact with Devotees)

exports.logout = async (req, res) => {
    res.clearCookie("access_token", { path: '/' });
    res.status(200).json({ success: true, message: "Logged out" });
};

exports.checkAuth = async (req, res) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return res.status(200).json({ success: true, authenticated: false });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // If a Super Admin token somehow gets here, findById will fail to find them in the User collection!
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