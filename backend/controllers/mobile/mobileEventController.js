const EventBooking = require('../../models/EventBooking');
const Event = require('../../models/Event');
const { getFullImageUrl } = require('../../utils/config');

exports.getBookingDetails = async (req, res) => {
    try {
        // 1. Fetch bookings for the logged-in user and populate the associated Event data
        // (Ensure the user field in EventBooking matches your schema, typically 'user' or 'userId')
        const bookings = await EventBooking.find({ user: req.user.id })
            .populate('event') 
            .lean();

        // 2. Strictly cast all fields to Strings/Integers so the frozen Dart APK doesn't crash
        const serializedBookings = bookings.map(booking => ({
            id: booking._id ? String(booking._id) : "",
            eventId: booking.event && booking.event._id ? String(booking.event._id) : "",
            eventName: booking.event && booking.event.name ? String(booking.event.name) : "N/A",
            amount: booking.amount ? String(booking.amount) : "0",
            paymentStatus: booking.paymentStatus ? String(booking.paymentStatus) : "Pending",
            bookingDate: booking.createdAt ? new Date(booking.createdAt).toISOString() : "",
            image: booking.event && booking.event.image ? String(getFullImageUrl(booking.event.image)) : ""
        }));

        // 3. Return the exact JSON structure Flutter expects
        return res.status(200).json({
            status: "true",
            success: true,
            message: "Event booking details retrieved successfully.",
            data: serializedBookings.length > 0 ? serializedBookings : {} // Fallback to {} if empty, matching the Ritual route
        });

    } catch (error) {
        return res.status(500).json({ 
            status: "false", 
            success: false, 
            message: error.message 
        });
    }
};