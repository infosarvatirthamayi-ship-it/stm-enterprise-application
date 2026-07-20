/**
 * =========================================================================
 * 🚀 STM MERN Backend - Unified Production Server (BFF Architecture)
 * =========================================================================
 */

const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

// Load Environment Variables
dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// =========================================================================
// 📂 1. DIRECTORY SETUP (Self-Healing)
// =========================================================================
const directories = [
    path.join(__dirname, 'uploads'), 
    path.join(__dirname, 'public/tickets')
];

directories.forEach(dir => { 
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Directory Created: ${dir}`);
    }
});

// =========================================================================
// 🛡️ 2. SECURITY & MIDDLEWARE
// =========================================================================
app.set('trust proxy', 1);
app.use(helmet({ 
    crossOriginResourcePolicy: false, 
    contentSecurityPolicy: isProduction ? undefined : false 
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS Configuration (Unified for Local Dev & Production Deployment)
const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "http://192.168.1.15:5000", // <-- Add your local Flutter testing URL here
    "https://api.sarvatirthamayi.com",
    "https://sarvatirthamayi.com",
    "https://admin.sarvatirthamayi.com"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Origin not allowed'));
        }
        
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true // 👈 CRITICAL: Allows HTTP-Only secure cookies to pass
}));

// =========================================================================
// 📁 3. STATIC FILE SERVING
// =========================================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/tickets', express.static(path.join(__dirname, 'public/tickets')));

// =========================================================================
// 🔗 4. ROUTE IMPORTS
// =========================================================================
// BFF Modern Gateways
const webRoutes = require("./routes/webRoutes");
const mobileRoutes = require("./routes/mobileRoutes");
const adminRoutes = require("./routes/adminRoutes");
const templeAdminRoutes = require("./routes/templeAdminRoutes");

// Legacy/General Gateways
const authRoutes = require('./routes/auth.routes');
const userRoutes = require("./routes/userRoutes");
const homeRoutes = require("./routes/homeRoutes");

// =========================================================================
// 🛣️ 5. ROUTE MOUNTING (BFF ARCHITECTURE)
// =========================================================================

// 🌐 TIER 1: WEB FRONTEND GATEWAY (React Client)
app.use('/api/v1/web', webRoutes); 

// 📱 TIER 2: MOBILE FRONTEND GATEWAY (Flutter Client)
app.use('/api/v1/mobile', mobileRoutes);

// 👤 TIER 2.5: GENERAL USER ENDPOINTS
app.use('/api/v1/user', userRoutes);

// 🛠️ TIER 3: ADMIN & COMMAND GATEWAYS (Back-Office)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/temple-admin', templeAdminRoutes); // 🎯 Neatly grouped with Admin

// ⏳ TIER 4: LEGACY FALLBACK LAYER (To be deprecated phase-by-phase)
app.use('/api/v1', authRoutes);
app.use('/api/v1/home', homeRoutes);
app.use('/api/admin', adminRoutes); 

// 🩺 HEALTH CHECK
app.get("/", (req, res) => res.status(200).send("STM BFF Production Backend Running 🚀"));

// =========================================================================
// 🚨 6. GLOBAL ERROR HANDLER
// =========================================================================
app.use((err, req, res, next) => {
    if (!isProduction) console.error(`[${new Date().toISOString()}] Error:`, err);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(isProduction ? {} : { stack: err.stack })
    });
});

// =========================================================================
// 💾 7. DATABASE CONNECTION & SERVER IGNITION
// =========================================================================
mongoose.connect(process.env.MONGO_URI, { autoIndex: true })
    .then(() => console.log(`✅ MongoDB Connected in [${process.env.NODE_ENV || 'production'}] mode`))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err.message);
        if (isProduction) process.exit(1);
    });

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
    //console.log(`🚀 Server Live: http://0.0.0.0:${PORT} | BFF Mode Active`);
    console.log("🚀 CI/CD Automated Deployment is LIVE!");
});

// =========================================================================
// 🛑 8. GRACEFUL SHUTDOWN (Enterprise Best Practice)
// =========================================================================
const gracefulShutdown = () => {
    console.log("\n⚠️ Shutting down gracefully...");
    server.close(async () => {
        console.log("🔌 HTTP Server closed.");
        try {
            // THE FIX: Modern Promise-based Mongoose connection close
            await mongoose.connection.close(false);
            console.log("💾 MongoDB connection closed.");
            process.exit(0);
        } catch (err) {
            console.error("❌ Database shutdown error:", err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);