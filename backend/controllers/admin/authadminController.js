const SuperAdmin = require("../../models/SuperAdmin");
const TempleAdmin = require("../../models/TempleAdmin");
const jwt = require("jsonwebtoken");
const { normalizeEmail, normalizeMobile } = require("../shared/authService");

/**
 * ==========================================
 * 👑 SUPER ADMIN COMMAND GATEWAY
 * ==========================================
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // 🎯 QUERY ISOLATED DATABASE: Only searches the Super Admin collection
    const user = await SuperAdmin.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "System Core access denied: Account not found." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Generate Super Admin Token
    const token = jwt.sign(
      { id: user._id, role: user.role, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Issue Super-Admin-Specific Secure Cookie
    res.cookie("admin_access_token", token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/"
    });

    // Update Last Login Security Log
    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "System Core Authentication Granted",
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        user_type: user.user_type 
      }
    });
  } catch (err) {
    console.error("Super Admin Login Error:", err);
    return res.status(500).json({ success: false, message: "Server encountered an error." });
  }
};

exports.adminLogout = async (req, res) => {
  res.clearCookie("admin_access_token", { path: "/" });
  return res.status(200).json({ success: true, message: "Super Admin logged out successfully." });
};

/**
 * ==========================================
 * 🛕 TEMPLE ADMIN COMMAND GATEWAY
 * ==========================================
 */
exports.templeAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // 🎯 QUERY ISOLATED DATABASE: Only searches the Temple Admin collection
    const user = await TempleAdmin.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "Temple Authority account not found." });
    }

    if (!user.is_active) {
        return res.status(403).json({ success: false, message: "This Temple Admin account has been suspended by System Core." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

    // Generate Temple Admin Token
    const token = jwt.sign(
      { id: user._id, role: user.role, user_type: user.user_type, temple_id: user.temple_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Issue Temple-Specific Secure Cookie
    res.cookie("temple_admin_access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/"
    });

    return res.status(200).json({
      success: true,
      message: "Temple Admin Authentication Granted",
      token: token, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        user_type: user.user_type,
        temple_id: user.temple_id
      }
    });
  } catch (err) {
    console.error("Temple Admin Login Error:", err);
    return res.status(500).json({ success: false, message: "Server encountered an error." });
  }
};

exports.templeAdminLogout = async (req, res) => {
  res.clearCookie("temple_admin_access_token", { path: "/" });
  return res.status(200).json({ success: true, message: "Temple Admin logged out successfully." });
};

/**
 * ==========================================
 * 🛠️ SUPER ADMIN: CREATE TEMPLE ADMIN
 * ==========================================
 */
exports.adminSignup = async (req, res) => {
    try {
        const { first_name, last_name, email, mobile_number, password, temple_id } = req.body;

        const cleanEmail = normalizeEmail(email);
        const cleanMobile = normalizeMobile(mobile_number);

        if (!first_name || !cleanEmail || !cleanMobile || !password || !temple_id) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // Check the isolated TempleAdmin collection for duplicates
        const adminExists = await TempleAdmin.findOne({ 
            $or: [{ email: cleanEmail }, { mobile_number: cleanMobile }] 
        });

        if (adminExists) {
            return res.status(400).json({ success: false, message: "A Temple Admin with these credentials already exists." });
        }

        // Create the record in the isolated collection
        const templeAdmin = await TempleAdmin.create({
            first_name,
            last_name: last_name || "",
            email: cleanEmail,
            mobile_number: cleanMobile,
            password: password,
            temple_id: temple_id
        });

        return res.status(201).json({ 
            success: true, 
            message: "Temple Admin successfully provisioned.",
            data: { id: templeAdmin._id, email: templeAdmin.email, temple_id: templeAdmin.temple_id }
        });
    } catch (error) {
        console.error("🚨 Temple Admin Provisioning Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};