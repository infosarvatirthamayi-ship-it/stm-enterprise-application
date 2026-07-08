// backend/models/Membership.js
const mongoose = require("mongoose");

const membershipTempleSchema = new mongoose.Schema(
  {
    temple_id: { type: mongoose.Schema.Types.ObjectId, ref: "Temple", required: true },
    temple_name: { type: String, default: "" },
    max_visits: { type: Number, default: 1 },
  },
  { _id: false }
);

const membershipSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, default: undefined, index: { unique: true, sparse: true } },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    visits: { type: Number, default: 0 },
    total_visits: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    
    // 🎯 THE ARCHITECTURAL UPGRADE: Smart Discount Engine (0 to 100%)
    discount_percentage: { type: Number, default: 0, min: 0, max: 100 },
    
    duration: { type: Number, default: 1 },
    duration_type: { type: Number, enum: [1, 2], default: 1 },
    status: { type: Number, enum: [0, 1], default: 1, index: true },
    temples: { type: [membershipTempleSchema], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "memberships" }
);

module.exports = mongoose.models.Membership || mongoose.model("Membership", membershipSchema);