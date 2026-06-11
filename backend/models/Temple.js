const mongoose = require('mongoose');

const templeSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sql_id: { type: Number, index: true },
  user_id: { type: Number, index: true }, 
  status: { type: Number, default: 1 },
  
  // Content
  short_description: { type: String, default: "" },
  long_description: { type: String, default: "" },
  mobile_number: { type: String },
  email: { type: String },
  open_time: { type: String, default: "06:00 AM" },
  close_time: { type: String, default: "09:00 PM" },
  visit_price: { type: Number, default: 0 },
  
  // --- Enhanced Admin Controls ---
  is_free_today: { type: Boolean, default: false },
  is_discount_active: { type: Boolean, default: false },
  member_discount_percentage: { type: Number, default: 25 },
  special_discount_percentage: { type: Number, default: 0 },
  
  // Added time-based discount scheduling
  discount_start_date: { type: Date },
  discount_end_date: { type: Date },
  
  // Address & Geo
  address_line1: { type: String },
  address_line2: { type: String },
  landmark: { type: String },
  country_name: { type: String, default: "India" },
  state_name: { type: String },
  city_name: { type: String },
  
  // Relationships (Referencing)
  country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  state_id: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  
  pincode: { type: String },
  latitude: { type: Number }, 
  longitude: { type: Number }, 
  address_url: { type: String },
  
  // Sequences
  sequence: { type: Number, default: 0 },
  trading_sequence: { type: Number, default: 0 },
  image: { type: String }, 

  // Admin Account (Kept for your current flow, though ideally in a User collection)
  admin_first_name: String,
  admin_last_name: String,
  admin_email: String,
  admin_mobile: String,
  admin_password: String 
}, { timestamps: true });

// --- Performance Indexes ---
templeSchema.index({ name: 'text' }); // Allows fast text searching
templeSchema.index({ location: '2dsphere' }); // Optimized for map-based queries
templeSchema.index({ status: 1, sequence: 1 }); // Optimized for list views

module.exports = mongoose.model('Temple', templeSchema);