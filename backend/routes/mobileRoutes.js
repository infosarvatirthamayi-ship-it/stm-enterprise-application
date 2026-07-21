const express = require('express');
const router = express.Router();


// --- Controllers ---
const authMobileController = require('../controllers/mobile/authMobileController'); 
// 🎯 FIX: Updated to usersController
const usersController = require('../controllers/user/usersController');
const mobileTempleController = require('../controllers/mobile/templeController'); 
const membershipMobileController = require('../controllers/mobile/membershipMobileController'); 
const mobileBookingController = require('../controllers/mobile/templeBookingMobileController');
const mobileTempleBookingController = require('../controllers/mobile/templeBookingMobileController');
const homeController = require('../controllers/user/homeController');

// At the top of the file, ensure the ritual controller is imported
const ritualController = require('../controllers/user/ritualController');

// --- Middleware ---
const { protectMobile } = require('../middleware/authMiddleware');

// =========================================================================
// 📱 MOBILE AUTHENTICATION LAYER
// =========================================================================
router.post('/login', authMobileController.login);
router.post('/signup', authMobileController.signUp);
router.post('/verify-otp', authMobileController.verifyOtp); 
router.post('/resend-otp', authMobileController.resendOtp); 
router.post('/logout', protectMobile, authMobileController.logout);

// =========================================================================
// 🏪 MOBILE CORE FEATURES LAYER (Public)
// =========================================================================
router.get('/home', protectMobile, homeController.getHomeData);
router.get('/states', mobileTempleController.getPublicStates);
router.get('/temples', mobileTempleController.getMobileTemples);
router.get('/temple/index', mobileTempleController.getMobileTemples);
router.post('/temples/details', mobileTempleController.getMobileTempleById); 
// Add this line where your other temple routes are:
router.post('/temple/show', mobileTempleController.getMobileTempleById);
// 🎯 Mobile Temple Booking Routes
router.post('/temple/booking', protectMobile, mobileTempleBookingController.initiateTempleBooking);
router.post('/temple/booking/verify', protectMobile, mobileTempleBookingController.verifyTempleBooking);


// Discovery (Public)
router.get('/membership-plans/active', membershipMobileController.getActiveMembershipPlans);

// =========================================================================
// 👤 PROTECTED MOBILE ROUTES (Profile & Vault)
// =========================================================================

// Profile Management
router.get('/profile', protectMobile, usersController.getProfile);
router.post('/profile/update', protectMobile, usersController.updateProfile);

// Favorites Engine
router.get('/profile/favorite-temples', protectMobile, usersController.getMyFavoriteTemples);
router.post('/profile/favorite-temple', protectMobile, usersController.toggleFavoriteTemple);

// 💳 Checkout Engine (Mobile BFF - Razorpay Handshake)
router.post('/club/subscribe', protectMobile, membershipMobileController.createOrder);
router.post('/club/verify', protectMobile, membershipMobileController.verifyPayment);

router.post('/bookings/create', protectMobile, mobileBookingController.initiateTempleBooking);
router.post('/bookings/verify', protectMobile, mobileBookingController.verifyTempleBooking);

// Add these to your route definitions
router.post('/ritual/index', ritualController.getRitualsByTemple);
router.post('/ritual/show', ritualController.getRitualShow);
router.post('/ritual/packages', ritualController.getRitualPackages);
router.post('/ritual/booking', ritualController.createRitualOrder);
router.post('/ritual/verify-booking', ritualController.verifyRitualBooking);

module.exports = router;