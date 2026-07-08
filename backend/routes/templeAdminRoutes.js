// backend/routes/templeAdminRoutes.js
const express = require("express");
const router = express.Router();

// 1. Import the renamed controller functions
const { 
    templeAdminLogin, 
    templeAdminLogout 
} = require("../controllers/temple-admin/templeadminauthController");

const { protectTempleAdmin } = require("../middleware/authMiddleware");

// 2. Define the authentication endpoints
router.post("/login", templeAdminLogin);
router.post("/logout", templeAdminLogout);

router.get("/check-auth", protectTempleAdmin, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Temple Admin is authenticated",
        user: req.templeAdmin
    });
});
// 3. Export the router so the main server can use it
module.exports = router;