// backend/controllers/mobile/templeBookingMobileController.js
const { BookingService } = require("../../services/bookingService");
const Temple = require("../../models/Temple");

exports.initiateTempleBooking = async (req, res) => {
    try {
        const templeId = req.body.temple_id; 
        const bookingData = req.body;
        
        // 🎯 BFF TRANSLATION: Convert Flutter's sql_id (e.g., 23) into MongoDB's _id
        const temple = await Temple.findOne({ sql_id: parseInt(mobileTempleId, 10) });
        if (!temple) {
            return res.status(404).json({ success: false, status: "false", message: "Temple not found." });
        }
        
        // 1. Shared Service does the heavy lifting
        const checkoutPayload = await BookingService.prepareTempleCheckout(req.user, templeId, bookingData);

        // 2. BFF Translator: Format exactly for Flutter's TempleBookingModel
        return res.status(200).json({
            success: true,
            status: "true",
            message: "api.temple_booking", // 🎯 EXACT MATCH from strings.dart
            data: {
                requires_payment: checkoutPayload.requires_payment,
                booking_id: checkoutPayload.booking.booking_id,
                amount: checkoutPayload.payment_gateway_data ? checkoutPayload.payment_gateway_data.amount : 0,
                razorpay_order_id: checkoutPayload.payment_gateway_data ? checkoutPayload.payment_gateway_data.id : "",
                razorpay_key: process.env.RAZORPAY_KEY_ID // 🎯 Injecting key for Flutter SDK
            }
        });
    } catch (error) {
        console.error("📱 Mobile Checkout Error:", error.message);
        return res.status(400).json({ success: false, status: "false", message: error.message });
    }
};

exports.verifyTempleBooking = async (req, res) => {
    try {
        // Flutter sends camelCase in BLoC, map it safely to snake_case for the service
        const verificationData = {
            razorpay_order_id: req.body.razorpayOrderId || req.body.razorpay_order_id,
            razorpay_payment_id: req.body.razorpayPaymentId || req.body.razorpay_payment_id,
            razorpay_signature: req.body.razorpaySignature || req.body.razorpay_signature,
            booking_id: req.body.booking_id
        };

        const confirmedBooking = await BookingService.verifyTemplePayment(req.user, verificationData);

        return res.status(200).json({
            success: true,
            status: "true",
            message: "Razorpay payment verified successfully.", // 🎯 EXACT MATCH from strings.dart
            data: {
                booking_id: confirmedBooking.booking_id,
                date: confirmedBooking.date
            }
        });
    } catch (error) {
        console.error("📱 Mobile Verification Error:", error.message);
        return res.status(400).json({ success: false, status: "false", message: error.message });
    }
};