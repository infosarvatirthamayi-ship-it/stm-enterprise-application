// backend/services/bookingService.js
const crypto = require("crypto");
const Temple = require("../models/Temple");
const TempleBooking = require("../models/TempleBooking");
const PurchasedMemberCardTemple = require("../models/PurchasedMemberCardTemple");
const Voucher = require("../models/Voucher"); // 👈 Import Voucher Model
const { NotificationHub } = require("../controllers/shared/authService");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const generateBookingId = (prefix) => `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

exports.BookingService = {
    
    prepareTempleCheckout: async (user, templeId, bookingData) => {
        const { date, devotees_name, whatsapp_number, wish, voucher_code } = bookingData;

        if (!date || !devotees_name || !whatsapp_number) throw new Error("Missing required booking details.");

        const temple = await Temple.findById(templeId);
        if (!temple) throw new Error("Temple not found.");

        let finalAmount = temple.visit_price || 0;
        let isFreeClubVisit = false;
        let activeCardId = null;
        let discountAmount = 0;

        // 1. 🛡️ Check for STM Club Privileges
        if (user && finalAmount > 0) {
            const clubCard = await PurchasedMemberCardTemple.findOne({
                user_id: user._id, temple_id: temple._id,
            });

            if (clubCard && clubCard.used_visit < clubCard.max_visits) {
                finalAmount = 0;
                isFreeClubVisit = true;
                activeCardId = clubCard.purchased_member_card_id;
            } else {
                // Not a free visit, apply standard 25% club discount
                finalAmount = temple.club_visit_price; 
            }
        }

        // 2. 🎟️ Apply Voucher Code Logic (If provided)
        if (voucher_code && finalAmount > 0) {
            const voucher = await Voucher.findOne({ code: String(voucher_code).toUpperCase(), status: 1 });
            
            if (!voucher) throw new Error("Invalid or inactive voucher code.");
            if (voucher.expiry_date && new Date() > voucher.expiry_date) throw new Error("Voucher has expired.");
            if (voucher.max_total_usage && voucher.used_count >= voucher.max_total_usage) throw new Error("Voucher usage limit reached.");
            if (voucher.used_by && voucher.used_by.includes(user._id)) throw new Error("You have already used this voucher.");

            // Calculate Discount
            if (voucher.discount_type === 'percentage') {
                discountAmount = (finalAmount * voucher.discount_value) / 100;
            } else {
                discountAmount = voucher.discount_value;
            }

            finalAmount = Math.max(0, finalAmount - discountAmount);
            
            // Mark Voucher as Used
            voucher.used_count += 1;
            voucher.used_by.push(user._id);
            await voucher.save();
        }

        // Create Pending Booking Record
        const newBooking = await TempleBooking.create({
            sql_id: Date.now(),
            booking_id: generateBookingId('TV'),
            user_id: user._id,
            temple_id: temple._id,
            date: new Date(date),
            devotees_name,
            whatsapp_number,
            wish,
            original_amount: temple.visit_price,
            paid_amount: finalAmount,
            offer_discount_amount: discountAmount,
            purchased_member_card_id: activeCardId,
            booking_status: 1, 
            payment_status: 1 
        });

        // 🎯 THE ZERO-RUPEE BYPASS
        if (finalAmount === 0 || isFreeClubVisit) {
            newBooking.booking_status = 2;
            newBooking.payment_status = 2;
            newBooking.payment_type = isFreeClubVisit ? 0 : 2; 
            await newBooking.save();

            NotificationHub.dispatchOtp(user.email, whatsapp_number, `STM-${newBooking.booking_id}`, "Visit Confirmed").catch(() => {});
            return { requires_payment: false, booking: newBooking, message: "Free Visit Applied." };
        }

        // Generate Razorpay Order
        const rzpOrder = await razorpay.orders.create({
            amount: Math.round(finalAmount * 100), 
            currency: "INR",
            receipt: newBooking.booking_id
        });

        newBooking.razorpay_order_id = rzpOrder.id;
        await newBooking.save();

        return { requires_payment: true, booking: newBooking, payment_gateway_data: rzpOrder };
    },

    verifyTemplePayment: async (user, verificationData) => {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = verificationData;

        const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");

        if (expectedSignature !== razorpay_signature) throw new Error("Payment tampered.");

        const booking = await TempleBooking.findOne({ booking_id, user_id: user._id }).populate('temple_id', 'name');
        if (!booking) throw new Error("Booking record not found.");

        booking.booking_status = 2;
        booking.payment_status = 2;
        booking.razorpay_payment_id = razorpay_payment_id;
        booking.razorpay_signature = razorpay_signature;
        booking.payment_date = new Date();
        booking.payment_type = 2; 
        
        await booking.save();
        NotificationHub.dispatchOtp(user.email, booking.whatsapp_number, `STM-${booking.booking_id}`, `Payment Confirmed`).catch(() => {});

        return booking;
    }
};