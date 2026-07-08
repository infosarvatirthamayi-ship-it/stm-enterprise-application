const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sql_id: { type: Number, index: true },
  
  // 🔄 Switched to ObjectId for NoSQL referencing (was Number)
  admin_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, 
  status: { type: Number, default: 1 },
  
  // Content
  short_description: { type: String, default: "" },
  long_description: { type: String, default: "" },
  mobile_number: { type: String },
  email: { type: String },
  open_time: { type: String, default: "06:00 AM" },
  close_time: { type: String, default: "09:00 PM" },
  visit_price: { type: Number, default: 0 },
  
  // --- 🎟️ THE 25% CLUB SETTINGS ---
  is_free_today: { type: Boolean, default: false },
  is_discount_active: { type: Boolean, default: false },
  member_discount_percentage: { type: Number, default: 25 }, // The default 25% Club rate
  special_discount_percentage: { type: Number, default: 0 },
  discount_start_date: { type: Date },
  discount_end_date: { type: Date },
  
  // Address 
  address_line1: { type: String },
  address_line2: { type: String },
  landmark: { type: String },
  country_name: { type: String, default: "India" },
  state_name: { type: String },
  city_name: { type: String },
  pincode: { type: String },
  address_url: { type: String },
  
  // Relationships
  country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  state_id: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  
  // --- 🌍 FIXED GEOGRAPHIC TRACKING (GeoJSON) ---
  // Replaced standalone lat/lng with proper MongoDB GeoJSON structure
  location: {
      type: {
          type: String, 
          enum: ['Point'], 
          default: 'Point'
      },
      coordinates: {
          type: [Number], // MUST BE: [longitude, latitude]
          default: [0, 0]
      }
  },
  
  // Sequences & Media
  sequence: { type: Number, default: 0 },
  trading_sequence: { type: Number, default: 0 },
  image: { type: String }, 

  // Legacy Admin Account (Kept for backward compatibility)
  admin_first_name: String,
  admin_last_name: String,
  admin_email: String,
  admin_mobile: String,
  admin_password: String 
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, // 👉 Ensures virtual fields are sent to React/Flutter
  toObject: { virtuals: true }
});

// ==========================================
// 🧠 SMART VIRTUALS (Calculated on the fly)
// ==========================================

/**
 * Automatically calculates the 25% Club price.
 * Your frontend will now receive `club_visit_price` without storing it in the DB!
 */
templeSchema.virtual('club_visit_price').get(function() {
    if (this.is_free_today || this.visit_price === 0) return 0;
    
    // Calculate the 25% discount
    const discountAmount = (this.visit_price * this.member_discount_percentage) / 100;
    return Math.max(0, this.visit_price - discountAmount); // Ensures price never goes negative
});

/**
 * Automatically calculates a standard promotional discount if active.
 */
templeSchema.virtual('promo_visit_price').get(function() {
    if (this.is_free_today || this.visit_price === 0) return 0;
    if (!this.is_discount_active) return this.visit_price;

    // Check if the current date is within the discount window
    const now = new Date();
    if (this.discount_start_date && this.discount_end_date) {
        if (now < this.discount_start_date || now > this.discount_end_date) {
            return this.visit_price; // Discount expired
        }
    }

    const discountAmount = (this.visit_price * this.special_discount_percentage) / 100;
    return Math.max(0, this.visit_price - discountAmount);
});

// ==========================================
// ⚡ PERFORMANCE INDEXES
// ==========================================
templeSchema.index({ name: 'text' }); 
templeSchema.index({ location: '2dsphere' }); // 👉 Now this works perfectly!
templeSchema.index({ status: 1, sequence: 1 }); 

module.exports = mongoose.models.Temple || mongoose.model('Temple', templeSchema);