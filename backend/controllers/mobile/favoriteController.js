const Favorite = require("../../models/Favorite");
const Temple = require("../../models/Temple");
const Ritual = require("../../models/Ritual");
const User = require("../../models/User"); 
const mongoose = require("mongoose");

const baseUrl = "https://api.sarvatirthamayi.com/";

const formatImageUrl = (imgPath) => {
  if (!imgPath) return `${baseUrl}uploads/default.png`;
  if (String(imgPath).startsWith("http")) return imgPath;
  const cleanPath = String(imgPath).replace(/\\/g, "/");
  return `${baseUrl}${cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath}`;
};

const resolveFavoriteTarget = async (referenceId, type) => {
  const favType = Number(type);
  const rawId = referenceId;

  try {
    let targetDoc = null;

    if (favType === 1) { // 1 = Temple
      targetDoc = await Temple.findOne({
        $or: [
          { sql_id: Number(rawId) || -1 },
          { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : new mongoose.Types.ObjectId() }
        ],
        status: 1
      }).lean();

      if (!targetDoc) return null;
      return {
        id: Number(targetDoc.sql_id) || 0,
        temple_id: Number(targetDoc.sql_id) || 0,
        name: String(targetDoc.name || ""),
        description: String(targetDoc.short_description || ""),
        image: String(targetDoc.image || ""),
        temple_name: String(targetDoc.name || ""),
        type_str: "Temple",
      };
    }

    if (favType === 2) { // 2 = Ritual
      targetDoc = await Ritual.findOne({
        $or: [
          { sql_id: Number(rawId) || -1 },
          { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : new mongoose.Types.ObjectId() }
        ],
        status: 1
      }).populate("temple_id").lean();

      if (!targetDoc) return null;
      return {
        id: Number(targetDoc.sql_id) || 0,
        temple_id: Number(targetDoc.temple_id?.sql_id || 0),
        name: String(targetDoc.name || ""),
        description: String(targetDoc.description || ""),
        image: String(targetDoc.image || ""),
        temple_name: String(targetDoc.temple_id?.name || ""),
        type_str: "Ritual",
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

// --- GET FAVORITES INDEX (Strictly Typed for Dart FavouriteGetModel) ---
exports.getFavorites = async (req, res) => {
  try {
    // Get the user's sql_id for filtering
    const user = await User.findById(req.user.id).lean();
    if (!user) throw new Error("User not found");
    const userId = Number(user.sql_id);

    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = Math.max(Number(req.query.per_page) || 10, 1);
    const skip = (page - 1) * perPage;

    const query = { user_id: userId, status: 1 };
    const totalCount = await Favorite.countDocuments(query);
    const favorites = await Favorite.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    const mappedData = [];

    for (const fav of favorites) {
      const target = await resolveFavoriteTarget(fav.reference_id, fav.type);
      if (target) {
        mappedData.push({
          // 🎯 EXACT MATCH for Datum class in Dart
          id: Number(fav.sql_id) || 0,
          user_id: Number(fav.user_id) || 0,
          reference_id: Number(fav.reference_id) || 0,
          temple_id: Number(target.temple_id) || 0,
          temple_name: String(target.temple_name || ""),
          type: Number(fav.type) || 0,
          type_str: String(target.type_str || ""),
          name: String(target.name || ""),
          description: String(target.description || ""),
          image: String(formatImageUrl(target.image)),
          is_favorite: 1,
        });
      }
    }

    const totalPages = Math.max(Math.ceil(totalCount / perPage), 1);

    return res.status(200).json({
      status: "true",
      message: "Favourite list fetched successfully",
      // 🎯 EXACT MATCH for Data pagination class in Dart
      data: {
        data: mappedData,
        total_count: Number(totalCount),
        is_next: page < totalPages,
        is_prev: page > 1,
        total_pages: Number(totalPages),
        current_page: Number(page),
        per_page: Number(perPage),
        from: mappedData.length ? skip + 1 : 0,
        to: skip + mappedData.length,
        next_page_url: page < totalPages ? `${baseUrl}api/v1/mobile/favorite/index?page=${page + 1}` : null,
        prev_page_url: page > 1 ? `${baseUrl}api/v1/mobile/favorite/index?page=${page - 1}` : null,
        path: `${baseUrl}api/v1/mobile/favorite/index`,
        has_pages: totalPages > 1,
        links: [],
      },
    });
  } catch (error) {
    // 🛡️ THE FALLBACK: Send empty pagination object so Dart doesn't crash on error
    return res.status(200).json({
      status: "false",
      message: error.message,
      data: {
        data: [],
        total_count: 0,
        is_next: false,
        is_prev: false,
        total_pages: 0,
        current_page: 1,
        per_page: 10,
        from: 0,
        to: 0,
        next_page_url: null,
        prev_page_url: null,
        path: `${baseUrl}api/v1/mobile/favorite/index`,
        has_pages: false,
        links: [],
      },
    });
  }
};

// --- TOGGLE FAVORITE (Add / Remove) ---
exports.toggleFavorite = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) throw new Error("User not found");
    const userId = Number(user.sql_id);

    const { reference_id, type, action } = req.body;
    if (!reference_id || !type) {
       // 🎯 EXACT MATCH for FavouriteModel: data MUST be an array
       return res.status(400).json({ status: "false", message: "Missing fields", data: [] });
    }

    const target = await resolveFavoriteTarget(reference_id, type);
    if (!target) {
      return res.status(404).json({ status: "false", message: "Target not found", data: [] });
    }

    const filter = {
      user_id: userId,
      reference_id: Number(target.id),
      type: Number(type),
    };

    if (Number(action) === 1) {
      const existing = await Favorite.findOne(filter).lean();
      if (!existing) {
        const lastDoc = await Favorite.findOne().sort({ sql_id: -1 }).lean();
        await Favorite.create({
          sql_id: (lastDoc?.sql_id || 0) + 1,
          user_id: userId,
          reference_id: Number(target.id),
          temple_id: Number(target.temple_id || 0),
          type: Number(type),
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
      return res.status(200).json({ status: "true", message: "Favourite added successfully", data: [] });
    }

    await Favorite.deleteOne(filter);
    return res.status(200).json({ status: "true", message: "Favourite removed successfully", data: [] });

  } catch (error) {
    return res.status(500).json({ status: "false", message: error.message, data: [] });
  }
};