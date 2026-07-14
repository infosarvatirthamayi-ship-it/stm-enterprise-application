// backend/controllers/user/ritualController.js
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Ritual = require("../../models/Ritual");
const RitualPackage = require("../../models/RitualPackage");
const RitualBooking = mongoose.models.RitualBooking || require("../../models/RitualBooking");
const Temple = mongoose.models.Temple || require("../../models/Temple");
const User = mongoose.models.User || require("../../models/User");
const formatImageUrl = require("../../utils/imageUrl");
const Favorite = require("../../models/Favorite");

const FLUTTER_MESSAGES = {
  ritualListSuccess: "Ritual list fetched successfully",
  ritualShowSuccess: "Ritual fetched successfully",
  ritualPackageSuccess: "Ritual packages fetched successfully",
  ritualBookingSuccess: "Ritual booking created successfully.",
  ritualVerifySuccess: "Ritual booking verified successfully.",
  ritualBookingDetailsSuccess: "Ritual booking details fetched successfully.",
};

const getRazorpayInstance = () =>
  new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

const getSourceValue = (source, ...keys) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return null;
};

const buildTempleAddress = (temple) => {
  if (!temple) return {};
  
  const city = temple.city_name || temple.city || "";
  const state = temple.state_name || temple.state || "";
  const address1 = temple.address_line1 || "";
  
  // Build a clean full address string
  const full_address = [address1, city, state].filter(Boolean).join(", ");

  return {
    full_address: full_address,
    address_line1: address1,
    address_line2: temple.address_line2 || "",
    landmark: temple.landmark || "",
    city: city,
    state: state,
    pincode: temple.pincode || "",
    country: temple.country_name || temple.country || "India",
    latitude: temple.location?.coordinates?.[1] || "", // Proper GeoJSON extraction
    longitude: temple.location?.coordinates?.[0] || "",
    address_url: temple.address_url || "",
  };
};

const buildTempleLookup = (templeId) => {
  const numericTempleId = toNumberOrNull(templeId);
  return {
    $or: [
      ...(numericTempleId !== null ? [{ sql_id: numericTempleId }] : []),
      ...(isValidObjectId(templeId) ? [{ _id: templeId }] : []),
    ],
  };
};

const buildRitualLookup = (ritualId) => {
  const numericRitualId = toNumberOrNull(ritualId);
  return {
    $or: [
      ...(numericRitualId !== null ? [{ sql_id: numericRitualId }] : []),
      ...(isValidObjectId(ritualId) ? [{ _id: ritualId }] : []),
    ],
  };
};

const buildPackageLookup = (packageId) => {
  const numericPackageId = toNumberOrNull(packageId);
  return {
    $or: [
      ...(numericPackageId !== null ? [{ sql_id: numericPackageId }] : []),
      ...(isValidObjectId(packageId) ? [{ _id: packageId }] : []),
    ],
  };
};

const getAuthUserSqlId = async (req) => {
  const directSqlId = Number(req.user?.sql_id || req.user?.user_id);
  if (!Number.isNaN(directSqlId) && directSqlId > 0) return directSqlId;

  const mongoUserId = req.user?._id || req.user?.id;
  if (mongoUserId && mongoose.isValidObjectId(String(mongoUserId))) {
    const dbUser = await User.findById(mongoUserId).select("sql_id").lean();
    const dbSqlId = Number(dbUser?.sql_id);
    if (!Number.isNaN(dbSqlId) && dbSqlId > 0) return dbSqlId;
  }
  return 0;
};

// 🎯 FIX: Supports [0, 1] universally, fetches Type, and securely passes MongoDB _id
exports.getRitualsByTemple = async (req, res) => {
  try {
    const source = { ...req.query, ...req.body };
    const templeId = getSourceValue(source, "temple_id", "templeId");
    const userSqlId = await getAuthUserSqlId(req);

    if (!templeId) return sendError(res, 400, "temple_id is required");

    const temple = await Temple.findOne(buildTempleLookup(templeId)).lean();
    if (!temple) return sendError(res, 404, "Temple not found");

    const rituals = await Ritual.find({ temple_id: temple._id, status: { $in: [0, 1] } })
      .populate('ritual_type_id', 'name')
      .sort({ sequence: 1, created_at: -1 })
      .lean();

    const ritualSqlIds = rituals.map((r) => Number(r.sql_id)).filter(Boolean);
    let favoriteSet = new Set();

    if (userSqlId > 0 && ritualSqlIds.length > 0) {
      const favoriteDocs = await Favorite.find({
        user_id: userSqlId,
        type: 2,
        status: 1,
        reference_id: { $in: ritualSqlIds },
      }).lean();
      favoriteSet = new Set(favoriteDocs.map((f) => Number(f.reference_id)));
    }

    const formatted = rituals.map((ritual) => {
      let finalName = ritual.name || "";
      if (/^\d+$/.test(finalName.trim()) && ritual.description) finalName = ritual.description;

      return {
        _id: ritual._id, // 🎯 THE FIX: Crucial for Web BFF Routing
        id: Number(ritual.sql_id) || 0, // Kept for legacy Flutter mobile support
        name: String(finalName),
        description: String(ritual.description || ""),
        type: ritual.ritual_type_id ? ritual.ritual_type_id.name : null,
        temple_id: Number(temple.sql_id) || 0,
        temple_name: String(temple.name || ""),
        image: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image),
        image_thumb: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image),
        devotees_booked_count: 0,
        is_favorite: favoriteSet.has(Number(ritual.sql_id)) ? 1 : 0,
        address: buildTempleAddress(temple),
      };
    });

    return res.status(200).json({
      status: "true", success: true, message: FLUTTER_MESSAGES.ritualListSuccess,
      data: {
        data: formatted, total_count: formatted.length, is_next: false, is_prev: false,
        total_pages: 1, current_page: 1, per_page: formatted.length, from: formatted.length ? 1 : 0,
        to: formatted.length, next_page_url: null, prev_page_url: null, path: req.originalUrl,
        has_pages: false, links: [],
      },
    });
  } catch (error) { return sendError(res, 500, error.message); }
};

// 🎯 FIX: Supports [0, 1] universally & fetches Type
exports.getRitualShow = async (req, res) => {
  try {
    const source = { ...req.query, ...req.body };
    const ritualId = getSourceValue(source, "ritual_id", "ritualId");
    const requestedTempleId = getSourceValue(source, "temple_id", "templeId");
    const userSqlId = await getAuthUserSqlId(req);

    if (!ritualId) return sendError(res, 400, "ritual_id is required");

    const ritual = await Ritual.findOne({ ...buildRitualLookup(ritualId), status: { $in: [0, 1] } })
      .populate('ritual_type_id', 'name')
      .lean();
      
    if (!ritual) return sendError(res, 404, "Ritual not found");

    let temple = null;
    if (ritual.temple_id && mongoose.Types.ObjectId.isValid(String(ritual.temple_id))) {
      temple = await Temple.findOne({ _id: ritual.temple_id, status: { $in: [0, 1] } }).lean();
    }
    if (!temple) {
      const ritualTempleSqlId = Number(ritual.temple_id || ritual.templeId || 0);
      if (ritualTempleSqlId > 0) temple = await Temple.findOne({ sql_id: ritualTempleSqlId, status: { $in: [0, 1] } }).lean();
    }
    if (!temple) {
      const fallbackTempleSqlId = Number(requestedTempleId || 0);
      if (fallbackTempleSqlId > 0) temple = await Temple.findOne({ sql_id: fallbackTempleSqlId, status: { $in: [0, 1] } }).lean();
    }

    const resolvedTempleId = Number(temple?.sql_id) || Number(ritual.temple_id || ritual.templeId || 0) || Number(requestedTempleId || 0) || 0;

    let favouriteExists = false;
    if (userSqlId > 0) {
      favouriteExists = !!(await Favorite.exists({
        user_id: userSqlId, reference_id: Number(ritual.sql_id) || 0, type: 2, status: 1,
      }));
    }

    let finalName = ritual.name || "";
    if (/^\d+$/.test(finalName.trim()) && ritual.description) finalName = ritual.description;

    return res.status(200).json({
      status: "true", success: true, message: FLUTTER_MESSAGES.ritualShowSuccess,
      data: {
        id: Number(ritual.sql_id) || 0,
        temple_id: resolvedTempleId,
        temple_name: String(temple?.name || ""),
        name: String(finalName),
        description: String(ritual.description || ""),
        type: ritual.ritual_type_id ? ritual.ritual_type_id.name : null,
        image: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image),
        image_thumb: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image),
        devotees_booked_count: 0,
        is_favorite: favouriteExists ? 1 : 0,
        address: buildTempleAddress(temple)
      },
    });
  } catch (error) { return sendError(res, 500, error.message); }
};

// 🎯 FIX: Supports [0, 1] universally
exports.getRitualPackages = async (req, res) => {
  try {
    const source = { ...req.query, ...req.body };
    const ritualId = getSourceValue(source, "ritual_id", "ritualId");

    if (!ritualId) return sendError(res, 400, "ritual_id is required");

    const ritual = await Ritual.findOne({ ...buildRitualLookup(ritualId), status: { $in: [0, 1] } }).lean();
    if (!ritual) return sendError(res, 404, "Ritual not found");

    const packages = await RitualPackage.find({ ritual_id: ritual._id, status: { $in: [0, 1] } })
      .sort({ created_at: 1, _id: 1 }).lean();

    const ritualTempleId = Number(ritual.temple_id || ritual.templeId || 0);

    const formatted = packages.map((pkg) => ({
      id: Number(pkg.sql_id) || 0,
      ritual_id: Number(ritual.sql_id) || 0,
      temple_id: ritualTempleId,
      name: String(pkg.name || ""),
      description: String(pkg.description || ""),
      devotees_count: Number(pkg.devotees_count || 1),
      price: String(pkg.price || 0),
      offer_price: String(pkg.offer_price || pkg.price || 0),
    }));

    return res.status(200).json({
      status: "true", success: true, message: FLUTTER_MESSAGES.ritualPackageSuccess, data: { data: formatted },
    });
  } catch (error) { return sendError(res, 500, error.message); }
};

exports.createRitualOrder = async (req, res) => {
  try {
    const source = { ...req.query, ...req.body };

    const templeId = getSourceValue(source, "temple_id", "templeId");
    const ritualId = getSourceValue(source, "ritual_id", "ritualId");
    const ritualPackageId = getSourceValue(source, "ritual_package_id", "ritualPackageId");
    const date = getSourceValue(source, "date");
    const whatsAppNumber = getSourceValue(source, "whatsAppNumber", "whatsapp_number");
    const devoteeName = getSourceValue(source, "devoteeName", "devotees_name");
    const wish = getSourceValue(source, "wish") || "";
    const offerId = getSourceValue(source, "offerId", "offer_id");
    const paymentType = toNumberOrNull(getSourceValue(source, "paymentType", "payment_type")) || 2;

    if (!templeId || !ritualId || !ritualPackageId || !date || !whatsAppNumber || !devoteeName) {
      return sendError(res, 400, "Required booking fields are missing");
    }

    const [templeDoc, ritualDoc, packageDoc] = await Promise.all([
      Temple.findOne(buildTempleLookup(templeId)),
      Ritual.findOne(buildRitualLookup(ritualId)),
      RitualPackage.findOne(buildPackageLookup(ritualPackageId)),
    ]);

    if (!templeDoc) return sendError(res, 404, "Temple not found");
    if (!ritualDoc) return sendError(res, 404, "Ritual not found");
    if (!packageDoc) return sendError(res, 404, "Ritual package not found");

    if (String(ritualDoc.temple_id) !== String(templeDoc._id)) return sendError(res, 400, "Ritual does not belong to the selected temple");
    if (String(packageDoc.ritual_id) !== String(ritualDoc._id)) return sendError(res, 400, "Package does not belong to the selected ritual");

    const amount = Number(packageDoc.price || 0);
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `rit_${Date.now()}`,
    });

    const booking = await RitualBooking.create({
      sql_id: Math.floor(100000 + Math.random() * 900000),
      booking_id: `RIT-${Date.now()}`,
      user_id: req.user.id,
      temple_id: templeDoc._id,
      ritual_id: ritualDoc._id,
      ritual_package_id: packageDoc._id,
      date: new Date(date),
      whatsapp_number: String(whatsAppNumber),
      devotees_name: String(devoteeName),
      wish: String(wish),
      booking_status: 1,
      payment_type: paymentType,
      payment_status: 1,
      razorpay_order_id: order.id,
      offer_id: offerId ? Number(offerId) : null,
      offer_discount_amount: 0,
      original_amount: amount,
      paid_amount: amount,
    });

    return res.status(200).json({
      status: "true", success: true, message: FLUTTER_MESSAGES.ritualBookingSuccess,
      data: {
        id: Number(booking.sql_id || 0),
        user_id: 0,
        temple_id: Number(templeDoc.sql_id || 0),
        ritual_id: Number(ritualDoc.sql_id || 0),
        ritual_package_id: Number(packageDoc.sql_id || 0),
        date: booking.date ? booking.date.toISOString() : new Date().toISOString(),
        whatsapp_number: String(booking.whatsapp_number || ""),
        devotees_name: String(booking.devotees_name || ""),
        wish: String(booking.wish || ""),
        booking_status: Number(booking.booking_status || 1),
        offer_discount_amount: String(booking.offer_discount_amount || 0),
        original_amount: String(booking.original_amount || 0),
        paid_amount: String(booking.paid_amount || 0),
        payment: {
          razorpay_order_id: String(order.id || ""),
          razorpay_public_key: String(process.env.RAZORPAY_KEY_ID || ""),
          payment_status: Number(booking.payment_status || 1),
          payment_type: Number(booking.payment_type || 2),
        },
      },
    });
  } catch (error) { return sendError(res, 500, error.message); }
};

exports.verifyRitualBooking = async (req, res) => {
  try {
    const source = { ...req.query, ...req.body };
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = source;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return sendError(res, 400, "Missing payment verification fields");
    }

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    if (hmac.digest("hex") !== razorpay_signature) {
      return sendError(res, 400, "Invalid Signature");
    }

    const booking = await RitualBooking.findOne({ razorpay_order_id });
    if (!booking) return sendError(res, 404, "Booking not found");

    booking.razorpay_payment_id = razorpay_payment_id;
    booking.payment_status = 2;
    booking.booking_status = 2;
    booking.payment_date = new Date();
    await booking.save();

    return res.status(200).json({ status: "true", success: true, message: FLUTTER_MESSAGES.ritualVerifySuccess });
  } catch (error) { return sendError(res, 500, error.message); }
};

exports.getMyRitualBookings = async (req, res) => {
  try {
    const bookings = await RitualBooking.find({ user_id: req.user.id })
      .populate("temple_id", "name image sql_id")
      .populate("ritual_id", "name description image sql_id")
      .populate("ritual_package_id", "name price sql_id")
      .sort({ created_at: -1 })
      .lean();

    const formatted = bookings.map((booking) => ({
      id: Number(booking.sql_id || 0),
      temple_id: Number(booking.temple_id?.sql_id || 0),
      ritual_id: Number(booking.ritual_id?.sql_id || 0),
      booking_status: Number(booking.booking_status || 1),
      payment_status: Number(booking.payment_status || 1),
      ritual: booking.ritual_id ? {
        id: Number(booking.ritual_id.sql_id || 0),
        name: String(booking.ritual_id.name || ""),
        description: String(booking.ritual_id.description || ""),
        image: formatImageUrl(booking.ritual_id.image || ""),
      } : null,
    }));

    return res.status(200).json({ status: "true", success: true, message: FLUTTER_MESSAGES.ritualBookingDetailsSuccess, data: { data: formatted } });
  } catch (error) { return sendError(res, 500, error.message); }
};

// 🎯 FIX: Supports [0, 1] universally & Sanitize Corrupt Migration Data
exports.getAllRituals = async (req, res) => {
  try {
    const rituals = await Ritual.find({ status: { $in: [0, 1] } })
      .populate('ritual_type_id', 'name')
      .sort({ sequence: 1, created_at: -1 })
      .lean();

    const templeIds = [...new Set(rituals.map(r => r.temple_id).filter(Boolean))];
    const temples = await Temple.find({ _id: { $in: templeIds } }).select('name city_name sql_id').lean();
    
    const templeMap = temples.reduce((acc, t) => {
        acc[t._id.toString()] = t;
        return acc;
    }, {});

    const formatted = rituals.map(ritual => {
      const temple = ritual.temple_id ? templeMap[ritual.temple_id.toString()] : null;
      
      let finalName = ritual.name || "";
      if (/^\d+$/.test(finalName.trim()) && ritual.description) finalName = ritual.description;

      return {
        _id: ritual._id,
        id: Number(ritual.sql_id) || 0,
        name: String(finalName),
        description: String(ritual.description || ""),
        type: ritual.ritual_type_id ? ritual.ritual_type_id.name : null,
        temple_id: temple ? Number(temple.sql_id) : 0,
        temple_name: temple ? String(temple.name) : "",
        image: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image),
        image_thumb: formatImageUrl(/^\d+$/.test(ritual.image || "") ? "" : ritual.image)
      };
    });buildTempleAddress

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};