// backend/routes/templeAdminRoutes.js
const express = require("express");
const router = express.Router();

// 1. Import the controllers
const { 
    templeAdminLogin, 
    templeAdminLogout 
} = require("../controllers/temple-admin/templeadminauthController");
const { validateQRPass } = require('../controllers/temple-admin/verificationController');

// 2. Import your EXISTING Temple Admin middleware
const { protectTempleAdmin } = require("../middleware/authMiddleware");

// 3. Define the authentication endpoints
router.post("/login", templeAdminLogin);
router.post("/logout", templeAdminLogout);

router.get("/check-auth", protectTempleAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Temple Admin is authenticated",
        user: req.templeAdmin
    });
});

// 🎯 THE FIX: Applied your `protectTempleAdmin` middleware to secure the scanner route
router.get('/membership/validate/:cardId', protectTempleAdmin, validateQRPass);

// 4. Export the router so the main server can use it
module.exports = router;