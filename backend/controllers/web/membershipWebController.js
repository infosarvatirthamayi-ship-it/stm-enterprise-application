// backend/controllers/web/membershipWebController.js
const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

// 🛡️ Initialize Razorpay securely (Updated to RAZORPAY_KEY_SECRET)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🧠 Smart Model Loaders (Prevents "Model Missing" 500 Errors)
const getMembershipModel = () => mongoose.models.MembershipPlan || mongoose.models.Membership || require("../../models/MembershipPlan");
const getPurchasedCardModel = () => mongoose.models.PurchasedMemberCard || require("../../models/PurchasedMemberCard");
const getUserModel = () => mongoose.models.User || require("../../models/User");

// ============================================================================
// 🛒 1. DISCOVERY: Fetch Active Plans
// ============================================================================
exports.getActivePlans = async (req, res) => {
    try {
        const MembershipPlan = getMembershipModel();
        // Only fetch active plans and exclude internal MongoDB versioning (__v)
        const plans = await MembershipPlan.find({ status: 1 }).select('-__v').lean();
        
        return res.status(200).json({ 
            success: true, 
            status: "true",
            message: "Active plans retrieved successfully.",
            data: plans 
        });
    } catch (error) {
        console.error("🚨 Fetch Plans Error:", error);
        return res.status(500).json({ success: false, message: "Server error retrieving plans." });
    }
};

// ============================================================================
// 🛡️ 2. THE VAULT: Order Generation & Auto-DB Repair
// ============================================================================
exports.createOrder = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.user.id || req.user._id;

        if (!planId) {
            return res.status(400).json({ success: false, message: "Plan ID is required." });
        }

        const MembershipPlan = getMembershipModel();
        const PurchasedCard = getPurchasedCardModel();

        // 1. Zero Trust: Fetch price directly from DB. Never trust frontend pricing.
        const plan = await MembershipPlan.findById(planId);
        if (!plan) {
            return res.status(404).json({ success: false, message: "Membership plan not found." });
        }

        // 2. Generate Razorpay Order
        const amountInPaise = Math.round(Number(plan.price) * 100);
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `stm_club_${Date.now().toString().slice(-6)}`
        });

        // 🚀 Automatically drop the corrupted sql_id index if it exists
        try {
            await PurchasedCard.collection.dropIndex("sql_id_1");
            console.log("✅ Successfully dropped corrupted 'sql_id_1' index from MongoDB.");
        } catch (indexError) {
            // Silently ignore if the index was already dropped
        }

        // 3. Idempotency: Create a Pending Record
        await PurchasedCard.create({
            user_id: userId,
            membership_card_id: plan._id,
            card_status: 0,    // 0 = Pending Authorization
            payment_status: 1, // 1 = Payment Pending
            razorpay_order_id: order.id,
            max_visits: plan.total_visits || plan.visits || 5,
            paid_amount: plan.price,
            sql_id: undefined // Force undefined to ensure E11000 never triggers again
        });

        // 4. Return EXACT payload structure expected by JoinClub.jsx
        return res.status(200).json({
            success: true,
            status: "true",
            data: {
                payment: {
                    razorpay_order_id: order.id,
                    razorpay_public_key: process.env.RAZORPAY_KEY_ID,
                    paid_amount: plan.price
                }
            }
        });

    } catch (error) {
        console.error("🚨 Create Order 500 Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to generate secure checkout: " + error.message 
        });
    }
};

// ============================================================================
// 🔐 3. VERIFICATION & FULFILLMENT: Cryptographic Handshake
// ============================================================================
exports.verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            planId, 
            favoriteTemples, 
            birthday, 
            importantDate 
        } = req.body;
        
        const userId = req.user.id || req.user._id;

        // 1. Input Validation Guardrails
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Incomplete payment parameters." });
        }

        // 2. Cryptographic HMAC Check (Updated to RAZORPAY_KEY_SECRET)
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) 
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error(`🚨 FRAUD ALERT: Signature mismatch for User ${userId}`);
            return res.status(400).json({ success: false, message: "Digital signature mismatch. Transaction aborted." });
        }

        // 3. Retrieve Entities
        const MembershipPlan = getMembershipModel();
        const PurchasedCard = getPurchasedCardModel();
        
        const plan = await MembershipPlan.findById(planId);
        const pendingCard = await PurchasedCard.findOne({ razorpay_order_id });
        
        if (!pendingCard || !plan) {
            return res.status(404).json({ success: false, message: "Transaction context lost or invalid." });
        }

        // Prevent double-fulfillment of the same order
        if (pendingCard.card_status === 1) {
            return res.status(400).json({ success: false, message: "Order has already been fulfilled." });
        }

        // 4. RENEWAL ENGINE: Date Stacking Logic
        const existingActiveCard = await PurchasedCard.findOne({ 
            user_id: userId, 
            card_status: 1 
        }).sort({ end_date: -1 });
        
        let startDate = new Date();
        
        // If they have an active card, stack the dates
        if (existingActiveCard && existingActiveCard.end_date > new Date()) {
            startDate = new Date(existingActiveCard.end_date); 
            existingActiveCard.card_status = 2; // Marked as Superseded
            await existingActiveCard.save();
        }

        let endDate = new Date(startDate);
        if (plan.duration_type === 1) { // Months
            endDate.setMonth(endDate.getMonth() + (plan.duration || 12));
        } else { // Years
            endDate.setFullYear(endDate.getFullYear() + (plan.duration || 1));
        }

        // 5. Fulfill the Pending Card
        pendingCard.card_status = 1;      // 1 = Active
        pendingCard.payment_status = 2;   // 2 = Success
        pendingCard.razorpay_payment_id = razorpay_payment_id;
        pendingCard.start_date = startDate;
        pendingCard.end_date = endDate;
        
        // 6. Safe Personalization Injection
        if (favoriteTemples && Array.isArray(favoriteTemples) && favoriteTemples.length > 0) {
            pendingCard.personalization = {
                selected_temples: favoriteTemples,
                birthday: birthday && !isNaN(new Date(birthday)) ? new Date(birthday) : null,
                anniversary: importantDate && !isNaN(new Date(importantDate)) ? new Date(importantDate) : null
            };
        }
        
        await pendingCard.save();

        // 7. Return Success Payload to Client
        return res.status(200).json({ 
            success: true,
            status: "true", 
            message: "Membership activated securely.",
            data: pendingCard
        });

    } catch (error) {
        console.error("🚨 Verification Pipeline Error:", error);
        return res.status(500).json({ success: false, message: "Verification pipeline encountered an error." });
    }
};

// ============================================================================
// 💳 4. CARD RETRIEVAL
// ============================================================================
exports.getMyCard = async (req, res) => {
    try {
        const PurchasedCard = getPurchasedCardModel();
        
        const activeCard = await PurchasedCard.findOne({ 
            user_id: req.user._id || req.user.id,
            card_status: 1
        }).populate('membership_card_id').lean();

        if (!activeCard) {
            return res.status(200).json({ success: true, status: "true", data: null, message: "No active membership found." });
        }

        return res.status(200).json({ success: true, status: "true", data: activeCard });
    } catch (error) {
        console.error("🚨 Fetch Card 500 Error:", error);
        return res.status(500).json({ success: false, message: "Failed to retrieve membership card: " + error.message });
    }
};