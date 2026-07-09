const mongoose = require("mongoose");

const templeBookingSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, unique: true, sparse: true }, // Added sparse so new records don't crash without an sql_id
    booking_id: { type: String, default: null },
    
    // References to other collections using ObjectIds
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    temple_id: { type: mongoose.Schema.Types.ObjectId, ref: "Temple", default: null },
    
    whatsapp_number: { type: String, required: true },
    devotees_name: { type: String, required: true },
    wish: { type: String, default: null },
    date: { type: Date, required: true },
    
    booking_status: { type: Number, default: 1 }, // 1: Pending, 2: Confirmed, 3: Cancelled
    payment_type: { type: Number, default: 1 },   // 1: Cash, 2: Online, 3: Card
    payment_status: { type: Number, default: 1 }, // 1: Pending, 2: Paid, 3: Failed
    
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null }, 
    payment_date: { type: Date, default: null },
    
    // 🎯 THE FIX: Changed from Number to ObjectId
    purchased_member_card_id: { type: mongoose.Schema.Types.ObjectId, ref: "PurchasedMemberCard", default: null },
    
    offer_discount_amount: { type: Number, default: 0 },
    original_amount: { type: Number, default: 0 },
    paid_amount: { type: Number, default: 0 },
    
    qr_code: { type: String, default: null },
    
    voucher_applied_id: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", default: null },
    
    // Legacy SQL timestamps
    created_at: { type: Date },
    updated_at: { type: Date }
  },
  { 
    collection: "temple_bookings",
    timestamps: true // 🎯 THE FIX: Let Mongoose handle dates for all new bookings automatically!
  }
);

module.exports = mongoose.model("TempleBooking", templeBookingSchema);