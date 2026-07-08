// controllers/web/joinNowController.js
const Membership = require("../../models/Membership");

exports.getActiveMembershipPlans = async (req, res) => {
    try {
        const plans = await Membership.find({ status: 1 }).lean();
        
        // This specific structure satisfies your existing React frontend
        return res.status(200).json({
            success: true,
            data: {
                data: plans 
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error" });
    }
};