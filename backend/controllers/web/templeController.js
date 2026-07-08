// backend/controllers/web/templeController.js
const Temple = require("../../models/Temple");
const State = require("../../models/State");
const Favorite = require("../../models/Favorite");
const User = require("../../models/User");
const formatImageUrl = require("../../utils/imageUrl");
const mongoose = require("mongoose");

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

// --- Web Endpoints ---

exports.getWebTemples = async (req, res) => {
    try {
        const { stateName, search, page = 1, per_page = 15 } = req.query;
        const query = buildTempleQuery(stateName, search);
        
        const temples = await Temple.find(query)
            .sort({ sequence: 1 })
            .skip((page - 1) * per_page)
            .limit(parseInt(per_page))
            .lean();
        
        const authUserSqlId = await getAuthUserSqlId(req);
        const favorites = authUserSqlId > 0 ? await Favorite.find({ user_id: authUserSqlId, type: 1 }).lean() : [];
        const favoriteSet = new Set(favorites.map(f => Number(f.reference_id)));

        const templeData = temples.map(t => ({
            ...t,
            id: parseInt(t.sql_id) || 0,
            is_favorite: favoriteSet.has(Number(t.sql_id)) ? 1 : 0,
            image: formatImageUrl(t.image),
        }));

        return res.status(200).json({ status: "true", success: true, data: templeData });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getWebTempleById = async (req, res) => {
    try {
        const query = mongoose.Types.ObjectId.isValid(req.params.id) 
            ? { _id: req.params.id } 
            : { sql_id: req.params.id };
            
        const temple = await Temple.findOne(query).lean();
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found" });
        
        return res.status(200).json({ status: "true", success: true, data: temple });
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