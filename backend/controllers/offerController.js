const Offer = require("../models/Offer");
const Temple = require("../models/Temple");

// Safely import other models if they exist in the ecosystem to prevent crash on missing modules
let Ritual, Event;
try { Ritual = require("../models/Ritual"); } catch(e) { Ritual = null; }
try { Event = require("../models/Event"); } catch(e) { Event = null; }

/**
 * ============================================================================
 * CREATE OFFER
 * ============================================================================
 */
exports.createOffer = async (req, res) => {
    try {
        const body = req.body;

        // Handle image upload
        if (req.file) {
            body.image = `/uploads/${req.file.filename}`;
        }

        // Validation
        if (!body.name) {
            return res.status(400).json({ success: false, message: "Offer name is required" });
        }
        if (!body.temple_id) {
            return res.status(400).json({ success: false, message: "Temple ID is required" });
        }
        if (!body.type) {
            return res.status(400).json({ success: false, message: "Offer type is required" });
        }
        if (!body.reference_id) {
            return res.status(400).json({ success: false, message: "Reference ID is required" });
        }

        // Percentage validation
        if (body.discount_type === "percentage" && !body.discount_percentage) {
            return res.status(400).json({ success: false, message: "Discount percentage is required" });
        }

        // Flat validation
        if (body.discount_type === "flat" && !body.discount_amount) {
            return res.status(400).json({ success: false, message: "Discount amount is required" });
        }

        const offer = await Offer.create(body);

        return res.status(201).json({
            success: true,
            message: "Offer created successfully",
            data: offer
        });

    } catch (error) {
        console.error("🚨 Create Offer Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ============================================================================
 * GET ALL OFFERS (Upgraded with O(1) Hash Map Name Stitching)
 * ============================================================================
 */
exports.getOffers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "", status, temple_id } = req.query;
        const query = {};

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { coupon_code: { $regex: search, $options: "i" } }
            ];
        }

        // Status filter
        if (status !== undefined) {
            query.status = Number(status);
        }

        // Temple filter
        if (temple_id) {
            query.temple_id = Number(temple_id);
        }

        // 1. Fetch Raw Offers
        const offers = await Offer.find(query)
            .sort({ sequence: 1, created_at: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean(); // .lean() is crucial here for memory speed

        // 2. Extract Unique Legacy SQL IDs for lookups
        const templeSqlIds = [...new Set(offers.map(o => o.temple_id).filter(id => id != null))];
        const ritualSqlIds = [...new Set(offers.filter(o => o.type === 2).map(o => o.reference_id).filter(Boolean))];
        const eventSqlIds = [...new Set(offers.filter(o => o.type === 3).map(o => o.reference_id).filter(Boolean))];

        // 3. Parallel Fetching for blazing fast performance
        const [temples, rituals, events] = await Promise.all([
            Temple.find({ sql_id: { $in: templeSqlIds } }).select("sql_id name").lean(),
            Ritual && ritualSqlIds.length ? Ritual.find({ sql_id: { $in: ritualSqlIds } }).select("sql_id name").lean() : [],
            Event && eventSqlIds.length ? Event.find({ sql_id: { $in: eventSqlIds } }).select("sql_id name").lean() : []
        ]);

        // 4. Create O(1) Lookup Dictionaries
        const templeMap = temples.reduce((acc, t) => ({ ...acc, [t.sql_id]: t.name }), {});
        const ritualMap = rituals.reduce((acc, r) => ({ ...acc, [r.sql_id]: r.name }), {});
        const eventMap = events.reduce((acc, e) => ({ ...acc, [e.sql_id]: e.name }), {});

        // 5. Stitch Data Together Cleanly
        const mappedOffers = offers.map(offer => {
            let refName = "Global Application Wide";
            
            if (offer.type === 2) refName = ritualMap[offer.reference_id] || `Ritual ID: ${offer.reference_id}`;
            if (offer.type === 3) refName = eventMap[offer.reference_id] || `Event ID: ${offer.reference_id}`;
            if (offer.type === 5) refName = `Donation Project ID: ${offer.reference_id}`;

            return {
                ...offer,
                temple_name: templeMap[offer.temple_id] || `Temple ID: ${offer.temple_id}`,
                reference_name: refName
            };
        });

        const total = await Offer.countDocuments(query);

        return res.status(200).json({
            success: true,
            total,
            page: Number(page),
            limit: Number(limit),
            data: mappedOffers 
        });

    } catch (error) {
        console.error("🚨 Offer Fetch Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ============================================================================
 * GET SINGLE OFFER (Upgraded with Individual Lookup logic)
 * ============================================================================
 */
exports.getOfferById = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).lean();

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        // Resolve Temple Name
        const temple = await Temple.findOne({ sql_id: offer.temple_id }).select("name").lean();
        offer.temple_name = temple ? temple.name : `Temple ID: ${offer.temple_id}`;

        // Resolve Reference Name based on type
        let refName = "Global Application Wide";
        if (offer.type === 2 && Ritual) {
            const r = await Ritual.findOne({ sql_id: offer.reference_id }).select("name").lean();
            refName = r ? r.name : `Ritual ID: ${offer.reference_id}`;
        } else if (offer.type === 3 && Event) {
            const e = await Event.findOne({ sql_id: offer.reference_id }).select("name").lean();
            refName = e ? e.name : `Event ID: ${offer.reference_id}`;
        } else if (offer.type === 5) {
            refName = `Donation Project ID: ${offer.reference_id}`;
        }
        
        offer.reference_name = refName;

        return res.status(200).json({
            success: true,
            data: offer
        });

    } catch (error) {
        console.error("🚨 Get Single Offer Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ============================================================================
 * UPDATE OFFER
 * ============================================================================
 */
exports.updateOffer = async (req, res) => {
    try {
        const body = req.body;

        if (req.file) {
            body.image = `/uploads/${req.file.filename}`;
        }

        body.updated_at = new Date();

        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            data: offer
        });

    } catch (error) {
        console.error("🚨 Update Offer Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ============================================================================
 * DELETE OFFER
 * ============================================================================
 */
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);

        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Offer deleted successfully"
        });

    } catch (error) {
        console.error("🚨 Delete Offer Error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};