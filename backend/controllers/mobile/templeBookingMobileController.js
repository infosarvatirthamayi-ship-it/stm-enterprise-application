const { BookingService } = require("../../services/bookingService");
const Temple = require("../../models/Temple");

exports.initiateTempleBooking = async (req, res) => {
    try {
        const flutterTempleId = req.body.temple_id; 
        const bookingData = req.body;
        
        if (!flutterTempleId) {
            return res.status(400).json({ success: false, status: "false", message: "temple_id is missing from request body" });
        }

        const temple = await Temple.findOne({ sql_id: parseInt(flutterTempleId, 10) });
        if (!temple) {
            return res.status(404).json({ success: false, status: "false", message: "Temple not found." });
        }

        const checkoutPayload = await BookingService.prepareTempleCheckout(req.user, temple._id, bookingData);
        const b = checkoutPayload.booking;

        // 🎯 BFF TRANSLATION: Match temple_booking_model.dart EXACTLY
        return res.status(200).json({
            success: true,
            status: "true",
            message: "api.temple_booking", 
            data: {
                id: b.sql_id || 0,
                date: b.date,
                whatsapp_number: b.whatsapp_number,
                devotees_name: b.devotees_name,
                wish: b.wish || "",
                booking_status: b.booking_status,
                // Model expects strings for amounts
                original_amount: b.original_amount ? b.original_amount.toString() : "0",
                paid_amount: checkoutPayload.payment_gateway_data ? checkoutPayload.payment_gateway_data.amount.toString() : "0",
                offer_discount_amount: b.offer_discount_amount ? b.offer_discount_amount.toString() : "0",
                // 🎯 Model expects a nested payment object
                payment: {
                    razorpay_order_id: checkoutPayload.payment_gateway_data ? checkoutPayload.payment_gateway_data.id : "",
                    razorpay_public_key: process.env.RAZORPAY_KEY_ID, // 🎯 Name changed to match model
                    payment_status: b.payment_status || 1,
                    payment_type: b.payment_type || 1
                }
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