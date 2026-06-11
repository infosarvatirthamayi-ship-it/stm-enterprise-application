const mongoose = require("mongoose"); // 🎯 THIS WAS THE MISSING IMPORT!
const Event = require("../models/Event");
const Temple = require("../models/Temple");

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Fetch raw events
        const rawEvents = await Event.find()
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // 2. Extract Temple IDs safely
        const templeIds = [...new Set(rawEvents.map(e => e.temple_id).filter(id => id != null && id !== ""))];

        // 3. Separate them into ObjectIds (new data) and SQL Integers (legacy data)
        const objectIds = templeIds.filter(id => mongoose.Types.ObjectId.isValid(id.toString()) && id.toString().length === 24);
        const sqlIds = templeIds.map(Number).filter(n => !isNaN(n));

        // 4. Fetch matching Temples
        const matchedTemples = await Temple.find({
            $or: [
                { _id: { $in: objectIds } },
                { sql_id: { $in: sqlIds } }
            ]
        }).select("sql_id name").lean();

        // 5. Create a lookup map
        const templeMap = matchedTemples.reduce((acc, temple) => {
            if (temple._id) acc[temple._id.toString()] = temple;
            if (temple.sql_id) acc[temple.sql_id.toString()] = temple;
            return acc;
        }, {});

        // 6. Stitch data together safely
        const processedEvents = rawEvents.map(event => {
            const tId = event.temple_id ? event.temple_id.toString() : null;
            return {
                ...event,
                temple_id: (tId && templeMap[tId]) ? { _id: templeMap[tId]._id, name: templeMap[tId].name } : null
            };
        });

        const totalEvents = await Event.collection.countDocuments();

        res.status(200).json({
            success: true,
            data: processedEvents,
            totalPages: Math.ceil(totalEvents / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("🚨 EVENT GET ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single event by ID
// Get a single event by ID
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        
        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // 🎯 CRITICAL FIX: Manually Bridge the Temple Name for the View/Edit pages
        if (event.temple_id != null && event.temple_id !== "") {
            const tIdString = event.temple_id.toString();
            let foundTemple = null;

            // Check if it's a modern MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(tIdString) && tIdString.length === 24) {
                foundTemple = await Temple.findById(tIdString).select("name sql_id").lean();
            } 
            // Otherwise, check if it's a legacy SQL Integer
            else if (!isNaN(Number(event.temple_id))) {
                foundTemple = await Temple.findOne({ sql_id: Number(event.temple_id) }).select("name sql_id").lean();
            }

            // Attach the rich object to the event so the frontend can read event.temple_id.name
            if (foundTemple) {
                event.temple_id = { 
                    _id: foundTemple._id, 
                    sql_id: foundTemple.sql_id, 
                    name: foundTemple.name 
                };
            } else {
                event.temple_id = null; // Temple was deleted or orphaned
            }
        }

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        console.error("🚨 EVENT GET BY ID ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a new event
exports.createEvent = async (req, res) => {
    try {
        const { temple_id, name, short_description, long_description, date, price, status } = req.body;

        if (!temple_id || !name) {
            return res.status(400).json({ success: false, message: "Temple and Event Name are required." });
        }

        const newEvent = new Event({
            temple_id, // Links the event to the chosen Temple
            name,
            short_description,
            long_description,
            date,
            price,
            status: status || 1
        });

        await newEvent.save();
        res.status(201).json({ success: true, data: newEvent, message: "Event created successfully!" });
    } catch (error) {
        console.error("🚨 EVENT CREATE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update an event
exports.updateEvent = async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedEvent) return res.status(404).json({ success: false, message: "Event not found" });
        res.status(200).json({ success: true, data: updatedEvent, message: "Event updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
    try {
        const deleted = await Event.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Event not found" });
        res.status(200).json({ success: true, message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};