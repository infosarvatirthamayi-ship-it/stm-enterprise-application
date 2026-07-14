const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// --- Setup Multer Storage for Images ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, 'user-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- 1. Import Web-Specific Controllers ---
const authWebController = require('../controllers/web/authWebController'); 
const webTempleController = require('../controllers/web/templeController');
const membershipWebController = require('../controllers/web/membershipWebController'); 
const webProfileController = require('../controllers/web/webProfileController');
const webBookingController = require('../controllers/web/templeBookingWebController');

const webRitualController = require('../controllers/web/ritualWebController');
const { 
    initiateTempleBooking, 
    verifyTempleBooking 
} = require("../controllers/user/userTempleBookingController");

// --- 2. Keep Shared/Global Controllers ---
// 🎯 FIX: Updated to usersController
const usersController = require('../controllers/user/usersController'); 
const aboutController = require('../controllers/user/aboutController');
const homeController = require('../controllers/user/homeController'); 
const adminUserController = require('../controllers/userController'); 

// --- Middleware ---
const { protectWeb } = require('../middleware/authMiddleware');

// =========================================================================
// 🔐 WEB AUTHENTICATION LAYER (Cookie-Based)
// =========================================================================

// Public Auth
router.post('/user/login', authWebController.login);
router.post('/user/signup', authWebController.signup);
router.post('/user/verify-otp', authWebController.verifyOtp);
router.post('/user/resend-otp', authWebController.resendOtp);

// 🛡️ The Check-Auth Endpoint (Vital for React Context on page refresh)
router.get('/user/check-auth', protectWeb, authWebController.checkAuth);

// Logout (Clears the HttpOnly Cookie)
router.post('/user/logout', authWebController.logout);
router.post('/auth/logout', authWebController.logout);

// Password Recovery
router.post('/user/forgot-password', usersController.forgotPassword);
router.post('/user/forgot-verify-otp', usersController.forgotVerifyOtp);
router.post('/user/reset-password', usersController.resetPassword);

// Admin Passthrough
router.post('/admin/auth/login', adminUserController.loginUser);
router.post('/admin/auth/logout', authWebController.logout);


// =========================================================================
// 🏪 WEB CORE FEATURES LAYER (Public Showroom)
// =========================================================================
router.get('/home', homeController.getHomeData);
router.get('/states', webTempleController.getPublicStates);
router.get('/temples', webTempleController.getWebTemples);
router.get('/temples/:id', webTempleController.getWebTempleById);
router.get('/rituals', webRitualController.getAllWebRituals);
router.get('/rituals/:ritualId/packages', webRitualController.getRitualPackages);

router.get('/about-data', aboutController.getWebAboutData);


// =========================================================================
// 💳 SECURE MEMBERSHIP & CHECKOUT ENGINE (FinTech BFF)
// =========================================================================

// Discovery (Public)
router.get('/membership-plans/active', membershipWebController.getActivePlans);

// Vault & Fulfillment (Protected)
router.post('/membership/create-order', protectWeb, membershipWebController.createOrder);
router.post('/membership/verify-payment', protectWeb, membershipWebController.verifyPayment);

// 🪪 Fetch Active Card for Success Page
router.get('/membership/my-card', protectWeb, membershipWebController.getMyCard); 


// =========================================================================
// 👤 PROTECTED WEB ROUTES (Profile & Features)
// =========================================================================

// User Profile
router.get('/user/profile', protectWeb, usersController.getProfile);

// Profile Update with Media Uploads
router.put(
  '/user/update-profile', 
  protectWeb, 
  upload.fields([
    { name: 'profile_picture', maxCount: 1 }, 
    { name: 'banner_image', maxCount: 1 }
  ]), 
  usersController.updateProfile
);

router.get('/user/my-temple-bookings', protectWeb, webProfileController.getMyWebBookings);

router.post('/user/temple-booking/initiate', protectWeb, initiateTempleBooking);
router.post('/user/temple-booking/verify', protectWeb, verifyTempleBooking);

router.post('/temples/:templeId/book', protectWeb, webBookingController.initiateTempleBooking);
router.post('/temples/verify-booking', protectWeb, webBookingController.verifyTempleBooking);

router.post('/user/ritual-booking/initiate', protectWeb, webRitualController.initiateRitualBooking);
router.post('/user/ritual-booking/verify', protectWeb, webRitualController.verifyRitualPayment);

// Favorites Engine
router.get('/profile/favorite-temples', protectWeb, usersController.getMyFavoriteTemples);
router.post('/profile/favorite-temple', protectWeb, usersController.toggleFavoriteTemple);

module.exports = router;