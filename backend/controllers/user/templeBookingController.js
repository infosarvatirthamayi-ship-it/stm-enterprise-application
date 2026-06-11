const TempleBooking = require("../../models/TempleBooking");
const Temple = require("../../models/Temple");
const User = require("../../models/User");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
        console.error("❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
        return null;
    }
    return new Razorpay({ key_id, key_secret });
};

exports.createTempleBookingOrder = async (req, res) => {
    try {
        const { templeId, date, whatsAppNumber, devoteeName, wish, paymentType } = req.body;

        const numericTempleId = Number(templeId);
        if (!templeId || isNaN(numericTempleId)) {
            return res.status(400).json({ status: "false", success: false, message: "Invalid Temple Selection." });
        }

        const temple = await Temple.findOne({ sql_id: numericTempleId });
        if (!temple) {
            return res.status(404).json({ status: "false", success: false, message: "Temple not found." });
        }

        const visitPrice = Number(temple.visit_price || 0);
        const amountInPaise = Math.round(visitPrice * 100);
        let orderId = `FREE_${Date.now()}`;
        const publicKey = process.env.RAZORPAY_KEY_ID;

        if (amountInPaise > 0) {
            const rzp = getRazorpayInstance();
            if (!rzp) return res.status(500).json({ status: "false", message: "Payment gateway error" });
            
            const order = await rzp.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${Date.now()}`
            });
            orderId = order.id;
        }

        // Save with explicit types to match your Schema
        const newBooking = new TempleBooking({
            user_id: req.user._id || req.user.id,
            temple_id: temple._id,
            sql_id: Math.floor(100000 + Math.random() * 900000),
            devotees_name: devoteeName || "Anonymous Devotee",
            whatsapp_number: whatsAppNumber || "0000000000",
            date: date ? new Date(date) : new Date(),
            wish: wish || "",
            original_amount: visitPrice,
            paid_amount: visitPrice,
            razorpay_order_id: orderId,
            booking_status: amountInPaise > 0 ? 1 : 2,
            payment_status: amountInPaise > 0 ? 1 : 2,
            payment_type: Number(paymentType) || 2 
        });
        
        await newBooking.save();

        return res.status(200).json({
            status: "true",
            success: true,
            data: {
                id: newBooking.sql_id,
                payment: {
                    razorpay_order_id: orderId,
                    razorpay_public_key: publicKey || ""
                }
            }
        });
    } catch (error) {
        console.error("🔥 Booking Flow Error:", error);
        return res.status(500).json({ status: "false", success: false, message: error.message });
    }
};

exports.verifyAndConfirmBooking = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: "false", message: "Security verification failed" });
        }

        const booking = await TempleBooking.findOne({ razorpay_order_id });
        if (!booking) return res.status(404).json({ status: "false", message: "Booking record not found" });

        booking.payment_status = 2; 
        booking.booking_status = 2; 
        booking.razorpay_payment_id = razorpay_payment_id;
        booking.payment_date = new Date();
        await booking.save();

        res.status(200).json({ status: "true", success: true, message: "Payment verified successfully." });
    } catch (error) {
        res.status(500).json({ status: "false", message: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await TempleBooking.find({ user_id: req.user.id }).populate("temple_id").sort({ date: -1 }).lean();
        res.status(200).json({ status: "true", success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ status: "false", success: false, message: error.message });
    }
};