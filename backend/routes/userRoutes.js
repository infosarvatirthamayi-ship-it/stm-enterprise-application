const express = require("express");
const router = express.Router();
// --- Controllers ---
const aboutController = require("../controllers/user/aboutController");
const joinNowController = require("../controllers/user/joinNowController");
// 🎯 CORRECT: Imported as usersController
const usersController = require("../controllers/user/usersController");
const templeBookingController = require("../controllers/user/templeBookingController");
const ritualController = require("../controllers/user/ritualController");

const homeController = require("../controllers/user/homeController");
const donationController = require("../controllers/user/donationController");
const contactController = require("../controllers/user/contactController");
const termsController = require("../controllers/user/termsController");
const privacyController = require("../controllers/user/privacyController");
const favouriteController = require("../controllers/user/favouriteController");
const offerController = require("../controllers/user/offerController");

// Membership & Card Controllers
const userCardController = require('../controllers/user/userCardController');
const userVoucherController = require('../controllers/user/userVoucherController');
const { 
  getActiveMemberships, 
  purchaseMembershipCard, 
  verifyMembershipPayment, 
  getMyMembershipCard 
} = require("../controllers/user/membershipcardController");

// --- Middleware ---
// backend/routes/userRoutes.js
const { protectWeb, softProtectWeb } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const handleProfileUploads = (req, res, next) => {
  const uploadFields = upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "banner_image", maxCount: 1 },
  ]);
  uploadFields(req, res, (err) => {
    if (err) return res.status(400).json({ status: "false", success: false, message: err.message });
    next();
  });
};

// ==============================================================================
// 🛡️ THE FAILSAFE WRAPPER 
// This prevents the server from crashing if a controller function is missing.
// ==============================================================================
const safeRoute = (controllerFunction) => {
    if (typeof controllerFunction === 'function') {
        return controllerFunction;
    } else {
        return (req, res) => res.status(501).json({ 
            success: false, 
            message: "Endpoint under construction. Controller function is missing or not exported." 
        });
    }
};

// --- Routes ---

// Health Check
router.get("/test-route", (req, res) => res.json({ message: "User router is working!" }));

// Authentication
// 🎯 FIX: Changed userController to usersController
router.post("/signup", safeRoute(usersController.signupUser));
router.post("/verify-otp", safeRoute(usersController.verifyOtp));
router.post("/resend-otp", safeRoute(usersController.resendOtp));
router.post("/login", safeRoute(usersController.loginUser));
router.post("/logout", protectWeb, safeRoute(usersController.logoutUser));
router.post("/forgot-password", safeRoute(usersController.forgotPassword));
router.post("/forgot-verify-otp", safeRoute(usersController.forgotVerifyOtp));
router.post("/reset-password", safeRoute(usersController.resetPassword));

// Public / Basic Data
router.post("/contact-us", safeRoute(contactController.contactUs));
router.get("/about-data", safeRoute(aboutController.getAboutPageData));
router.get("/about-us", safeRoute(aboutController.getAboutUs));
router.get("/privacy-policy", safeRoute(privacyController.getPrivacyPolicy));
router.get("/term-condition", safeRoute(termsController.getTermsAndConditions));
router.get("/states", safeRoute(joinNowController.getPublicStates));


// Home & Profile
router.get("/home", protectWeb, safeRoute(homeController.getHomeData));

// 🎯 The flawless check-auth route
router.get("/check-auth", softProtectWeb, (req, res) => {
  if (req.user) {
    return res.status(200).json({ success: true, user: req.user });
  } else {
    // 🎯 Return 200 OK, but clearly state it's a guest
    return res.status(200).json({ success: true, user: null, isGuest: true });
  }
});

// 🎯 FIX: Changed userController to usersController
router.get("/profile", protectWeb, safeRoute(usersController.getProfile));
router.post("/profile", protectWeb, handleProfileUploads, safeRoute(usersController.updateProfile));
router.put("/profile", protectWeb, handleProfileUploads, safeRoute(usersController.updateProfile));
router.put("/update-profile", protectWeb, handleProfileUploads, safeRoute(usersController.updateProfile));
router.get("/temple-assistants/:templeId", safeRoute(usersController.getAssistantsByTemple));


// Membership, Cards & Vouchers
router.get("/membership-card/index", protectWeb, safeRoute(getActiveMemberships));
router.post("/membership-card/purchase", protectWeb, safeRoute(purchaseMembershipCard));
router.post("/membership-card/verify-payment", protectWeb, safeRoute(verifyMembershipPayment));
router.get("/membership-card/my-card", protectWeb, safeRoute(getMyMembershipCard));
router.get("/membership-plans/active", safeRoute(getActiveMemberships));
router.get("/card/my-card", protectWeb, safeRoute(userCardController.getMyCard)); 
router.post("/vouchers/verify", protectWeb, safeRoute(userVoucherController.verifyVoucherForUser));
router.get("/vouchers/available", protectWeb, safeRoute(userVoucherController.getAvailableVouchers));

// Temples, Rituals, Donations (ALL WRAPPED SAFELY)
router.get("/temple/index", safeRoute(joinNowController.getPublicTemples));
router.post("/temple/show", safeRoute(joinNowController.getPublicTempleById));
router.get("/temples", safeRoute(joinNowController.getPublicTemples));
router.get("/temples/:id", safeRoute(joinNowController.getPublicTempleById));

router.post("/temple/booking", protectWeb, safeRoute(templeBookingController.createTempleBookingOrder));
router.post("/temple/verify-payment", protectWeb, safeRoute(templeBookingController.verifyAndConfirmBooking));
router.get("/temple/booking-details", protectWeb, safeRoute(templeBookingController.getMyBookings));

router.get("/rituals", safeRoute(ritualController.getAllRituals));
router.post("/ritual/index", protectWeb, safeRoute(ritualController.getRitualsByTemple));
router.post("/ritual/show", protectWeb, safeRoute(ritualController.getRitualShow));
router.post("/ritual/packages", protectWeb, safeRoute(ritualController.getRitualPackages));
router.post("/ritual/booking", protectWeb, safeRoute(ritualController.createRitualOrder));
router.post("/ritual/verify-payment", protectWeb, safeRoute(ritualController.verifyRitualBooking));
router.get("/ritual/booking-details", protectWeb, safeRoute(ritualController.getMyRitualBookings));

router.post("/donation/index", protectWeb, safeRoute(donationController.getDonations));
router.post("/donation/show", protectWeb, safeRoute(donationController.getDonationById));
router.post("/donation/update", protectWeb, upload.single("image"), safeRoute(donationController.updateDonation));
router.get("/donation/booking-details", protectWeb, safeRoute(donationController.getMyDonationBookings));

// Offers & Favourites
router.get("/offers", protectWeb, safeRoute(offerController.getOffers));
router.get("/offer/index", protectWeb, safeRoute(offerController.getOffers));
router.post("/offer/show", protectWeb, safeRoute(offerController.getOfferById));
router.get("/offers/:id", protectWeb, safeRoute(offerController.getOfferById));
router.post("/favourite", protectWeb, safeRoute(favouriteController.favourite));
router.post("/favorite", protectWeb, safeRoute(favouriteController.favourite));
router.get("/favourite/index", protectWeb, safeRoute(favouriteController.favouriteGet));
router.get("/favorite/index", protectWeb, safeRoute(favouriteController.favouriteGet));
router.get("/favorite/list", protectWeb, safeRoute(favouriteController.favouriteGet));

// Legacy Compatibility
router.post("/book-temple/create-order", protectWeb, safeRoute(templeBookingController.createTempleBookingOrder));
router.post("/book-temple/verify", protectWeb, safeRoute(templeBookingController.verifyAndConfirmBooking));
router.get("/book-temple/ticket/:id", protectWeb, safeRoute(templeBookingController.downloadTicket));
router.get("/my-temple-bookings", protectWeb, safeRoute(templeBookingController.getMyBookings));
router.post("/rituals/create-order", protectWeb, safeRoute(ritualController.createRitualOrder));
router.post("/rituals/verify-booking", protectWeb, safeRoute(ritualController.verifyRitualBooking));

module.exports = router;