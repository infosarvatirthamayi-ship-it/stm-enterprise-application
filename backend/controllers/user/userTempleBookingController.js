// backend/controllers/user/userTempleBookingController.js
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const Temple = require("../../models/Temple");
const TempleBooking = require("../../models/TempleBooking");
const PurchasedMemberCard = require("../../models/PurchasedMemberCard");
const { validateVoucher, redeemVoucher } = require("../../utils/voucherHelper");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.initiateTempleBooking = async (req, res) => {
    try {
        const { temple_id, date, devotees_name, whatsapp_number, wish, voucherCode } = req.body;
        const userId = req.user._id || req.user.id;

        // 1. Fetch Temple
        const temple = await Temple.findById(temple_id);
        if (!temple) return res.status(404).json({ success: false, message: "Temple not found." });

        let finalAmount = temple.visit_price;
        let discountBreakdown = { memberDiscount: 0, voucherDiscount: 0, originalPrice: finalAmount };

        // 2. SCENARIO A: Is the Temple Free Today?
        if (temple.is_free_today || finalAmount === 0) {
            return res.status(200).json({
                success: true,
                isFree: true,
                message: "This temple is free to visit today!",
                data: { finalAmount: 0 }
            });
            // Frontend should call an explicit "Confirm Free Booking" route if isFree is true.
        }

        // 3. CHECK MEMBERSHIP STATUS
        const activeMembership = await PurchasedMemberCard.findOne({ 
            user_id: userId, 
            card_status: 1, 
            end_date: { $gte: new Date() } 
        });

        const isMember = !!activeMembership;

        // 4. APPLY MEMBERSHIP DISCOUNT
        if (isMember) {
            const memberDiscount = (finalAmount * temple.member_discount_percentage) / 100;
            finalAmount -= memberDiscount;
            discountBreakdown.memberDiscount = memberDiscount;
        }

        // 5. THE VOUCHER ENGINE & GUEST LIMITS
        let appliedVoucherId = null;
        if (voucherCode) {
            // 🛑 THE GUEST LIMIT CHECK
            if (!isMember) {
                const previousVoucherUses = await TempleBooking.countDocuments({
                    user_id: userId,
                    voucher_applied_id: { $ne: null },
                    payment_status: 2 // Only count successful payments
                });

                if (previousVoucherUses >= 2) { // Max 2 vouchers for non-members
                    return res.status(403).json({
                        success: false,
                        code: "GUEST_LIMIT_REACHED",
                        message: "You've used your guest promo limit! Unlock unlimited offers by joining the STM Club."
                    });
                }
            }

            // Calculate Voucher
            try {
                const voucherResult = await validateVoucher(voucherCode, userId, 'temple', finalAmount);
                finalAmount = voucherResult.finalAmount;
                discountBreakdown.voucherDiscount = voucherResult.discountAmount;
                appliedVoucherId = voucherResult.voucherId;
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        // 6. GENERATE RAZORPAY ORDER
        const amountInPaise = Math.round(finalAmount * 100);
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `t_book_${Date.now().toString().slice(-6)}`
        });

        // 7. CREATE PENDING BOOKING IN DB
        const booking = await TempleBooking.create({
            user_id: userId,
            temple_id: temple._id,
            devotees_name,
            whatsapp_number,
            wish,
            date,
            booking_status: 1, // Pending
            payment_status: 1, // Pending
            razorpay_order_id: order.id,
            original_amount: discountBreakdown.originalPrice,
            offer_discount_amount: discountBreakdown.voucherDiscount + discountBreakdown.memberDiscount,
            paid_amount: finalAmount,
            voucher_applied_id: appliedVoucherId, // Note: You need to add this field to your Schema!
            purchased_member_card_id: activeMembership ? activeMembership._id : null
        });

        // 8. SEND TO FRONTEND
        res.status(200).json({
            success: true,
            data: {
                bookingId: booking._id,
                razorpay_order_id: order.id,
                razorpay_public_key: process.env.RAZORPAY_KEY_ID,
                breakdown: discountBreakdown,
                final_amount: finalAmount
            }
        });

    } catch (error) {
        console.error("Booking Init Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Add this right below the end of initiateTempleBooking...

exports.verifyTempleBooking = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const userId = req.user._id || req.user.id;

        // 1. Verify Razorpay Signature securely
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ success: false, message: "Invalid payment signature. Potential fraud detected." });
        }

        // 2. Find and update the pending booking
        const booking = await TempleBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        booking.payment_status = 2; // 2 = Success
        booking.booking_status = 2; // 2 = Success
        booking.razorpay_payment_id = razorpay_payment_id;
        await booking.save();

        // 3. (Optional) Redeem the voucher so it can't be used again
        if (booking.voucher_applied_id && typeof redeemVoucher === 'function') {
            await redeemVoucher(booking.voucher_applied_id, userId);
        }

        return res.status(200).json({ 
            success: true, 
            message: "Payment verified successfully! Digital Pass Activated.", 
            data: booking 
        });

    } catch (error) {
        console.error("Booking Verify Error:", error);
        return res.status(500).json({ success: false, message: "Server Error during verification." });
    }
};

exports.verifyTemplePayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        // 1. Verify the signature to guarantee the payment is real
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // 2. Payment is valid! Update the booking in the database
            const booking = await TempleBooking.findByIdAndUpdate(
                bookingId,
                {
                    paymentStatus: "Completed",
                    transactionId: razorpay_payment_id,
                    status: "Confirmed"
                },
                { new: true }
            );

            // 3. Prepare the Ticket URL for the frontend download button
            // (We will build the actual PDF generator in the next step, 
            // for now, we just pass the URL where it WILL be)
            const ticketUrl = `/user/book-temple/ticket/${booking._id}`;

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                ticketUrl: ticketUrl
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error during verification" });
    }
};

exports.verifyAndConfirmBooking = async (req, res) => {
    try {
        // These match exactly what the frontend is sending
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = req.body;

        // 1. Verify the signature to guarantee the payment is real
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // 2. Payment is valid! Update the booking in the database
            const booking = await TempleBooking.findByIdAndUpdate(
                bookingId,
                {
                    paymentStatus: "Completed",
                    transactionId: razorpay_payment_id,
                    status: "Confirmed" // Or whatever your schema uses for a successful booking
                },
                { new: true }
            );

            // 3. Prepare the Ticket URL for the frontend download button
            const ticketUrl = `/api/user/book-temple/ticket/${booking._id}`;

            // 4. THIS IS THE MAGIC SIGNAL: Tell the frontend to show the Success Screen!
            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                ticketUrl: ticketUrl
            });
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error during verification" });
    }
};

exports.downloadTicket = async (req, res) => {
    try {
        const bookingId = req.params.id;
        
        // 1. Fetch the booking and populate temple details
        const booking = await TempleBooking.findById(bookingId).populate('templeId');
        
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        // 2. Set up the PDF response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition", 
            `attachment; filename=Sarvatirtham_Ticket_${booking.transactionId || booking._id}.pdf`
        );

        // 3. Create the PDF Document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.pipe(res);

        // --- DESIGNING THE TICKET ---
        
        // Header
        doc.fillColor("#7c3aed")
           .fontSize(28)
           .text("SARVATIRTHAMAYI", { align: "center", font: "Helvetica-Bold" });
           
        doc.fillColor("#475569")
           .fontSize(12)
           .text("Official E-Ticket & Divine Pass", { align: "center", font: "Helvetica-Oblique" });
           
        doc.moveDown(2);

        // Ticket Box
        doc.rect(40, 150, 515, 250).strokeColor("#e2e8f0").lineWidth(2).stroke();
        
        // Temple Name
        doc.fillColor("#0f172a")
           .fontSize(20)
           .text(booking.templeId?.name || "Temple Visit", 60, 170, { font: "Helvetica-Bold" });
           
        doc.moveTo(60, 200).lineTo(530, 200).strokeColor("#e2e8f0").lineWidth(1).stroke();

        // Booking Details
        doc.fontSize(12).fillColor("#64748b");
        
        const detailsTop = 220;
        const col1 = 60;
        const col2 = 300;

        // Devotee Name
        doc.text("DEVOTEE NAME", col1, detailsTop, { font: "Helvetica-Bold" });
        doc.fillColor("#0f172a").text(booking.devoteeName || "N/A", col1, detailsTop + 15, { font: "Helvetica" });

        // Visit Date
        doc.fillColor("#64748b").text("DATE OF VISIT", col2, detailsTop, { font: "Helvetica-Bold" });
        const visitDate = booking.visitDate ? new Date(booking.visitDate).toLocaleDateString() : "N/A";
        doc.fillColor("#0f172a").text(visitDate, col2, detailsTop + 15, { font: "Helvetica" });

        // Transaction ID
        doc.fillColor("#64748b").text("TRANSACTION ID", col1, detailsTop + 60, { font: "Helvetica-Bold" });
        doc.fillColor("#0f172a").text(booking.transactionId || "Pending", col1, detailsTop + 75, { font: "Helvetica" });

        // Amount Paid
        doc.fillColor("#64748b").text("AMOUNT PAID", col2, detailsTop + 60, { font: "Helvetica-Bold" });
        doc.fillColor("#10b981").text(`Rs. ${booking.amount || 0}`, col2, detailsTop + 75, { font: "Helvetica-Bold" });

        // Special Sankalpam (If any)
        if (booking.specialWish) {
            doc.fillColor("#64748b").text("SANKALPAM / GOTRA", col1, detailsTop + 120, { font: "Helvetica-Bold" });
            doc.fillColor("#0f172a").text(booking.specialWish, col1, detailsTop + 135, { font: "Helvetica", width: 470 });
        }

        // Footer
        doc.moveDown(5);
        doc.fillColor("#94a3b8")
           .fontSize(10)
           .text("Please present this E-Ticket (digital or printed) at the temple entrance.", { align: "center" });
        doc.text("May the divine blessings be with you.", { align: "center", font: "Helvetica-Oblique" });

        // 4. Finalize the PDF
        doc.end();

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ success: false, message: "Could not generate ticket" });
    }
};