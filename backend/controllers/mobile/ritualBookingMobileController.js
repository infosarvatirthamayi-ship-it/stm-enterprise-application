// backend/controllers/mobile/ritualBookingMobileController.js
const { BookingService } = require("../../services/bookingService");
const Temple = require("../../models/Temple");
const Ritual = require("../../models/Ritual");
// If you have a RitualPackage model, import it here to translate its ID if needed
// const RitualPackage = require("../../models/RitualPackage");

const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({
        success: false,
        status: "false",
        message: message
    });
};

exports.initiateRitualBooking = async (req, res) => {
    try {
        const mobileTempleId = req.body.temple_id;
        const mobileRitualId = req.body.ritual_id;
        const mobilePackageId = req.body.ritual_package_id;
        const bookingData = req.body;

        if (!mobileTempleId || !mobileRitualId) {
            return sendError(res, 400, "Temple ID or Ritual ID missing from request body");
        }

        // 1. 🎯 BFF TRANSLATION: Convert Flutter's integer IDs into MongoDB Objects
        const temple = await Temple.findOne({ sql_id: parseInt(mobileTempleId, 10) });
        if (!temple) return sendError(res, 404, "Temple not found.");

        // NOTE: Adjust 'id' to 'sql_id' if your Ritual schema uses sql_id instead!
        const ritual = await Ritual.findOne({ id: parseInt(mobileRitualId, 10) }); 
        if (!ritual) return sendError(res, 404, "Ritual not found.");

        // 2. Shared Service does the heavy lifting (Make sure 'prepareRitualCheckout' exists in your bookingService.js)
        const checkoutPayload = await BookingService.prepareRitualCheckout(
            req.user, 
            temple._id, 
            ritual._id, 
            mobilePackageId, // Depending on your DB, you may need to translate this to a Mongo _id too
            bookingData
        );
        
        const b = checkoutPayload.booking;

        // 3. 🎯 BFF TRANSLATION: Formatted EXACTLY for ritual_booking_model.dart
        return res.status(200).json({
            success: true,
            status: "true",
            message: "Ritual Booking Initiated Successfully", // Ensure this matches Constants.ritualBookingSuccessMsg in strings.dart
            data: {
                id: b.sql_id || Date.now(),
                user_id: req.user ? req.user.sql_id : 0,
                temple_id: parseInt(mobileTempleId, 10),
                ritual_id: parseInt(mobileRitualId, 10),
                ritual_package_id: parseInt(mobilePackageId, 10),
                date: b.date,
                whatsapp_number: b.whatsapp_number,
                devotees_name: b.devotees_name,
                wish: b.wish || "",
                booking_status: b.booking_status || 1,
                // Flutter Model strictly expects Strings for these amounts
                offer_discount_amount: b.offer_discount_amount ? b.offer_discount_amount.toString() : "0",
                original_amount: b.original_amount ? b.original_amount.toString() : "0",
                paid_amount: checkoutPayload.payment_gateway_data ? (checkoutPayload.payment_gateway_data.amount / 100).toString() : "0",
                offer_id: b.offer_id || 0,
                // Flutter Model strictly expects this nested Payment object
                payment: {
                    razorpay_order_id: checkoutPayload.payment_gateway_data ? checkoutPayload.payment_gateway_data.id : "",
                    razorpay_public_key: process.env.RAZORPAY_KEY_ID, 
                    payment_status: b.payment_status || 1,
                    payment_type: b.payment_type || 1,
                    payment_date: b.payment_date || null
                }
            }
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Checkout Error:", error.message);
        return sendError(res, 400, error.message);
    }
};

exports.verifyRitualBooking = async (req, res) => {
    try {
        // Map Flutter's camelCase variables to snake_case for Razorpay
        const verificationData = {
            razorpay_order_id: req.body.razorpayOrderId || req.body.razorpay_order_id,
            razorpay_payment_id: req.body.razorpayPaymentId || req.body.razorpay_payment_id,
            razorpay_signature: req.body.razorpaySignature || req.body.razorpay_signature,
            booking_id: req.body.booking_id
        };

        // Make sure 'verifyRitualPayment' exists in your bookingService.js
        const confirmedBooking = await BookingService.verifyRitualPayment(req.user, verificationData);

        // Map perfectly to verify_payment_model.dart
        return res.status(200).json({
            success: true,
            status: "true",
            message: "Ritual Payment Verified Successfully", // Ensure this matches Constants.ritualVerifyBookingSuccessMsg in strings.dart
            data: {
                id: confirmedBooking.sql_id || Date.now(),
                booking_status: confirmedBooking.booking_status || 2,
                payment: {
                    razorpay_order_id: verificationData.razorpay_order_id,
                    razorpay_payment_id: verificationData.razorpay_payment_id,
                    payment_status: 2,
                    payment_type: 2,
                    payment_date: new Date().toISOString()
                }
            }
        });
    } catch (error) {
        console.error("📱 Mobile Ritual Verification Error:", error.message);
        return sendError(res, 400, error.message);
    }
};