// backend/routes/mobileRoutes.js

const express = require('express');
const router = express.Router();

// --- Controllers ---
const authMobileController = require('../controllers/mobile/authMobileController'); 
const usersController = require('../controllers/user/usersController');
const mobileTempleController = require('../controllers/mobile/templeController'); 
const membershipMobileController = require('../controllers/mobile/membershipMobileController'); 
const mobileTempleBookingController = require('../controllers/mobile/templeBookingMobileController');
const homeController = require('../controllers/user/homeController');
const ritualController = require('../controllers/user/ritualController');

// 🎯 NEW: Import the Mobile Ritual Booking Controller we just created!
const mobileRitualBookingController = require('../controllers/mobile/ritualBookingMobileController');

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

// NOTE: These are duplicates of /temple/booking but kept for backwards compatibility if your app uses them
router.post('/bookings/create', protectMobile, mobileTempleBookingController.initiateTempleBooking);
router.post('/bookings/verify', protectMobile, mobileTempleBookingController.verifyTempleBooking);

// =========================================================================
// 🕉️ RITUAL ROUTES
// =========================================================================

// 1. Read-Only Routes (Safe to use the shared web controller)
router.post('/ritual/index', ritualController.getRitualsByTemple);
router.post('/ritual/show', ritualController.getRitualShow);
router.post('/ritual/packages', ritualController.getRitualPackages);

// 2. 🎯 THE FIX: Booking Routes (Pointed to the new Mobile BFF Controller and protected)
router.post('/ritual/booking', protectMobile, mobileRitualBookingController.initiateRitualBooking);

// (I added both verify path variations just in case your Flutter app uses one or the other)
router.post('/ritual/verify-payment', protectMobile, mobileRitualBookingController.verifyRitualBooking);
router.post('/ritual/verify-booking', protectMobile, mobileRitualBookingController.verifyRitualBooking);

module.exports = router;