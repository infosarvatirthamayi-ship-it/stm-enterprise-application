const Membership = require("../../models/Membership");
const Temple = require("../../models/Temple");

/**
 * @desc Get Active Membership Plans (Mobile Format)
 */
exports.getActiveMembershipPlans = async (req, res) => {
    try {
        const plans = await Membership.find({ status: 1 }).lean();
        return res.status(200).json({ success: true, data: plans });
    } catch (error) {
        console.error("Mobile Membership Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch plans" });
    }
};

/**
 * @desc Get Public States
 */
exports.getPublicStates = async (req, res) => {
    // You can call a shared service here: const { getStates } = require("../shared/dataService");
    return res.status(200).json({ success: true, data: [] });
};

/**
 * @desc Get Mobile Temples (Index)
 */
exports.getMobileTemples = async (req, res) => {
    try {
        const temples = await Temple.find({ status: 1 }).lean();
        return res.status(200).json({ success: true, data: temples });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching temples" });
    }
};

/**
 * @desc Get Single Temple By ID
 */
exports.getMobileTempleById = async (req, res) => {
    try {
        const temple = await Temple.findById(req.body.id).lean();
        if (!temple) return res.status(404).json({ success: false, message: "Not found" });
        return res.status(200).json({ success: true, data: temple });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error" });
    }
};