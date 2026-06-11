const Temple = require("../../models/Temple");
const State = require("../../models/State");
const Membership = require("../../models/Membership");
const Favorite = require("../../models/Favorite");
const User = require("../../models/User");
const formatImageUrl = require("../../utils/imageUrl");
const mongoose = require("mongoose");

/**
 * Resolve logged-in user's numeric sql_id
 */
const getAuthUserSqlId = async (req) => {
  const directSqlId = Number(req.user?.sql_id || req.user?.user_id);
  if (!Number.isNaN(directSqlId) && directSqlId > 0) return directSqlId;

  const mongoUserId = req.user?._id || req.user?.id;
  if (mongoUserId) {
    const dbUser = await User.findById(mongoUserId).select("sql_id").lean();
    const dbSqlId = Number(dbUser?.sql_id);
    if (!Number.isNaN(dbSqlId) && dbSqlId > 0) return dbSqlId;
  }
  return 0;
};

/**
 * 2. Get Public Temples (List View)
 */
exports.getPublicTemples = async (req, res) => {
  try {
    const { stateName, search, page = 1, per_page = 15 } = req.query;
    const query = { status: 1 };

    if (stateName && stateName.trim() !== "" && stateName !== "undefined") {
      query.state_name = { $regex: new RegExp(stateName.trim(), "i") };
    }

    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: new RegExp(search.trim(), "i") } },
        { city_name: { $regex: new RegExp(search.trim(), "i") } },
        { state_name: { $regex: new RegExp(search.trim(), "i") } }
      ];
    }

    const currentPage = parseInt(page, 10);
    const limit = parseInt(per_page, 10);
    const skip = (currentPage - 1) * limit;

    const totalCount = await Temple.countDocuments(query);
    const temples = await Temple.find(query).sort({ sequence: 1 }).skip(skip).limit(limit).lean();

    const authUserSqlId = await getAuthUserSqlId(req);
    let favoriteSet = new Set();
    if (authUserSqlId > 0) {
      const favoriteDocs = await Favorite.find({ user_id: authUserSqlId, type: 1, status: 1 }).lean();
      favoriteSet = new Set(favoriteDocs.map((fav) => Number(fav.reference_id)));
    }

    const templeData = temples.map((t) => ({
      _id: t._id,
      id: parseInt(t.sql_id) || 0,
      name: t.name || "",
      city_name: t.city_name || "",
      is_free_today: t.is_free_today || false,
      is_discount_active: t.is_discount_active || false,
      visit_price: t.visit_price || 0,
      open_time: t.open_time || "",
      close_time: t.close_time || "",
      is_favorite: favoriteSet.has(Number(t.sql_id)) ? 1 : 0,
      image: formatImageUrl(t.image),
    }));

    return res.status(200).json({
      status: "true",
      success: true,
      data: { data: templeData, total_count: totalCount, current_page: currentPage, per_page: limit },
    });
  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message });
  }
};

/**
 * 3. Get Temple Details (Bulletproof Version)
 */
exports.getPublicTempleById = async (req, res) => {
  try {
    const { id } = req.params;

    // 🛡️ CRITICAL GUARD: Prevent 500 crashes from "undefined" or malformed IDs
    if (!id || id === "undefined" || id === "null" || id === "NaN") {
      return res.status(400).json({ success: false, message: "Invalid Temple ID provided" });
    }

    // Determine if the ID is a MongoDB ObjectId or an SQL numeric ID
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: new mongoose.Types.ObjectId(id) } : { sql_id: parseInt(id, 10) };

    const temple = await Temple.findOne(query).lean();

    if (!temple) {
      return res.status(404).json({ success: false, message: "Temple not found" });
    }

    // Favorite status check
    const authUserSqlId = await getAuthUserSqlId(req);
    let isFavorite = 0;
    if (authUserSqlId > 0) {
      isFavorite = (await Favorite.exists({ user_id: authUserSqlId, reference_id: temple.sql_id, type: 1, status: 1 })) ? 1 : 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        ...temple,
        id: temple.sql_id,
        is_favorite: isFavorite,
        image: formatImageUrl(temple.image)
      }
    });
  } catch (error) {
    console.error("Temple Fetch Error:", error);
    return res.status(500).json({ success: false, message: "Server error occurred" });
  }
};

/**
 * 4. Get Active Membership Plans
 */
exports.getActiveMembershipPlans = async (req, res) => {
  try {
    const plans = await Membership.find({ status: 1 }).sort({ price: 1 }).lean();
    return res.status(200).json({ success: true, data: plans });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1. Get States for Dropdown
 */
exports.getPublicStates = async (req, res) => {
  try {
    const uniqueStateNames = await State.distinct("name", { status: 1 });
    const states = uniqueStateNames.sort().map((name, index) => ({
      _id: index,
      name,
    }));

    return res.status(200).json({
      status: "true",
      success: true,
      data: states,
    });
  } catch (error) {
    return res.status(500).json({
      status: "false",
      success: false,
      message: error.message,
    });
  }
};