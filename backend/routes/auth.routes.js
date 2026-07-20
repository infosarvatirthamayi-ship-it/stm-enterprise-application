const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMobileController = require('../controllers/mobile/authMobileController');
const { protect } = require('../middleware/authMiddleware');

// =========================================================================
// 🔀 INTELLIGENT TRAFFIC SPLITTER MIDDLEWARE
// =========================================================================
const routeByPlatform = (webControllerFunction, mobileControllerFunction) => {
    return (req, res, next) => {
        // Detect mobile by checking for mobile-specific fields or Authorization headers
        const isMobileRequest = 
            req.body.mobileNo || 
            req.body.mobile_number || 
            (req.headers.authorization && req.headers.authorization.startsWith('Bearer '));

        if (isMobileRequest && typeof mobileControllerFunction === 'function') {
            return mobileControllerFunction(req, res, next);
        }
        return webControllerFunction(req, res, next);
    };
};

// =========================================================================
// 🔐 1. AUTHENTICATION & SESSION (Dual Routing)
// =========================================================================
// Routes dynamically based on payload structure so Web and APK both work!
router.post('/login', routeByPlatform(authController.login, authMobileController.login));
router.post('/logout', routeByPlatform(authController.logout, authMobileController.logout));

router.get('/refresh', authController.refreshAccessToken); // Kept safe for Web Auto-Update

// =========================================================================
// 📝 2. REGISTRATION & OTP (Dual Routing)
// =========================================================================
router.post('/signup', routeByPlatform(authController.signUp, authMobileController.signUp));
router.post('/verify-otp', routeByPlatform(authController.verifyOtp, authMobileController.verifyOtp));
router.post('/resend-otp', routeByPlatform(authController.resendOtp, authMobileController.resendOtp));

// Legacy Fallbacks for Passwords
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/forgot-verify-otp', authController.forgotVerifyOtp);

// =========================================================================
// 🩺 3. STATUS CHECK (React Web Guard)
// =========================================================================
router.get('/check-auth', protect, (req, res) => {
  res.status(200).json({ 
    success: true, 
    user: {
      id: req.user._id,
      first_name: req.user.first_name,
      user_type: req.user.user_type,
      role: req.user.role
    } 
  });
});

module.exports = router;