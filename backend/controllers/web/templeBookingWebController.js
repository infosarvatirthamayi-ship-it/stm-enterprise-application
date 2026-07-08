// backend/controllers/web/templeBookingWebController.js
const { BookingService } = require("../../services/bookingService");

exports.initiateTempleBooking = async (req, res) => {
    try {
        const templeId = req.params.templeId;
        const bookingData = req.body;
        
        // req.user is guaranteed to exist safely due to protectWeb checking the HttpOnly cookie
        const checkoutPayload = await BookingService.prepareTempleCheckout(req.user, templeId, bookingData);

        return res.status(200).json({
            success: true,
            status: "true",
            data: checkoutPayload
        });
    } catch (error) {
        console.error("🌐 Web Checkout Error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};

exports.verifyTempleBooking = async (req, res) => {
    try {
        const confirmedBooking = await BookingService.verifyTemplePayment(req.user, req.body);

        return res.status(200).json({
            success: true,
            status: "true",
            message: "Temple visit secured.",
            data: confirmedBooking
        });
    } catch (error) {
        console.error("🌐 Web Verification Error:", error.message);
        return res.status(400).json({ success: false, message: error.message });
    }
};