// backend/controllers/mobile/membershipMobileController.js
const crypto = require("crypto");
const Membership = require("../../models/Membership.js");
const PurchasedMemberCard = require("../../models/PurchasedMemberCard.js");
const User = require("../../models/User.js");
const { 
    createRazorpayOrder, 
    generateDigitalCard, 
    MembershipNotifier,
    findMembershipPlan 
} = require("../shared/membershipService");

/**
 * 🛒 1. DISCOVERY: Get Active Membership Plans (Flutter Optimized)
 */
exports.getActiveMembershipPlans = async (req, res) => {
    try {
        const plans = await Membership.find({ status: 1 }).select('-__v').lean();
        return res.status(200).json({ status: "true", data: plans });
    } catch (error) {
        console.error("🚨 Mobile Membership Catalog Error:", error);
        return res.status(500).json({ status: "false", message: "Failed to fetch active membership plans." });
    }
};

/**
 * 🛡️ 2. THE VAULT: Secure Order Generation 
 */
exports.createOrder = async (req, res) => {
    try {
        // Support multiple payload keys just in case Flutter sends parameters under varied naming conventions
        const planId = req.body.membership_card_id || req.body.memberShipId || req.body.planId;
        const userId = req.user?.id || req.user?.userId;

        if (!planId) {
            return res.status(400).json({ status: "false", message: "Plan identifier required." });
        }

        // 🎯 Zero-Trust Validation: Query DB using helper to avoid CastErrors
        const plan = await findMembershipPlan(planId);
        if (!plan || plan.status !== 1) {
            return res.status(404).json({ status: "false", message: "Membership plan not found or inactive." });
        }

        // Delegate price calculation strictly to the secure gateway layer
        const order = await createRazorpayOrder(plan.price);

        // Idempotency: Create a Pending Record in MongoDB to trace checkouts
        await PurchasedMemberCard.create({
            user_id: userId,
            membership_card_id: plan._id,
            card_status: 0,      // 0 = Pending/Initiated Order
            payment_status: 1,   // 1 = Payment Pending
            razorpay_order_id: order.id,
            max_visits: plan.total_visits,
            paid_amount: plan.price
        });

        // 🎯 Flutter-specific response structure
        return res.status(200).json({
            status: "true",
            message: "Order generated successfully.",
            data: {
                user_id: req.user.sql_id || userId,
                membership_card_id: plan.sql_id || plan._id,
                paid_amount: String(plan.price),
                payment: {
                    razorpay_order_id: String(order.id),
                    razorpay_public_key: String(process.env.RAZORPAY_KEY_ID),
                    payment_status: 1
                }
            }
        });
    } catch (error) {
        console.error("🚨 Mobile Order Vault Error:", error);
        return res.status(500).json({ status: "false", message: "Gateway initialization error." });
    }
};

/**
 * 🔐 3. VERIFICATION & FULFILLMENT: Cryptographic Handshake
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
        const userId = req.user?.id || req.user?.userId;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
            return res.status(400).json({ status: "false", message: "Incomplete verification payload." });
        }

        // Cryptographic Signature Validation (HMAC SHA-256)
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error(`🚨 FRAUD ALERT: Signature mismatch during mobile verification for order: ${razorpay_order_id}`);
            return res.status(400).json({ status: "false", message: "Digital signature mismatch. Transaction aborted." });
        }

        const plan = await findMembershipPlan(planId);
        const pendingCard = await PurchasedMemberCard.findOne({ razorpay_order_id });
        const user = await User.findById(userId);

        if (!pendingCard || !plan || !user) {
            return res.status(404).json({ status: "false", message: "Transaction context lost." });
        }

        // Prevent double fulfillment
        if (pendingCard.card_status === 1) {
            return res.status(400).json({ status: "false", message: "Membership already activated." });
        }

        // Server-Side Expiry Calculations
        let endDate = new Date();
        if (plan.duration_type === 1) { // Months
            endDate.setMonth(endDate.getMonth() + plan.duration);
        } else { // Years
            endDate.setFullYear(endDate.getFullYear() + plan.duration);
        }

        // Fulfill the transaction record
        pendingCard.card_status = 1; // Active
        pendingCard.payment_status = 2; // Success
        pendingCard.razorpay_payment_id = razorpay_payment_id;
        pendingCard.start_date = new Date();
        pendingCard.end_date = endDate;
        await pendingCard.save();

        // 🔑 Unforgeable Digital Card Pass Generation
        const digitalToken = generateDigitalCard(user._id, plan.name, endDate, plan.total_visits);
        
        // Asynchronous channel broadcast (SMS & WhatsApp dispatch)
        MembershipNotifier.sendWelcomeCard(user.mobile_number, user.first_name, plan.name, digitalToken)
            .catch(e => console.error("Background Notification Failed:", e.message));

        return res.status(200).json({ 
            status: "true", 
            message: "Membership activated successfully.",
            digital_card_token: digitalToken
        });
        
    } catch (error) {
        console.error("🚨 Mobile Payment Verification Error:", error);
        return res.status(500).json({ status: "false", message: "Verification pipeline failure." });
    }
};