// 🎯 CORRECTED: Pointing to the isolated TempleAdmin database
const TempleAdmin = require("../../models/TempleAdmin");
const jwt = require("jsonwebtoken");

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

    // 🎯 STRICT ISOLATION: Only searches the TempleAdmin collection
    const user = await TempleAdmin.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: "Temple Authority account not found." });
    }

    // 🚨 Extra Security: Check if Super Admin disabled this account
    if (!user.is_active) {
        return res.status(403).json({ success: false, message: "This Temple Admin account has been suspended by System Core." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

    // 🎯 INJECTED TEMPLE ID: Crucial for backend data fetching
    const token = jwt.sign(
      { 
          id: user._id, 
          role: user.role, 
          user_type: user.user_type, 
          temple_id: user.temple_id // Now the backend knows WHICH temple they control!
      },
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
        temple_id: user.temple_id // Passed to frontend React context
      }
    });
  } catch (err) {
    console.error("Temple Admin Login Error:", err);
    return res.status(500).json({ success: false, message: "Server encountered an error." });
  }
};

/**
 * 🛕 TEMPLE ADMIN LOGOUT
 */
exports.templeAdminLogout = async (req, res) => {
  res.clearCookie("temple_admin_access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/"
  });
  return res.status(200).json({ success: true, message: "Temple Admin logged out successfully." });
};