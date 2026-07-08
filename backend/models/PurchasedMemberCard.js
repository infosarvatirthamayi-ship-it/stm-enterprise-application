const mongoose = require("mongoose");

const purchasedMemberCardSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, default: undefined, index: { unique: true, sparse: true } },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    membership_card_id: { type: mongoose.Schema.Types.ObjectId, ref: "Membership", required: true, index: true },
    
    // 0 = Pending (Order Created), 1 = Active (Paid), 2 = Expired/Cancelled
    card_status: { type: Number, enum: [0, 1, 2], default: 0, index: true }, 
    
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null, index: true },
    
    max_visits: { type: Number, default: 0 },
    used_visits: { type: Number, default: 0 },
    
    payment_type: { type: Number, default: 2 }, // e.g., 2 = Online Gateway
    payment_status: { type: Number, enum: [1, 2, 3], default: 1, index: true }, // 1=Pending, 2=Success, 3=Failed
    
    razorpay_order_id: { type: String, default: null, index: true, sparse: true },
    razorpay_payment_id: { type: String, default: null, index: { unique: true, sparse: true } },
    paid_amount: { type: Number, default: 0 },

    // 🎯 NEW: Capture Personalization Data from Checkout
    personalization: {
        birthday: { type: Date, default: null },
        anniversary: { type: Date, default: null },
        selected_temples: { type: [String], default: [] }, // Stores the 5 chosen temples
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "purchasedmembercards" }
);

module.exports = mongoose.models.PurchasedMemberCard || mongoose.model("PurchasedMemberCard", purchasedMemberCardSchema);