const mongoose = require("mongoose");

const eventBookingSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    booking_id: { type: String },
    
    // 🎯 CHANGED TO NUMBER: These hold your legacy SQL IDs, not Mongoose ObjectIds
    user_id: { type: Number },
    temple_id: { type: Number },
    event_id: { type: Number },
    
    whatsapp_number: { type: String, required: true },
    devotees_name: { type: String, required: true },
    
    booking_status: { type: Number, default: 1 }, // 1 => Pending, 2 => Confirmed, 3 => Cancelled
    payment_status: { type: Number, default: 1 }, // 1 => Pending, 2 => Paid, 3 => Failed
    paid_amount: { type: Number, default: 0 },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    
    // 🎯 CRITICAL FIX: Forces Mongoose to use your actual migrated table
    collection: 'event_bookings' 
  }
);

module.exports = mongoose.model("EventBooking", eventBookingSchema);