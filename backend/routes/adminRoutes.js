const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");


// ============================================================================
// 🛡️ MIDDLEWARES
// ============================================================================
const { protect, authorize } = require("../middleware/authMiddleware");

// ============================================================================
// 🎮 CONTROLLERS
// ============================================================================
// Auth & Admin Users
const { adminLogin,
     adminLogout,
     adminSignup
     } = require("../controllers/admin/authadminController");

const locationController = require('../controllers/admin/locationController');

const { protectSuperAdmin } = require("../middleware/authMiddleware");
const adminController = require("../controllers/admin/adminController");
const forgotPasswordController = require("../controllers/forgotPassword.controller");
const userController = require("../controllers/userController");

// Core Entities
const dashboardController = require("../controllers/dashboardController");
const templeController = require('../controllers/templeController');
const membershipController = require("../controllers/membershipController"); // Your newly refactored controller!
const purchasedCardAdminController = require("../controllers/purchasedCardController");

// Rituals & Events
const ritualController = require("../controllers/ritualController");
const ritualTypeController = require("../controllers/ritualTypeController");
const ritualPackageController = require("../controllers/ritualPackageController");
const eventController = require("../controllers/eventController");

// Bookings
const templeBookingController = require("../controllers/templeBookingController");
const ritualBookingController = require("../controllers/ritualBookingController");
const eventBookingController = require("../controllers/eventBookingController");

// Marketing & Metadata
const offerController = require("../controllers/offerController");
const voucherController = require("../controllers/voucherController");
const cityController = require('../controllers/cityController');
const countryController = require('../controllers/countryController');
const donationController = require("../controllers/donationController");

// ============================================================================
// 📁 UPLOAD CONFIGURATION (MULTER)
// ============================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ============================================================================
// 🔓 PUBLIC ADMIN ROUTES (No Token Required)
// ============================================================================
router.post("/login", adminLogin); 
router.post("/logout", adminLogout);
router.post("/create", adminController.createAdmin);

router.post("/create-admin", protectSuperAdmin, adminSignup);

router.post("/forgot-password", forgotPasswordController.sendOtp);
router.post("/reset-password", forgotPasswordController.resetPassword);

// Country Pipelines
router.get('/locations/countries', protectSuperAdmin, locationController.getCountries);
router.post('/locations/countries', protectSuperAdmin, locationController.addCountry);

// City Pipelines
router.get('/locations/cities', protectSuperAdmin, locationController.getCities);
router.post('/locations/cities', protectSuperAdmin, locationController.addCity);

// Shared Metadata (Often needed before login for dropdowns)
router.get("/states", templeController.getStates);
router.get("/states/:stateSqlId/cities", templeController.getCitiesByState);
router.get('/cities', cityController.getCities);
router.get('/countries', countryController.getCountries);

// ============================================================================
// 🔒 PROTECTED ADMIN ROUTES (Require Valid Admin Token)
// ============================================================================
router.use(protect); // Applies to ALL routes below this line

// --- ⚙️ Session & Dashboard ---
router.get("/check-auth", (req, res) => res.status(200).json({ success: true, user: req.user }));
router.get("/dashboard-stats", dashboardController.getDashboardStats);
router.put("/settings/global-discount", dashboardController.updateGlobalSettings);

// --- 👥 User Management ---
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/update/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// --- 🏛️ Temple Management ---
router.post("/temples/create", upload.single('image'), templeController.createTemple);
router.get("/temples", templeController.getAdminTempleList);
router.get("/temples/:id", templeController.getTempleById);
router.put("/temples/update/:id", upload.single('image'), templeController.updateTemple);
router.delete("/temples/:id", templeController.deleteTemple);

// --- 🙏 Temple Bookings ---
router.get("/temple-bookings", templeBookingController.getAllTempleBookings);
router.get("/temple-bookings/:id", templeBookingController.getTempleBookingById);
router.put("/temple-bookings/status/:id", templeBookingController.updateTempleBookingStatus);

// --- 💳 STM Club Memberships (Refactored for ₹1 Test Plan) ---
router.post("/memberships/create", membershipController.createMembership);
router.get("/memberships/temples-list", membershipController.getTemplesList); // Must be above /:id
router.get("/memberships", membershipController.getAllMemberships);
router.get("/memberships/:id", membershipController.getMembershipById);
router.put("/memberships/update/:id", membershipController.updateMembership);
router.delete("/memberships/:id", membershipController.deleteMembership);

router.get("/purchased-memberships", purchasedCardAdminController.getAllPurchasedCardsAdmin);
router.delete('/purchased-memberships/:id', authorize(1), purchasedCardAdminController.deletePurchasedCard);

// --- 🕉️ Ritual Management ---
router.post("/rituals", upload.single('image'), ritualController.createRitual);
router.get("/rituals", ritualController.getRituals);
router.get("/rituals/:id", ritualController.getRitualById);
router.put("/rituals/update/:id", upload.single('image'), ritualController.updateRitual);
router.delete("/rituals/:id", ritualController.deleteRitual);

// --- 📦 Ritual Types & Packages ---
router.post("/ritual-types", ritualTypeController.createRitualType);
router.get("/ritual-types", ritualTypeController.getRitualTypes);
router.post("/ritual-packages", ritualPackageController.createRitualPackage);
router.get("/ritual-packages", ritualPackageController.getRitualPackages);

// --- 📿 Ritual Bookings ---
router.get("/ritual-bookings", ritualBookingController.getAllRitualBookings);
router.get("/ritual-bookings/:id", ritualBookingController.getRitualBookingById);

// --- 🎟️ Event Management ---
router.post("/events", upload.single('image'), eventController.createEvent);
router.get("/events", eventController.getAllEvents);
router.get("/events/:id", eventController.getEventById);
router.put("/events/update/:id", upload.single('image'), eventController.updateEvent);
router.delete("/events/:id", eventController.deleteEvent);

// --- 🎫 Event Bookings ---
router.get("/event-bookings/count", eventBookingController.getTotalBookingsCount);
router.get("/event-bookings", eventBookingController.getAllBookings);
router.get("/event-bookings/:id", eventBookingController.getBookingById);
router.delete("/event-bookings/:id", eventBookingController.deleteBooking);

// --- 🎁 Vouchers & Coupons ---
router.post("/vouchers/create", voucherController.createVoucher);
router.get("/vouchers", voucherController.getVouchers);
router.get("/vouchers/download/:id", voucherController.downloadVoucherLeaflet);
router.get("/vouchers/:id", voucherController.getVoucherById);
router.put("/vouchers/update/:id", voucherController.updateVoucher);
router.delete("/vouchers/:id", voucherController.deleteVoucher);

// --- 🏷️ Offer Management ---
router.post("/offers/create", upload.single("image"), offerController.createOffer);
router.get("/offers", offerController.getOffers);
router.get("/offers/:id", offerController.getOfferById);
router.put("/offers/update/:id", upload.single("image"), offerController.updateOffer);
router.delete("/offers/:id", offerController.deleteOffer);

module.exports = router;