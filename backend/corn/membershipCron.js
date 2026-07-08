// backend/cron/membershipCron.js
const cron = require("node-cron");
const PurchasedMemberCard = require("../models/PurchasedMemberCard");
const User = require("../models/User");
const { MembershipNotifier } = require("../shared/membershipService");

/**
 * ⏰ Runs every day at 12:00 AM (Midnight) Server Time
 * Cron String: "0 0 * * *"
 */
exports.startCronJobs = () => {
    console.log("⏰ Membership Automation Engine Initialized.");

    cron.schedule("0 0 * * *", async () => {
        console.log("🔄 Running Daily Membership Checks...");
        const today = new Date();

        try {
            // ==========================================
            // 1. EXPIRY WARNINGS (7 Days Left)
            // ==========================================
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);
            
            // Find active cards expiring exactly in 7 days
            const expiringSoon = await PurchasedMemberCard.find({
                card_status: 1,
                end_date: { 
                    $gte: new Date(sevenDaysFromNow.setHours(0,0,0,0)), 
                    $lt: new Date(sevenDaysFromNow.setHours(23,59,59,999)) 
                }
            }).populate("user_id", "first_name mobile_number");

            for (const card of expiringSoon) {
                if (card.user_id?.mobile_number) {
                    await MembershipNotifier.sendExpiryWarning(card.user_id.mobile_number, card.user_id.first_name, 7);
                }
            }
            console.log(`✅ Sent ${expiringSoon.length} 7-day expiry warnings.`);


            // ==========================================
            // 2. ACTUAL EXPIRATIONS (Update DB)
            // ==========================================
            // Find active cards where the end_date is in the past
            const expiredCards = await PurchasedMemberCard.find({
                card_status: 1,
                end_date: { $lt: today }
            });

            for (const card of expiredCards) {
                card.card_status = 2; // Mark as Expired
                await card.save();
                
                // Optional: Send "Your membership has expired" notification here
            }
            console.log(`✅ Processed ${expiredCards.length} expired memberships.`);

        } catch (error) {
            console.error("🚨 Cron Job Error:", error);
        }
    });
};