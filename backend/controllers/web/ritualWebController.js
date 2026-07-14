// backend/controllers/web/ritualWebController.js
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

// 🧠 Smart Model Loaders
const Ritual = mongoose.models.Ritual || require("../../models/Ritual");
const RitualPackage = mongoose.models.RitualPackage || require("../../models/RitualPackage");
const RitualBooking = mongoose.models.RitualBooking || require("../../models/RitualBooking");
const Temple = mongoose.models.Temple || require("../../models/Temple");
const PurchasedMemberCard = mongoose.models.PurchasedMemberCard || require("../../models/PurchasedMemberCard");
const Voucher = mongoose.models.Voucher || require("../../models/Voucher");

// 🛡️ Secure Razorpay Initialization
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * ============================================================================
 * 1. GET ALL RITUALS (Global Feed for Web Showroom with Sanitization)
 * ============================================================================
 */
exports.getAllWebRituals = async (req, res) => {
    try {
        const rituals = await Ritual.find({ status: { $in: [0, 1] } })
            .populate('temple_id', 'name city_name sql_id')
            .populate('ritual_type_id', 'name') // 🎯 Fetches 'Samskaras' if available
            .sort({ sequence: 1, created_at: -1 })
            .lean();

        const formatted = rituals.map(ritual => {
            // 🛠️ DATA SANITIZATION: Fix the broken MongoDB migration data
            let finalName = ritual.name || "Sacred Ritual";
            let finalDesc = ritual.description || "Consecrated Vedic ceremony conducted with traditional rites and holy offerings.";
            
            if (/^\d+$/.test(finalName.trim())) {
                finalName = (ritual.description && ritual.description.trim() !== "") 
                    ? ritual.description 
                    : `Sacred Ritual ${ritual.name}`;
                finalDesc = "Consecrated Vedic ceremony conducted with traditional rites and holy offerings.";
            }

            let finalImage = ritual.image || "";
            if (/^\d+$/.test(finalImage.trim()) || finalImage.length < 5) {
                finalImage = ""; 
            }

            return {
                _id: ritual._id,
                id: ritual.sql_id || 0,
                name: finalName,
                description: finalDesc,
                type: ritual.ritual_type_id ? ritual.ritual_type_id.name : null, // 🎯 Passes to UI
                temple_id: ritual.temple_id ? (ritual.temple_id.sql_id || ritual.temple_id._id) : null,
                temple_name: ritual.temple_id?.name || "Sacred Site",
                image: finalImage
            };
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("🚨 BFF Web Ritual Fetch Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching rituals." });
    }
};

/**
 * ============================================================================
 * 2. GET RITUALS BY TEMPLE
 * ============================================================================
 */
exports.getRitualsByTemple = async (req, res) => {
    try {
        const { templeId } = req.params;
        if (!mongoose.isValidObjectId(templeId)) {
            return res.status(400).json({ success: false, message: "Invalid Temple ID" });
        }

        const rituals = await Ritual.find({ temple_id: templeId, status: { $in: [0, 1] } })
            .populate('ritual_type_id', 'name')
            .sort({ sequence: 1, created_at: -1 })
            .lean();

        const formatted = rituals.map(ritual => {
            let finalName = ritual.name || "";
            if (/^\d+$/.test(finalName.trim()) && ritual.description) {
                finalName = ritual.description;
            }
            return {
                _id: ritual._id,
                id: ritual.sql_id || 0,
                name: finalName,
                description: ritual.description || "",
                type: ritual.ritual_type_id ? ritual.ritual_type_id.name : null,
                image: (/^\d+$/.test(ritual.image || "")) ? "" : ritual.image,
                temple_id: ritual.temple_id
            };
        });

        return res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        console.error("🚨 Fetch Rituals Error:", error);
        return res.status(500).json({ success: false, message: "Server error retrieving rituals." });
    }
};

// 🛡️ HELPER: Smart ID Detection (Put this above your functions)
const buildQuery = (id) => {
    return mongoose.isValidObjectId(id) 
        ? { _id: id, status: { $in: [0, 1] } } 
        : { sql_id: Number(id), status: { $in: [0, 1] } };
};

/**
 * ============================================================================
 * 3. GET RITUAL PACKAGES (Resilient Version)
 * ============================================================================
 */
exports.getRitualPackages = async (req, res) => {
    try {
        const targetId = req.params.ritualId || req.params.id; 
        const userId = req.user ? (req.user._id || req.user.id) : null;

        if (!targetId || targetId === "undefined") {
            return res.status(400).json({ success: false, message: "Ritual ID is required." });
        }

        // 🎯 THE FIX: Smart Query prevents CastError crash
        const ritual = await Ritual.findOne(buildQuery(targetId))
            .populate({ path: 'temple_id', select: 'member_discount_percentage' })
            .lean();

        if (!ritual) {
            console.error(`🚨 Backend: Ritual not found for ID: ${targetId}`);
            return res.status(404).json({ success: false, message: "Ritual not found" });
        }

        const packages = await RitualPackage.find({ 
            ritual_id: ritual._id, // Use true mongo ID found from ritual
            status: { $in: [0, 1] } 
        }).lean();

        let isMember = false;
        if (userId && mongoose.models.PurchasedMemberCard) {
            const activeMembership = await mongoose.models.PurchasedMemberCard.findOne({
                user_id: userId,
                card_status: 1,
                end_date: { $gte: new Date() }
            });
            isMember = !!activeMembership;
        }

        const discountPercentage = ritual.temple_id?.member_discount_percentage || 25;

        const formattedPackages = packages.map(pkg => {
            const originalPrice = Number(pkg.price || 0);
            let clubPrice = originalPrice;
            
            if (isMember) {
                const discount = (originalPrice * discountPercentage) / 100;
                clubPrice = Math.max(0, originalPrice - discount);
            }

            return {
                id: pkg._id,
                name: pkg.name || "Sacred Package",
                description: pkg.description || "Divine offerings included.",
                devotees_count: pkg.devotees_count || 1,
                original_price: originalPrice,
                display_price: isMember ? clubPrice : originalPrice,
                member_discount_available: isMember ? 0 : (originalPrice * discountPercentage) / 100
            };
        });

        return res.status(200).json({ success: true, data: formattedPackages });
    } catch (error) {
        console.error("🚨 CRITICAL Fetch Packages Error:", error.message);
        return res.status(500).json({ success: false, message: "Server error retrieving packages." });
    }
};

/**
 * ============================================================================
 * 4. INITIATE RITUAL BOOKING (Resilient Version)
 * ============================================================================
 */
exports.initiateRitualBooking = async (req, res) => {
    try {
        const { templeId, ritualId, packageId, date, devoteesName, whatsappNumber, wish, voucherCode } = req.body;
        const userId = req.user._id || req.user.id;

        if (!templeId || !ritualId || !packageId || !date || !devoteesName || !whatsappNumber) {
            return res.status(400).json({ success: false, message: "Required booking fields are missing." });
        }

        // 🎯 THE FIX: Smart Query prevents CastError on all 3 database lookups
        const [templeDoc, ritualDoc, packageDoc] = await Promise.all([
            Temple.findOne(buildQuery(templeId)).lean(),
            Ritual.findOne(buildQuery(ritualId)).lean(),
            RitualPackage.findOne(buildQuery(packageId)).lean()
        ]);

        if (!templeDoc || !ritualDoc || !packageDoc) {
            console.error(`🚨 Entity Mismatch: Temple(${!!templeDoc}), Ritual(${!!ritualDoc}), Package(${!!packageDoc})`);
            return res.status(404).json({ success: false, message: "Database entity mismatch. Please refresh." });
        }

        let finalAmount = Number(packageDoc.price || 0);
        let totalDiscountApplied = 0;
        let appliedVoucherId = null;

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

        if (voucherCode) {
            const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase(), status: 1 });
            if (voucher) {
                // ... validation logic ...
                let vDisc = voucher.discount_type === 'percentage' 
                    ? (finalAmount * voucher.discount_value) / 100 
                    : voucher.discount_value;
                
                totalDiscountApplied += vDisc;
                finalAmount = Math.max(0, finalAmount - vDisc);
                appliedVoucherId = voucher._id;
            }
        }

        const amountInPaise = Math.round(finalAmount * 100); 
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `rit_web_${Date.now().toString().slice(-6)}`
        });

        const booking = await RitualBooking.create({
            user_id: userId,
            temple_id: templeDoc._id,             // Save True Mongo ID
            ritual_id: ritualDoc._id,             // Save True Mongo ID
            ritual_package_id: packageDoc._id,    // Save True Mongo ID
            date: new Date(date),
            whatsapp_number: whatsappNumber,
            devotees_name: devoteesName,
            wish: wish || "",
            booking_status: 1, 
            payment_type: 2,   
            payment_status: 1, 
            razorpay_order_id: order.id,
            original_amount: packageDoc.price,
            offer_discount_amount: totalDiscountApplied,
            paid_amount: finalAmount,
            voucher_applied_id: appliedVoucherId,
            purchased_member_card_id: activeMembership ? activeMembership._id : null
        });

        return res.status(200).json({
            success: true,
            data: {
                bookingId: booking._id,
                original_amount: packageDoc.price,
                discount_applied: totalDiscountApplied,
                final_amount: finalAmount,
                payment: {
                    razorpay_order_id: order.id,
                    razorpay_public_key: process.env.RAZORPAY_KEY_ID
                }
            }
        });

    } catch (error) {
        console.error("🚨 Ritual Booking Init Error:", error.message);
        return res.status(500).json({ success: false, message: "Server error during checkout initialization." });
    }
};

/**
 * ============================================================================
 * 5. VERIFY RITUAL PAYMENT & REDEEM VOUCHER
 * ============================================================================
 */
exports.verifyRitualPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const userId = req.user._id || req.user.id;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
            return res.status(400).json({ success: false, message: "Missing verification parameters." });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment signature invalid. Transaction aborted." });
        }

        const booking = await RitualBooking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking record lost." });
        
        if (booking.payment_status === 2) {
            return res.status(400).json({ success: false, message: "Booking already verified." });
        }

        booking.payment_status = 2; 
        booking.booking_status = 2; 
        booking.razorpay_payment_id = razorpay_payment_id;
        booking.payment_date = new Date();
        await booking.save();

        if (booking.voucher_applied_id) {
            await Voucher.findByIdAndUpdate(booking.voucher_applied_id, {
                $inc: { used_count: 1 },
                $push: { used_by: userId }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Divine Ritual Booking Confirmed!",
            data: { bookingId: booking._id }
        });

    } catch (error) {
        console.error("🚨 Ritual Verification Error:", error);
        return res.status(500).json({ success: false, message: "Server error during verification." });
    }
};