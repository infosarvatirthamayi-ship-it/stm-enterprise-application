// backend/controllers/web/templeBookingWebController.js
const crypto = require("crypto");
const Razorpay = require("razorpay");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose"); 
const Temple = require("../../models/Temple");
const TempleBooking = require("../../models/TempleBooking");
const PurchasedMemberCard = require("../../models/PurchasedMemberCard");
const { validateVoucher, redeemVoucher } = require("../../utils/voucherHelper");

// 💳 Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// 1. INITIATE SECURE BOOKING & CALCULATE FARE
// ==========================================
exports.initiateTempleBooking = async (req, res) => {
    try {
        const { temple_id, date, devotees_name, whatsapp_number, wish, voucherCode } = req.body;
        const userId = req.user._id || req.user.id;

        // 🚀 SMART QUERY: Safely handles both MongoDB ObjectIds and Legacy SQL IDs
        const query = mongoose.Types.ObjectId.isValid(temple_id) 
            ? { _id: temple_id } 
            : { sql_id: Number(temple_id) };
            
        const temple = await Temple.findOne(query);

        if (!temple) return res.status(404).json({ success: false, message: "Temple not found." });

        let finalAmount = Number(temple.visit_price) || 0;
        let discountBreakdown = { memberDiscount: 0, voucherDiscount: 0, originalPrice: finalAmount };

        // 🆓 Free Entry Check
        if (temple.is_free_today || finalAmount === 0) {
            return res.status(200).json({
                success: true,
                isFree: true,
                data: { final_amount: 0, bookingId: null }
            });
        }

        // 👑 STM Club Check
        const activeMembership = await PurchasedMemberCard.findOne({ 
            user_id: userId, card_status: 1, end_date: { $gte: new Date() } 
        });

        if (activeMembership) {
            const discount = (finalAmount * (temple.member_discount_percentage || 25)) / 100;
            finalAmount -= discount;
            discountBreakdown.memberDiscount = discount;
        }

        // 🎟️ Voucher Processing
        let appliedVoucherId = null;
        if (voucherCode) {
            try {
                const voucherResult = await validateVoucher(voucherCode, userId, 'temple', finalAmount);
                finalAmount = voucherResult.finalAmount;
                discountBreakdown.voucherDiscount = voucherResult.discountAmount;
                appliedVoucherId = voucherResult.voucherId;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 🏦 Generate Razorpay Order
        const order = await razorpay.orders.create({
            amount: Math.round(finalAmount * 100),
            currency: "INR",
            receipt: `t_book_${Date.now().toString().slice(-6)}`
        });

        // 📝 Save Pending Booking
        const booking = await TempleBooking.create({
            // Generates a unique 9-digit SQL ID to prevent Mongo E11000 Duplicate Key Crashes
            sql_id: Math.floor(100000000 + Math.random() * 900000000), 
            user_id: userId,
            temple_id: temple._id,
            devotees_name,
            whatsapp_number,
            wish,
            date,
            booking_status: 1, // 1 = Pending
            payment_status: 1, // 1 = Pending
            razorpay_order_id: order.id,
            original_amount: discountBreakdown.originalPrice,
            offer_discount_amount: discountBreakdown.voucherDiscount + discountBreakdown.memberDiscount,
            paid_amount: finalAmount,
            voucher_applied_id: appliedVoucherId,
            purchased_member_card_id: activeMembership ? activeMembership._id : null
        });

        return res.status(200).json({
            success: true,
            data: {
                bookingId: booking._id,
                razorpay_order_id: order.id,
                razorpay_public_key: process.env.RAZORPAY_KEY_ID,
                final_amount: finalAmount
            }
        });
    } catch (error) {
        console.error("🔥 Booking Init Error:", error);
        return res.status(500).json({ success: false, message: "Server error during booking initiation." });
    }
};

// ==========================================
// 2. VERIFY PAYMENT SIGNATURE
// ==========================================
exports.verifyAndConfirmBooking = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const userId = req.user._id || req.user.id;

        // 🛡️ Cryptographic Verification
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, message: "Security signature mismatch. Payment rejected." });
        }

        // ✅ Confirm Database Record
        const booking = await TempleBooking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, message: "Booking record lost." });

        booking.payment_status = 2; // 2 = Success
        booking.booking_status = 2; // 2 = Confirmed
        booking.razorpay_payment_id = razorpay_payment_id;
        booking.payment_date = new Date();
        await booking.save();

        // 🎟️ Redeem Voucher (if used)
        if (booking.voucher_applied_id && typeof redeemVoucher === 'function') {
            await redeemVoucher(booking.voucher_applied_id, userId);
        }

        return res.status(200).json({ 
            success: true, 
            message: "Payment verified successfully.",
            ticketUrl: `/api/v1/web/user/book-temple/ticket/${booking._id}` 
        });
    } catch (error) {
        console.error("🔥 Verification Error:", error);
        return res.status(500).json({ success: false, message: "Server error during payment verification." });
    }
};

// ==========================================
// 3. GENERATE E-TICKET (PDF)
// ==========================================
exports.downloadTicket = async (req, res) => {
    try {
        const booking = await TempleBooking.findById(req.params.id).populate('temple_id');
        if (!booking) return res.status(404).json({ success: false, message: "Ticket not found" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Darshan_Pass_${booking._id}.pdf`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // Header
        doc.fillColor("#7c3aed").fontSize(28).text("SARVATIRTHAMAYI", { align: "center", font: "Helvetica-Bold" });
        doc.fillColor("#475569").fontSize(12).text("Official E-Ticket & Divine Pass", { align: "center", font: "Helvetica-Oblique" });
        doc.moveDown(2);

        // Box
        doc.rect(40, 150, 515, 200).strokeColor("#e2e8f0").lineWidth(2).stroke();
        doc.fillColor("#0f172a").fontSize(20).text(booking.temple_id?.name || "Temple Visit", 60, 170, { font: "Helvetica-Bold" });
        doc.moveTo(60, 200).lineTo(530, 200).strokeColor("#e2e8f0").lineWidth(1).stroke();

        // Details
        const top = 220;
        doc.fontSize(12).fillColor("#64748b").text("DEVOTEE NAME", 60, top, { font: "Helvetica-Bold" });
        doc.fillColor("#0f172a").text(booking.devotees_name, 60, top + 15, { font: "Helvetica" });

        doc.fillColor("#64748b").text("AMOUNT PAID", 300, top, { font: "Helvetica-Bold" });
        doc.fillColor("#10b981").text(`Rs. ${booking.paid_amount}`, 300, top + 15, { font: "Helvetica-Bold" });

        doc.fillColor("#64748b").text("TRANSACTION ID", 60, top + 60, { font: "Helvetica-Bold" });
        doc.fillColor("#0f172a").text(booking.razorpay_payment_id || "N/A", 60, top + 75, { font: "Helvetica" });

        doc.end();
    } catch (error) {
        console.error("🔥 PDF Error:", error);
        res.status(500).json({ success: false, message: "Could not generate ticket" });
    }
};

// ==========================================
// 4. FETCH USER BOOKINGS
// ==========================================
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await TempleBooking.find({ user_id: req.user._id || req.user.id })
            .populate("temple_id")
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ status: "true", success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};