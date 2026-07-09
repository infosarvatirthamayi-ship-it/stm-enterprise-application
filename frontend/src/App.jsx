import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { UserAuthProvider } from "./context/UserAuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { TempleAdminAuthProvider } from "./context/TempleAdminAuthContext"; 

// Global Components
import Navbar from "./components/Navbar";

// Layered System Routes (Ensure these are exported as components, e.g., export const UserRoutes = () => { ... })
import { UserRoutes } from "./routes/UserRoutes";
import { AdminRoutes } from "./routes/AdminRoutes";
import { TempleAdminRoutes } from "./routes/TempleAdminRoutes"; 

// Authentication Panel Points
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import TempleAdminLogin from "./pages/temple-admin/TempleAdminLogin"; 

export default function App() {
  const location = useLocation();

  // Route checking for Navbar visibility
  const authPaths = [
    "/user/login",
    "/signup",
    "/verify-otp",
    "/user/forgot-password",
  ];
  
  const isAdminArea = location.pathname.startsWith("/admin") || location.pathname.startsWith("/temple-admin");
  const showNavbar = !authPaths.includes(location.pathname) && !isAdminArea;

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <Routes>
        {/* ==========================================
            🙏 USER ZONE (Isolated Auth)
            Only checks User Auth. Navbar is inside so it can access useUserAuth!
            ========================================== */}
        <Route path="/*" element={
          <UserAuthProvider>
            {showNavbar && <Navbar />}
            <UserRoutes />
          </UserAuthProvider>
        } />

        {/* ==========================================
            🛡️ CORE SYSTEM ADMIN ZONE (Isolated Auth)
            Only checks Admin Auth if the URL starts with /admin
            ========================================== */}
        <Route path="/admin/*" element={
          <AdminAuthProvider>
            <Routes>
              <Route path="login" element={<AdminLogin />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password/:token" element={<ResetPassword />} />
              
              {/* Catch all other /admin/... paths and send to AdminRoutes component */}
              <Route path="*" element={<AdminRoutes />} />
            </Routes>
          </AdminAuthProvider>
        } />

        {/* ==========================================
            🛕 TEMPLE AUTHORITY OPERATIONAL ZONE (Isolated Auth)
            Only checks Temple Admin Auth if URL starts with /temple-admin
            ========================================== */}
        <Route path="/temple-admin/*" element={
          <TempleAdminAuthProvider>
            <Routes>
              <Route path="login" element={<TempleAdminLogin />} />
              
              {/* Catch all other /temple-admin/... paths and send to TempleAdminRoutes */}
              <Route path="*" element={<TempleAdminRoutes />} />
            </Routes>
          </TempleAdminAuthProvider>
        } />

      </Routes>
    </>
  );
}