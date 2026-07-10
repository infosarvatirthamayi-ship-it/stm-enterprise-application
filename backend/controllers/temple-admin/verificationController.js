// backend/controllers/temple-admin/verificationController.js
const mongoose = require("mongoose");

// 🧠 Smart Model Loaders
const getPurchasedCardModel = () => mongoose.models.PurchasedMemberCard || require("../../models/PurchasedMemberCard");
const getUserModel = () => mongoose.models.User || require("../../models/User");
const getMembershipModel = () => mongoose.models.MembershipPlan || mongoose.models.Membership || require("../../models/MembershipPlan");

exports.validateQRPass = async (req, res) => {
    try {
        const { cardId } = req.params;

        // Ensure cardId is valid before querying to prevent CastErrors
        if (!cardId) {
            return res.status(400).json({ success: false, message: "No QR data provided." });
        }

        const PurchasedCard = getPurchasedCardModel();

        // 1. Find the specific purchased card using the ID from the QR code.
        // We populate the user details and the underlying plan details.
        const activeCard = await PurchasedCard.findOne({ 
            _id: cardId 
        })
        .populate('user_id', 'first_name last_name email mobile_number')
        .populate('membership_card_id', 'name price duration duration_type')
        .lean();

        // 2. If it doesn't exist, it's a fake or deleted card
        if (!activeCard) {
            return res.status(404).json({ 
                success: false, 
                message: "SECURITY ALERT: Pass not found in the vault. This may be a fraudulent QR code." 
            });
        }

        // 3. Status checks
        // card_status: 1 usually means active in your system
        // payment_status: 2 means paid
        if (activeCard.payment_status !== 2 || activeCard.card_status === 0) {
             return res.status(403).json({ 
                success: false, 
                message: "Access Denied: Payment incomplete or membership pending activation." 
            });
        }

        const currentDate = new Date();
        const expiryDate = new Date(activeCard.end_date);
        const isExpired = currentDate > expiryDate;

        // 4. Safely extract personalization data (The 5 selected temples)
        const favoriteTemples = activeCard.personalization?.selected_temples || [];
        const importantDate = activeCard.personalization?.anniversary || null;
        
        // Safely extract user details
        const user = activeCard.user_id || {};
        const firstName = user.first_name || '';
        const lastName = user.last_name || '';
        const planName = activeCard.membership_card_id?.name || 'Unknown Plan';

        // 5. Send clean, aggregated data back to the Temple Admin's scanner UI
        res.status(200).json({
            success: true,
            data: {
                status: isExpired ? "EXPIRED" : "ACTIVE",
                cardholder: `${firstName} ${lastName}`.trim() || 'Unknown Member',
                contact: user.mobile_number || 'N/A',
                planName: planName,
                // Usually individual cards allow 1 person, but use max_visits if it represents headcount
                membersCount: activeCard.max_visits || 1, 
                validUntil: activeCard.end_date,
                importantDate: importantDate,
                favoriteTemples: favoriteTemples
            }
        });

    } catch (error) {
        console.error("🚨 Temple Admin Validation Error:", error);
        
        // Handle specific Mongoose CastError (e.g., if the QR string isn't a valid ObjectId)
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid QR Code format." });
        }

        res.status(500).json({ success: false, message: "Server error during pass validation." });
    }
};