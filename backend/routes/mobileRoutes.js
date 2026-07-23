const express = require('express');
const router = express.Router();

// --- Controllers ---
const authMobileController = require('../controllers/mobile/authMobileController'); 
const usersController = require('../controllers/user/usersController');
const mobileTempleController = require('../controllers/mobile/templeController'); 
const membershipMobileController = require('../controllers/mobile/membershipMobileController'); 
const mobileTempleBookingController = require('../controllers/mobile/templeBookingMobileController');
const homeController = require('../controllers/user/homeController');
const mobileRitualController = require('../controllers/mobile/ritualMobileController');

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
router.post('/temple/show', mobileTempleController.getMobileTempleById);

// Mobile Temple Booking Routes
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

router.post('/bookings/create', protectMobile, mobileTempleBookingController.initiateTempleBooking);
router.post('/bookings/verify', protectMobile, mobileTempleBookingController.verifyTempleBooking);

// =========================================================================
// 🪔 RITUALS ENGINE (Strictly Mobile Controller)
// =========================================================================
// 1. Data Fetching
router.post('/ritual/index', mobileRitualController.getRitualsByTemple);
router.post('/ritual/show', mobileRitualController.getRitualShow);
router.post('/ritual/packages', mobileRitualController.getRitualPackages);

// 2. Booking & Verification Routes
router.post('/ritual/booking', protectMobile, mobileRitualController.initiateRitualBooking);
router.post('/ritual/verify-booking', protectMobile, mobileRitualController.verifyRitualBooking);
router.post('/ritual/verify-payment', protectMobile, mobileRitualController.verifyRitualBooking);

module.exports = router;