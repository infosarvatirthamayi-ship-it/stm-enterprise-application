const Temple = require("../../models/Temple");
const State = require("../../models/State");
const Membership = require("../../models/Membership");
const Favorite = require("../../models/Favorite");
const User = require("../../models/User");
const formatImageUrl = require("../../utils/imageUrl");
const mongoose = require("mongoose");

/* ---------------------------------------------------
   ARCHITECTURE: SHARED RESPONSE NORMALIZER
   Ensures Frontend always receives { success, data }
   --------------------------------------------------- */
const sendResponse = (res, statusCode, success, data, message = "") => {
  return res.status(statusCode).json({
    status: success ? "true" : "false",
    success,
    data,
    message,
  });
};

/* ---------------------------------------------------
   INTERNAL HELPERS
   --------------------------------------------------- */
const getAuthUserSqlId = async (req) => {
  const directSqlId = Number(req.user?.sql_id || req.user?.user_id);
  if (!Number.isNaN(directSqlId) && directSqlId > 0) return directSqlId;

  const mongoUserId = req.user?._id || req.user?.id;
  if (mongoUserId) {
    const dbUser = await User.findById(mongoUserId).select("sql_id").lean();
    return Number(dbUser?.sql_id || 0);
  }
  return 0;
};

const buildTempleQuery = (stateName, search) => {
  const query = { status: 1 };
  if (stateName && stateName.trim() !== "" && stateName !== "undefined") {
    query.state_name = { $regex: new RegExp(stateName.trim(), "i") };
  }
  if (search && search.trim() !== "" && search !== "undefined") {
    query.$or = [
      { name: { $regex: new RegExp(search.trim(), "i") } },
      { city_name: { $regex: new RegExp(search.trim(), "i") } }
    ];
  }
  return query;
};

// =========================================================================
// 📱 MOBILE TIER (Flutter Optimized)
// =========================================================================
exports.getMobileTemples = async (req, res) => {
  try {
    const { stateName, search, page = 1, per_page = 15 } = req.query;
    const limit = parseInt(per_page, 10);
    const skip = (parseInt(page, 10) - 1) * limit;

    const query = buildTempleQuery(stateName, search);
    const [temples, totalCount] = await Promise.all([
      Temple.find(query).select("sql_id name city_name visit_price image").sort({ sequence: 1 }).skip(skip).limit(limit).lean(),
      Temple.countDocuments(query)
    ]);

    const authUserSqlId = await getAuthUserSqlId(req);
    const favorites = authUserSqlId > 0 ? await Favorite.find({ user_id: authUserSqlId, type: 1 }).select("reference_id").lean() : [];
    const favoriteSet = new Set(favorites.map(f => Number(f.reference_id)));

    const templeData = temples.map(t => ({
      id: parseInt(t.sql_id) || 0,
      name: t.name || "",
      city_name: t.city_name || "",
      is_favorite: favoriteSet.has(Number(t.sql_id)) ? 1 : 0,
      image: formatImageUrl(t.image),
    }));

    return sendResponse(res, 200, true, { data: templeData, total_count: totalCount });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};


/**
 * 📱 MOBILE TIER: Fetch Temple by ID
 * Ensures mobile app doesn't crash on invalid lookups
 */
exports.getMobileTempleById = async (req, res) => {
  try {
    const { id } = req.body; // Flutter often sends ID in the body

    if (!id || id === "undefined" || id === "null") {
      return sendResponse(res, 400, false, null, "Valid identifier required.");
    }

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: new mongoose.Types.ObjectId(id) } : { sql_id: parseInt(id, 10) };

    const temple = await Temple.findOne(query).lean();
    if (!temple) return sendResponse(res, 404, false, null, "Temple not found.");

    const authUserSqlId = await getAuthUserSqlId(req);
    let isFavorite = 0;
    if (authUserSqlId > 0) {
      isFavorite = (await Favorite.exists({ user_id: authUserSqlId, reference_id: temple.sql_id, type: 1, status: 1 })) ? 1 : 0;
    }

    return sendResponse(res, 200, true, {
      ...temple,
      id: parseInt(temple.sql_id) || 0,
      is_favorite: isFavorite,
      image: formatImageUrl(temple.image)
    });
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};
// =========================================================================
// 🌐 WEB TIER (React Dashboard Optimized)
// =========================================================================
exports.getWebTemples = async (req, res) => {
  try {
    const { stateName, search, page = 1, per_page = 15 } = req.query;
    const query = buildTempleQuery(stateName, search);
    
    const temples = await Temple.find(query).sort({ sequence: 1 }).skip((page - 1) * per_page).limit(parseInt(per_page)).lean();
    
    const authUserSqlId = await getAuthUserSqlId(req);
    const favorites = authUserSqlId > 0 ? await Favorite.find({ user_id: authUserSqlId, type: 1 }).lean() : [];
    const favoriteSet = new Set(favorites.map(f => Number(f.reference_id)));

    const templeData = temples.map(t => ({
      ...t,
      id: parseInt(t.sql_id) || 0,
      is_favorite: favoriteSet.has(Number(t.sql_id)) ? 1 : 0,
      image: formatImageUrl(t.image),
    }));

    return sendResponse(res, 200, true, templeData); // 👈 Fixed: Data is now at the root
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

// =========================================================================
// 🎯 SHARED UTILITIES
// =========================================================================
exports.getActiveMembershipPlans = async (req, res) => {
    try {
        const plans = await Membership.find({ status: 1 });
        
        // This structure matches: res.data.data.data
        return res.status(200).json({
            success: true,
            data: {
                data: plans // The second 'data' key satisfies the frontend requirement
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error" });
    }
};

exports.getPublicStates = async (req, res) => {
  try {
    const states = await State.distinct("name", { status: 1 });
    return sendResponse(res, 200, true, states.sort());
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};

exports.getWebTempleById = async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { sql_id: req.params.id };
    const temple = await Temple.findOne(query).lean();
    if (!temple) return sendResponse(res, 404, false, null, "Temple not found");
    return sendResponse(res, 200, true, temple);
  } catch (error) {
    return sendResponse(res, 500, false, null, error.message);
  }
};