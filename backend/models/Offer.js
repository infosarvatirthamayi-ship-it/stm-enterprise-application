const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, default: null, index: true },
    temple_id: { type: Number, required: [true, "Temple ID is required"], index: true },
    name: { type: String, required: [true, "Offer name is required"], trim: true, maxlength: 150 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },

    // 1 = Global/General, 2 = Ritual, 3 = Event, 5 = Donation
    type: { 
      type: Number, 
      required: true,
      enum: { values: [1, 2, 3, 5], message: "Invalid offer type" }
    },
    reference_id: { type: Number, required: [true, "Reference ID is required"], index: true },

    coupon_code: { type: String, trim: true, uppercase: true, default: null },

    // DISCOUNT SETTINGS
    discount_percentage: { type: Number, default: null, min: 0, max: 100 },
    discount_amount: { type: Number, default: null, min: 0 },

    // OFFER LOGIC & LIMITS
    usage_limit: { type: Number, default: null }, // Null means unlimited
    used_count: { type: Number, default: 0, min: 0 },

    // 🎯 ADMIN THRESHOLD CONTROL
    threshold_enabled: { type: Boolean, default: false },
    threshold_amount: { type: Number, default: 0, min: 0 },

    valid_from: { type: Date, default: Date.now },
    valid_to: { type: Date, default: null },

    image: { type: String, default: "" },
    status: { type: Number, default: 1, enum: [0, 1] },
    sequence: { type: Number, default: 0, min: 0 },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
  },
  { collection: "offers", versionKey: false }
);

// AUTO UPDATE TIMESTAMP
offerSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// VALIDATIONS
offerSchema.pre("validate", function (next) {
  if (!this.discount_percentage && !this.discount_amount) {
    return next(new Error("Either discount percentage or discount amount is required"));
  }
  if (this.discount_percentage && this.discount_amount) {
    return next(new Error("Use either percentage OR fixed amount, not both"));
  }
  if (this.valid_to && this.valid_from && this.valid_to < this.valid_from) {
    return next(new Error("Valid To date must be greater than Valid From date"));
  }
  next();
});

module.exports = mongoose.models.Offer || mongoose.model("Offer", offerSchema);