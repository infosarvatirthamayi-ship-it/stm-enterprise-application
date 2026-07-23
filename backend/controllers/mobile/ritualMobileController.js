// backend/controllers/mobile/ritualMobileController.js
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Temple = mongoose.models.Temple || require("../../models/Temple");
const Ritual = mongoose.models.Ritual || require("../../models/Ritual");
const RitualPackage = mongoose.models.RitualPackage || require("../../models/RitualPackage");
const RitualBooking = mongoose.models.RitualBooking || require("../../models/RitualBooking");
const PurchasedMemberCard = mongoose.models.PurchasedMemberCard || require("../../models/PurchasedMemberCard");

const getRazorpayInstance = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const FLUTTER_MESSAGES = {
    ritualsFetched: "Rituals fetched successfully.",
    ritualFetched: "Ritual details fetched successfully.",
    ritualPackagesFetched: "Ritual packages fetched successfully.",
    ritualBookingSuccess: "Ritual booking created successfully.",
    ritualVerifySuccess: "Ritual booking verified successfully.",
};

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        status: "false",
        message: message
    });
};

const buildQuery = (id) => {
    return mongoose.isValidObjectId(id) ? { _id: id } : { sql_id: Number(id) };
};

// =========================================================================
// 1. DATA FETCHING (Public)
// =========================================================================

exports.getRitualsByTemple = async (req, res) => {
    try {
        const mobileTempleId = req.body.temple_id || req.body.templeId;

        if (!mobileTempleId) {
            return sendError(res, 400, "temple_id is required.");
        }

        const templeDoc = await Temple.findOne(buildQuery(mobileTempleId)).lean();
        if (!templeDoc) {
            return sendError(res, 404, "Temple not found.");
        }

        const rituals = await Ritual.find({ temple_id: templeDoc._id }).lean();

        const data = rituals.map((ritual) => ({
            ...ritual,
            id: Number(ritual.sql_id || 0),
            temple_id: Number(mobileTempleId),
        }));

        return res.status(200).json({
            success: true,
            status: "true",
            message: FLUTTER_MESSAGES.ritualsFetched,
            data
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Index Error:", error.message);
        return sendError(res, 500, error.message);
    }
};

exports.getRitualShow = async (req, res) => {
    try {
        const mobileRitualId = req.body.ritual_id || req.body.ritualId;

        if (!mobileRitualId) {
            return sendError(res, 400, "ritual_id is required.");
        }

        const ritualDoc = await Ritual.findOne(buildQuery(mobileRitualId)).lean();
        if (!ritualDoc) {
            return sendError(res, 404, "Ritual not found.");
        }

        const data = {
            ...ritualDoc,
            id: Number(ritualDoc.sql_id || 0),
        };

        return res.status(200).json({
            success: true,
            status: "true",
            message: FLUTTER_MESSAGES.ritualFetched,
            data
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Show Error:", error.message);
        return sendError(res, 500, error.message);
    }
};

exports.getRitualPackages = async (req, res) => {
    try {
        const mobileRitualId = req.body.ritual_id || req.body.ritualId;

        if (!mobileRitualId) {
            return sendError(res, 400, "ritual_id is required.");
        }

        const ritualDoc = await Ritual.findOne(buildQuery(mobileRitualId)).lean();
        if (!ritualDoc) {
            return sendError(res, 404, "Ritual not found.");
        }

        const packages = await RitualPackage.find({ ritual_id: ritualDoc._id }).lean();

        const data = packages.map((pkg) => ({
            ...pkg,
            id: Number(pkg.sql_id || 0),
            ritual_id: Number(mobileRitualId),
        }));

        return res.status(200).json({
            success: true,
            status: "true",
            message: FLUTTER_MESSAGES.ritualPackagesFetched,
            data
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Packages Error:", error.message);
        return sendError(res, 500, error.message);
    }
};

// =========================================================================
// 2. BOOKING & VERIFICATION (Protected)
// =========================================================================

exports.initiateRitualBooking = async (req, res) => {
    try {
        const mobileTempleId = req.body.temple_id || req.body.templeId;
        const mobileRitualId = req.body.ritual_id || req.body.ritualId;
        const mobilePackageId = req.body.ritual_package_id || req.body.ritualPackageId;
        const date = req.body.date;
        const whatsappNumber = req.body.whatsapp_number || req.body.whatsAppNumber;
        const devoteesName = req.body.devotees_name || req.body.devoteeName;
        const wish = req.body.wish || "";
        const offerId = req.body.offer_id || req.body.offerId || 0;
        const paymentType = req.body.payment_type || req.body.paymentType || 2; 

        if (!mobileTempleId || !mobileRitualId || !mobilePackageId || !date || !whatsappNumber || !devoteesName) {
            return sendError(res, 400, "Required booking fields are missing.");
        }

        const [templeDoc, ritualDoc, packageDoc] = await Promise.all([
            Temple.findOne(buildQuery(mobileTempleId)).lean(),
            Ritual.findOne(buildQuery(mobileRitualId)).lean(),
            RitualPackage.findOne(buildQuery(mobilePackageId)).lean()
        ]);

        if (!templeDoc || !ritualDoc || !packageDoc) {
            return sendError(res, 404, "Temple, Ritual, or Package not found.");
        }

        const userId = req.user._id || req.user.id;
        let finalAmount = Number(packageDoc.price || 0);
        let totalDiscountApplied = 0;

        const activeMembership = await PurchasedMemberCard.findOne({ 
            user_id: userId, 
            card_status: 1, 
            end_date: { $gte: new Date() } 
        });

        if (activeMembership) {
            const memDiscount = (finalAmount * (templeDoc.member_discount_percentage || 25)) / 100;
            totalDiscountApplied += memDiscount;
            finalAmount = Math.max(0, finalAmount - memDiscount); 
        }

        let order = null;
        if (paymentType === 2 && finalAmount > 0) {
            const razorpay = getRazorpayInstance();
            const amountInPaise = Math.round(finalAmount * 100);
            order = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `rit_mob_${Date.now().toString().slice(-6)}`
            });
        }

        const booking = await RitualBooking.create({
            sql_id: Math.floor(100000 + Math.random() * 900000),
            booking_id: `RIT-${Date.now()}`,
            user_id: userId,
            temple_id: templeDoc._id,
            ritual_id: ritualDoc._id,
            ritual_package_id: packageDoc._id,
            date: new Date(date),
            whatsapp_number: String(whatsappNumber),
            devotees_name: String(devoteesName),
            wish: String(wish),
            booking_status: 1,
            payment_type: paymentType,
            payment_status: 1,
            razorpay_order_id: order ? order.id : null,
            original_amount: packageDoc.price,
            offer_discount_amount: totalDiscountApplied,
            paid_amount: finalAmount,
            purchased_member_card_id: activeMembership ? activeMembership._id : null
        });

        return res.status(200).json({
            success: true,
            status: "true",
            message: FLUTTER_MESSAGES.ritualBookingSuccess,
            data: {
                id: Number(booking.sql_id || Date.now()),
                user_id: Number(req.user?.sql_id || 0),
                temple_id: Number(mobileTempleId),
                ritual_id: Number(mobileRitualId),
                ritual_package_id: Number(mobilePackageId),
                date: booking.date.toISOString(),
                whatsapp_number: String(booking.whatsapp_number),
                devotees_name: String(booking.devotees_name),
                wish: String(booking.wish),
                booking_status: 1,
                offer_discount_amount: booking.offer_discount_amount.toString(), 
                original_amount: booking.original_amount.toString(),             
                paid_amount: booking.paid_amount.toString(),                     
                offer_id: Number(offerId),
                payment: {
                    razorpay_order_id: order ? String(order.id) : "",
                    razorpay_public_key: String(process.env.RAZORPAY_KEY_ID || ""),
                    payment_status: 1,
                    payment_type: Number(paymentType),
                    payment_date: null
                }
            }
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Checkout Error:", error.message);
        return sendError(res, 500, error.message);
    }
};

exports.verifyRitualBooking = async (req, res) => {
    try {
        const razorpay_order_id = req.body.razorpayOrderId || req.body.razorpay_order_id;
        const razorpay_payment_id = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
        const razorpay_signature = req.body.razorpaySignature || req.body.razorpay_signature;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return sendError(res, 400, "Missing payment verification fields");
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return sendError(res, 400, "Payment signature invalid.");
        }

        const booking = await RitualBooking.findOne({ razorpay_order_id });
        if (!booking) return sendError(res, 404, "Booking not found.");

        if (booking.payment_status !== 2) {
            booking.razorpay_payment_id = razorpay_payment_id;
            booking.payment_status = 2;
            booking.booking_status = 2;
            booking.payment_date = new Date();
            await booking.save();
        }

        return res.status(200).json({
            success: true,
            status: "true",
            message: FLUTTER_MESSAGES.ritualVerifySuccess,
            data: {
                id: Number(booking.sql_id || Date.now()),
                booking_status: 2,
                payment: {
                    razorpay_order_id: razorpay_order_id,
                    razorpay_payment_id: razorpay_payment_id,
                    payment_status: 2,
                    payment_type: 2,
                    payment_date: booking.payment_date.toISOString()
                }
            }
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Verification Error:", error.message);
        return sendError(res, 500, error.message);
    }
};