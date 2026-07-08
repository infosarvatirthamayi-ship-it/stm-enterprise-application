import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { UserAuthProvider } from "./context/UserAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { TempleAdminAuthProvider } from "./context/TempleAdminAuthContext"; 

// Global Components
import Navbar from "./components/Navbar";

// Layered System Routes
import { UserRoutes } from "./routes/UserRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { TempleAdminRoutes } from "./routes/TempleAdminRoutes"; // 🎯 Imported the modular temple route tree!

// Authentication Panel Points
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import TempleAdminLogin from "./pages/temple-admin/TempleAdminLogin"; 

export default function App() {
  const location = useLocation();

  const authPaths = [
    "/user/login",
    "/signup",
    "/verify-otp",
    "/user/forgot-password",
    "/admin/login",
    "/temple-admin/login",
  ];

  const isAdminArea = location.pathname.startsWith("/admin") || location.pathname.startsWith("/temple-admin");
  const showNavbar = !authPaths.includes(location.pathname) && !isAdminArea;

  return (
    <UserAuthProvider>
      <AdminAuthProvider>
        <TempleAdminAuthProvider>
          
          <Toaster position="top-right" reverseOrder={false} />
          {showNavbar && <Navbar />}

          <Routes>
            {/* ==========================================
                🙏 USER ZONE
                ========================================== */}
            <Route path="/*" element={<UserRoutes />} />

            {/* ==========================================
                🛡️ CORE SYSTEM ADMIN ZONE
                ========================================== */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin/reset-password/:token" element={<ResetPassword />} />
            
            {/* Mount core dashboard and office systems */}
            {AdminRoutes}

            {/* ==========================================
                🛕 TEMPLE AUTHORITY OPERATIONAL ZONE
                ========================================== */}
            <Route path="/temple-admin/login" element={<TempleAdminLogin />} />
            
            {/* 🎯 Un-noted & mounted cleanly: Diverting all operations to the new route tree */}
            {TempleAdminRoutes}

            {/* Global Unknown Fallback Security Catch */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
        </TempleAdminAuthProvider>
      </AdminAuthProvider>
    </UserAuthProvider>
  );
}