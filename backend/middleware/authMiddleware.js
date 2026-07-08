// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SuperAdmin = require("../models/SuperAdmin");
const TempleAdmin = require("../models/TempleAdmin");

/**
 * 🛠️ HELPER: COMMON USER NORMALIZATION
 */
const normalizeUserPayload = (user, decodedToken) => {
  const dbSqlId = user.sql_id ? Number(user.sql_id) : NaN;
  const tokenSqlId = decodedToken.sql_id ? Number(decodedToken.sql_id) : NaN;

  let finalSqlId = 0;
  if (!Number.isNaN(dbSqlId) && dbSqlId > 0) {
    finalSqlId = dbSqlId;
  } else if (!Number.isNaN(tokenSqlId) && tokenSqlId > 0) {
    finalSqlId = tokenSqlId;
  }

  return {
    ...user,
    _id: String(user._id),
    id: String(user._id),
    sql_id: finalSqlId,
  };
};

/**
 * =========================================================
 * 👑 TIER 1: SYSTEM CORE COMMAND (SUPER ADMIN)
 * =========================================================
 */
exports.protectSuperAdmin = async (req, res, next) => {
    try {
        let token = req.cookies?.admin_access_token;
        if (!token) return res.status(401).json({ success: false, message: "System Core Access Denied: No token." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 🎯 STRICTLY TARGETS SUPER ADMIN DB
        const admin = await SuperAdmin.findById(decoded.id).select("-password").lean();
        if (!admin || Number(admin.user_type) !== 1) {
            return res.status(403).json({ success: false, message: "Clearance Denied." });
        }
        
        req.admin = normalizeUserPayload(admin, decoded);
        req.user = req.admin; // Legacy compatibility alias
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Session expired or invalid token." });
    }
};

/**
 * =========================================================
 * 🛕 TIER 2: TEMPLE AUTHORITY COMMAND (TEMPLE ADMIN)
 * =========================================================
 */
exports.protectTempleAdmin = async (req, res, next) => {
    try {
        let token = req.cookies?.temple_admin_access_token;
        if (!token) return res.status(401).json({ success: false, message: "Temple Authority Access Denied." });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 🎯 STRICTLY TARGETS TEMPLE ADMIN DB
        const templeAdmin = await TempleAdmin.findById(decoded.id).select("-password").lean();
        if (!templeAdmin || Number(templeAdmin.user_type) !== 2 || !templeAdmin.is_active) {
            return res.status(403).json({ success: false, message: "Clearance Denied or Account Suspended." });
        }
        
        req.templeAdmin = normalizeUserPayload(templeAdmin, decoded);
        req.user = req.templeAdmin; // Legacy compatibility alias
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Session expired or invalid token." });
    }
};

/**
 * =========================================================
 * 📱 TIER 3: BFF MOBILE ACCELERATOR (DEVOTEES ONLY)
 * =========================================================
 */
exports.protectMobile = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) return res.status(401).json({ status: "false", success: false, message: "Mobile authorization failed: Bearer token required." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🎯 STRICTLY TARGETS USER DB
    const user = await User.findById(decoded.id).select("_id sql_id user_type role first_name email").lean();

    if (!user) return res.status(403).json({ status: "false", success: false, message: "Mobile session invalid: Account no longer exists." });

    req.user = normalizeUserPayload(user, decoded);
    return next();
  } catch (error) {
    let message = error.name === "JsonWebTokenError" ? "Malformed signature. Security validation failed." : "Session expired. Please login again.";
    return res.status(401).json({ status: "false", success: false, message });
  }
};

/**
 * =========================================================
 * 🌐 TIER 3: BFF WEB ACCELERATOR (DEVOTEES ONLY)
 * =========================================================
 */
exports.protectWeb = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ status: "false", success: false, message: "Web authorization failed: Session cookie missing." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🎯 STRICTLY TARGETS USER DB
    const user = await User.findById(decoded.id).select("_id sql_id user_type role first_name email").lean();

    if (!user) {
      res.clearCookie("access_token");
      return res.status(403).json({ status: "false", success: false, message: "Web session invalid: Cleaned expired profiles." });
    }

    req.user = normalizeUserPayload(user, decoded);
    return next();
  } catch (error) {
    return res.status(401).json({ status: "false", success: false, message: "Web session expired. Please refresh your browser dashboard." });
  }
};

/**
 * =========================================================
 * ⏳ LEGACY ROUTER PROTECTORS (SMART AUTO-DISCOVERY)
 * =========================================================
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    let targetModel = User; // Default to User DB

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } 
    else if (req.cookies) {
      if (req.cookies.admin_access_token) {
          token = req.cookies.admin_access_token;
          targetModel = SuperAdmin;
      } else if (req.cookies.temple_admin_access_token) {
          token = req.cookies.temple_admin_access_token;
          targetModel = TempleAdmin;
      } else {
          token = req.cookies.access_token;
      }
    }

    if (!token) return res.status(401).json({ status: "false", success: false, message: "Not authorized." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🎯 DYNAMIC DB QUERY BASED ON TOKEN ORIGIN
    const user = await targetModel.findById(decoded.id).select("_id sql_id user_type role first_name email").lean();
    if (!user) return res.status(403).json({ status: "false", success: false, message: "Account not found." });

    req.user = normalizeUserPayload(user, decoded);
    return next();
  } catch (error) {
    return res.status(401).json({ status: "false", success: false, message: "Session expired." });
  }
};

/**
 * 🛡️ REUSABLE ROLE VALIDATION INTERCEPTORS
 */
exports.authorize = (...types) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ status: "false", success: false, message: "Unauthorized: Profile matrix absent." });

    const currentUserType = Number(req.user.user_type);
    const allowedTypes = types.map(Number);

    if (!allowedTypes.includes(currentUserType)) {
      return res.status(403).json({ status: "false", success: false, message: `Forbidden: Access denied for role tier ${currentUserType}` });
    }
    next();
  };
};

// 🎯 LEGACY COMPATIBILITY: Checks if current user is SuperAdmin
exports.adminOnly = (req, res, next) => {
  if (req.admin || (req.user && (Number(req.user.user_type) === 1 || req.user.role === "admin"))) {
    return next();
  }
  return res.status(403).json({ status: "false", success: false, message: "Access denied: Administrative privileges required." });
};

exports.softProtectWeb = async (req, res, next) => {
  try {
    let token = req.cookies?.access_token;
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      res.clearCookie("access_token");
      req.user = null;
      return next();
    }

    req.user = normalizeUserPayload(user, decoded);
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};