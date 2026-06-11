const mongoose = require("mongoose");
const EventBooking = require("../models/EventBooking");
const Event = require("../models/Event");
const Temple = require("../models/Temple");
const User = require("../models/User");

exports.getAllBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Fetch raw bookings natively
        const rawBookings = await EventBooking.find()
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 2. Extract valid SQL IDs for Events and Temples
        // CRITICAL FIX: Filters out nulls, empty strings, and NaN values to prevent 500 crashes
        const sqlEventIds = [...new Set(
            rawBookings
                .map(b => b.event_id)
                .filter(id => id != null && id !== "" && !isNaN(Number(id)))
        )].map(Number);

        const sqlTempleIds = [...new Set(
            rawBookings
                .map(b => b.temple_id)
                .filter(id => id != null && id !== "" && !isNaN(Number(id)))
        )].map(Number);

        // 3. Fetch related Events and Temples matching the sql_ids
        const matchedEvents = await Event.find({ sql_id: { $in: sqlEventIds } }).select("sql_id name").lean();
        const matchedTemples = await Temple.find({ sql_id: { $in: sqlTempleIds } }).select("sql_id name").lean();

        // 4. Create Hash Maps for O(1) lookups
        const eventMap = matchedEvents.reduce((acc, event) => {
            acc[event.sql_id] = event;
            return acc;
        }, {});

        const templeMap = matchedTemples.reduce((acc, temple) => {
            acc[temple.sql_id] = temple;
            return acc;
        }, {});

        // 5. Map the Events and Temples back to the bookings safely
        const processedBookings = rawBookings.map(booking => {
            const foundEvent = (booking.event_id != null && !isNaN(Number(booking.event_id))) 
                ? eventMap[Number(booking.event_id)] 
                : null;
                
            const foundTemple = (booking.temple_id != null && !isNaN(Number(booking.temple_id))) 
                ? templeMap[Number(booking.temple_id)] 
                : null;
            
            return {
                ...booking,
                event_id: foundEvent ? { _id: foundEvent._id, name: foundEvent.name } : null,
                temple_id: foundTemple ? { _id: foundTemple._id, name: foundTemple.name } : null
            };
        });

        // 6. Native count bypasses Mongoose schema validation entirely
        const totalBookings = await EventBooking.collection.countDocuments();

        res.status(200).json({
            success: true,
            data: processedBookings,
            totalPages: Math.ceil(totalBookings / limit),
            currentPage: page
        });

    } catch (error) {
        console.error("🚨 PROD ERROR - GET ALL BOOKINGS:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to process bookings.", 
            error: error.message 
        });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const deleted = await EventBooking.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Not found" });
        res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBookingById = async (req, res) => {
    try {
        const booking = await EventBooking.findById(req.params.id).lean();
        
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // Bridge Event safely
        if (booking.event_id != null && booking.event_id !== "" && !isNaN(Number(booking.event_id))) {
            const foundEvent = await Event.findOne({ sql_id: Number(booking.event_id) }).select("name").lean();
            booking.event_id = foundEvent ? { _id: foundEvent._id, name: foundEvent.name } : null;
        } else {
            booking.event_id = null;
        }

        // Bridge Temple safely
        if (booking.temple_id != null && booking.temple_id !== "" && !isNaN(Number(booking.temple_id))) {
            const foundTemple = await Temple.findOne({ sql_id: Number(booking.temple_id) }).select("name").lean();
            booking.temple_id = foundTemple ? { _id: foundTemple._id, name: foundTemple.name } : null;
        } else {
            booking.temple_id = null;
        }

        // Bridge User safely
        if (booking.user_id != null && booking.user_id !== "" && !isNaN(Number(booking.user_id))) {
            const foundUser = await User.findOne({ sql_id: Number(booking.user_id) }).select("name email").lean();
            booking.user_id = foundUser ? { _id: foundUser._id, name: foundUser.name } : null;
        } else {
            booking.user_id = null;
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.error("🚨 SQL-BRIDGE VIEW ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getTotalBookingsCount = async (req, res) => {
    try {
        const count = await EventBooking.collection.countDocuments();
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error("DEBUG: Native count failed:", error);
        res.status(500).json({ success: false, message: "Database count failed" });
    }
};