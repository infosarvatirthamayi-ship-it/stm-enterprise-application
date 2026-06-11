const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true }, // Kept for legacy reference
    temple_id: { type: mongoose.Schema.Types.ObjectId, ref: "Temple" },
    name: { type: String, required: true, trim: true },
    short_description: { type: String },
    long_description: { type: String },
    status: { type: Number, default: 1 }, // 1 => Active, 0 => Inactive
    date: { type: Date, required: true },
    price: { type: Number, default: 0 },
    image: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Event", eventSchema);