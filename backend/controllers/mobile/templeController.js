// backend/controllers/mobile/templeController.js
const Temple = require("../../models/Temple");
const Favorite = require("../../models/Favorite");
const User = require("../../models/User");
const formatImageUrl = require("../../utils/imageUrl");
const mongoose = require("mongoose");
const State = require("../../models/State"); // Added this since getPublicStates uses it!

// --- Internal BFF Helpers ---
const getAuthUserSqlId = async (req) => {
    if (!req.user) return 0;
    const directSqlId = Number(req.user.sql_id || req.user.user_id);
    if (!Number.isNaN(directSqlId) && directSqlId > 0) return directSqlId;
    
    const mongoUserId = req.user._id || req.user.id;
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

// --- Mobile Endpoints ---

exports.getMobileTemples = async (req, res) => {
    try {
        const { stateName, search, page = 1, per_page = 15 } = req.query;
        const pageInt = parseInt(page, 10) || 1;
        const limitInt = parseInt(per_page, 10) || 15;
        const skip = (pageInt - 1) * limitInt;

        const query = buildTempleQuery(stateName, search);
        const [temples, totalCount] = await Promise.all([
            // 🎯 Added 'sequence' to the select query
            Temple.find(query).select("sql_id name city_name visit_price image sequence").sort({ sequence: 1 }).skip(skip).limit(limitInt).lean(),
            Temple.countDocuments(query)
        ]);

        const authUserSqlId = await getAuthUserSqlId(req);
        const favorites = authUserSqlId > 0 ? await Favorite.find({ user_id: authUserSqlId, type: 1 }).select("reference_id").lean() : [];
        const favoriteSet = new Set(favorites.map(f => Number(f.reference_id)));

        const templeData = temples.map(t => ({
            id: parseInt(t.sql_id) || 0,
            name: t.name || "",
            city_name: t.city_name || "",
            sequence: t.sequence || 0, // 🎯 Added for Flutter
            is_favorite: favoriteSet.has(Number(t.sql_id)) ? 1 : 0,
            image: formatImageUrl(t.image),
            image_thumb: formatImageUrl(t.image), // 🎯 Added missing image_thumb
        }));

        const totalPages = Math.ceil(totalCount / limitInt);

        // 🎯 Send the complete pagination object Flutter expects
        // 🎯 Send the complete pagination object AND the exact message Flutter expects
        return res.status(200).json({ 
            status: "true", 
            success: true, 
            message: "Temples list fetch successfully", // 🎯 EXACT STRING MATCH
            data: {
                data: templeData,
                total_count: totalCount,
                current_page: pageInt,
                per_page: limitInt,
                total_pages: totalPages,
                is_next: pageInt < totalPages,
                is_prev: pageInt > 1,
                has_pages: totalPages > 1,
                from: totalCount === 0 ? 0 : skip + 1,
                to: skip + templeData.length,
                path: "/api/v1/mobile/temple/index"
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMobileTempleById = async (req, res) => {
    try {
        const { id } = req.body; // Flutter sends ID in the body

        if (!id || id === "undefined" || id === "null") {
            return res.status(400).json({ success: false, message: "Valid identifier required." });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(id);
        const query = isObjectId ? { _id: new mongoose.Types.ObjectId(id) } : { sql_id: parseInt(id, 10) };

        const temple = await Temple.findOne(query).lean();
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found." });

        const authUserSqlId = await getAuthUserSqlId(req);
        let isFavorite = 0;
        if (authUserSqlId > 0) {
            isFavorite = (await Favorite.exists({ user_id: authUserSqlId, reference_id: temple.sql_id, type: 1, status: 1 })) ? 1 : 0;
        }

        return res.status(200).json({
            status: "true",
            success: true,
            data: {
                ...temple,
                id: parseInt(temple.sql_id) || 0,
                is_favorite: isFavorite,
                image: formatImageUrl(temple.image)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicStates = async (req, res) => {
    try {
        const states = await State.distinct("name", { status: 1 });
        return res.status(200).json({ status: "true", success: true, data: states.sort() });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};