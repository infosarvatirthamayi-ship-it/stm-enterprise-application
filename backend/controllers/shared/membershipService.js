// backend/shared/membershipService.js
const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Membership = require("../../models/Membership");
const PurchasedMemberCard = require("../../models/PurchasedMemberCard");

// ============================================================================
// 🏦 1. PAYMENT GATEWAY INITIALIZATION (RAZORPAY)
// ============================================================================
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/**
 * Creates a secure Razorpay Order
 * @param {Number} amount - The amount in standard currency (INR)
 */
exports.createRazorpayOrder = async (amount) => {
    if (!amount || amount <= 0) throw new Error("Invalid payment amount provided.");
    
    return await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert accurately to paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    });
};


// ============================================================================
// 🗄️ 2. DATABASE UTILITIES
// ============================================================================
/**
 * Safely queries a membership plan by either SQL ID or Mongo ObjectId
 * @param {String|Number} rawId - The ID from the client
 */
exports.findMembershipPlan = async (rawId) => {
    if (!rawId) return null;

    const query = [];
    
    // Check if it's a valid number for SQL ID lookup
    const numId = parseInt(rawId, 10);
    if (!isNaN(numId)) {
        query.push({ sql_id: numId });
    }

    // Check if it's a valid MongoDB ObjectId string
    if (mongoose.Types.ObjectId.isValid(rawId)) {
        query.push({ _id: rawId });
    }

    if (query.length === 0) return null;

    return await Membership.findOne({ $or: query }).lean();
};


// ============================================================================
// 🔐 3. DIGITAL IDENTITY (JWT CARD GENERATOR)
// ============================================================================
/**
 * Generates an Unforgeable Digital Membership Card
 * Scanned by Temple Admins to verify access offline/online.
 */
exports.generateDigitalCard = (userId, tierName, expiryDate, remainingVisits) => {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing from environment variables.");

    return jwt.sign(
        { 
            uid: userId, 
            tier: tierName, 
            exp_date: expiryDate, 
            visits: remainingVisits 
        },
        process.env.JWT_SECRET,
        { expiresIn: "365d" } // Max validity of the token signature
    );
};


// ============================================================================
// 📲 4. OMNICHANNEL NOTIFICATION HUB (TWILIO)
// ============================================================================
// Safely initialize Twilio only if credentials exist
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Omnichannel Membership Notification Hub
 * Handles sending standard SMS and WhatsApp messages based on environment config.
 */
exports.MembershipNotifier = {
    
    sendWelcomeCard: async (mobile, name, tier, digitalCardToken) => {
        if (!twilioClient) {
            console.warn("⚠️ Twilio is not configured. Skipping Welcome Card SMS.");
            return;
        }

        const messageBody = `🙏 Namaskaram ${name},\nWelcome to the ${tier} Tier of Sarvatirthamayi! Your digital pass is active.\nView Card: https://sarvatirthamayi.com/card?token=${digitalCardToken}`;
        
        try {
            // 1. Send Standard SMS
            await twilioClient.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: mobile
            });

            // 2. Send WhatsApp (If enabled in .env)
            if (Number(process.env.ENABLE_WHATSAPP_ALERTS) === 1) {
                await twilioClient.messages.create({
                    body: messageBody,
                    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                    to: `whatsapp:${mobile}`
                });
            }
        } catch (error) {
            console.error("🚨 Notification Dispatch Failed (Welcome Card):", error.message);
        }
    },

    sendExpiryWarning: async (mobile, name, daysLeft) => {
        if (!twilioClient) {
            console.warn("⚠️ Twilio is not configured. Skipping Expiry Warning SMS.");
            return;
        }

        const messageBody = `⚠️ Namaskaram ${name}, your Sarvatirthamayi Membership expires in ${daysLeft} days. Renew now to maintain your sacred access and discounts: https://sarvatirthamayi.com/join-now`;
        
        try {
            // 1. Send Standard SMS
            await twilioClient.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: mobile
            });

            // 2. Send WhatsApp (If enabled in .env)
            if (Number(process.env.ENABLE_WHATSAPP_ALERTS) === 1) {
                await twilioClient.messages.create({
                    body: messageBody,
                    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                    to: `whatsapp:${mobile}`
                });
            }
        } catch (error) {
            console.error("🚨 Notification Dispatch Failed (Expiry Warning):", error.message);
        }
    }
};