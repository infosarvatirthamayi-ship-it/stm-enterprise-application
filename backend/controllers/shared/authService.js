// backend/controllers/shared/authService.js
const jwt = require("jsonwebtoken");
const { getFullImageUrl } = require("../../utils/config");

/**
 * 🎫 1. PLATFORM-AWARE TOKEN GENERATOR
 * Generates JWTs with lifetimes tailored to the specific client.
 */
exports.generateAccessToken = (user, platform = 'web') => {
    // 🎯 Dynamically build the payload based on the User's Tier
    const payload = { 
        id: user._id.toString(), 
        sql_id: user.sql_id || 0,
        role: user.role || "user",
        user_type: Number(user.user_type || 3),
        platform_origin: platform // Tags the token with its origin (mobile vs web)
    };
    
    // 🛕 If this is a Temple Admin, inject their specific Temple lock!
    if (user.temple_id) {
        payload.temple_id = user.temple_id;
    }

    // 🎯 SMART EXPIRY: Mobile apps stay logged in longer (90 days) for better UX. Web gets 30 days.
    const expiresIn = platform === 'mobile' ? '90d' : '30d';

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * 👤 2. PLATFORM-AWARE USER DATA SERIALIZATION
 * Normalizes DB models uniformly for both React Web and Flutter Clients
 */
exports.serializeUser = (user, platform = 'web') => {
    if (!user) return null;
    
    // Core Profile (Universal across all platforms)
    const baseProfile = {
        id: user._id.toString(),
        mongo_id: user._id.toString(),
        sql_id: String(user.sql_id || 0),
        email: user.email || "",
        role: user.role || "user",
        is_verified: user.is_verified || false,
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        mobile_number: user.mobile_number || "",
        profile_picture: user.profile_picture ? getFullImageUrl(user.profile_picture) : "",
        banner_image: user.banner_image ? getFullImageUrl(user.banner_image) : "",
        date_of_birth: user.date_of_birth || "",
        gender: String(user.gender || "1"),
        user_type: String(user.user_type || "3")
    };

    // 🎯 MOBILE SPECIFIC INJECTIONS (Flutter Friendly)
    if (platform === 'mobile') {
        baseProfile.userId = user._id.toString(); // Flutter often expects camelCase IDs
        baseProfile.isMobileClient = true;
    }

    return baseProfile;
};

/**
 * 🛠️ 3. DATA SANITIZATION UTILITIES (Platform Agnostic)
 */
exports.normalizeMobile = (mobile) => {
    const rawInput = String(mobile || "").trim();
    if (!rawInput) return "";
    
    // If it already has a plus, just clean the digits and keep the plus
    if (rawInput.startsWith("+")) return `+${rawInput.replace(/\D/g, "")}`;
    
    // If no plus, strip it down to pure digits
    let digits = rawInput.replace(/\D/g, "");
    if (digits.length < 7) return ""; // Minimum valid length for international numbers
    
    // Fallback logic for local Indian numbers missing the country code
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    
    return `+${digits}`;
};

exports.normalizeEmail = (email) => String(email || "").toLowerCase().trim();

exports.generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();