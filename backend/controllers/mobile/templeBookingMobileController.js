// backend/controllers/mobile/templeBookingMobileController.js
const { BookingService } = require("../../services/bookingService");

exports.initiateTempleBooking = async (req, res) => {
    try {
        const templeId = req.body.temple_id; // Flutter usually sends IDs in body
        const bookingData = req.body;
        
        // req.user is guaranteed by protectMobile validating the JWT Bearer header
        const checkoutPayload = await BookingService.prepareTempleCheckout(req.user, templeId, bookingData);

        return res.status(200).json({
            success: true,
            status: "true",
            message: checkoutPayload.requires_payment ? "Proceed to payment" : "Booking confirmed via Club Pass.",
            data: checkoutPayload
        });
    } catch (error) {
        console.error("📱 Mobile Checkout Error:", error.message);
        return res.status(400).json({ success: false, status: "false", message: error.message });
    }
};

exports.verifyTempleBooking = async (req, res) => {
    try {
        const confirmedBooking = await BookingService.verifyTemplePayment(req.user, req.body);

        return res.status(200).json({
            success: true,
            status: "true",
            message: "Digital pass activated.",
            data: {
                booking_id: confirmedBooking.booking_id,
                qr_code: confirmedBooking.qr_code,
                date: confirmedBooking.date
            }
        });
    } catch (error) {
        console.error("📱 Mobile Verification Error:", error.message);
        return res.status(400).json({ success: false, status: "false", message: error.message });
    }
};