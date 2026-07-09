import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminProtectedRoute } from "../components/protected/AdminProtectedRoute";
import TempleAdminDashboard from "../pages/temple-admin/TempleAdminDashboard";

// Placeholder view components (Replace with your actual feature pages as you build them)
const TempleBookings = () => <div className="p-6 text-slate-800 dark:text-white font-bold">🛕 Temple Bookings Ledger Node active.</div>;
const TempleInventory = () => <div className="p-6 text-slate-800 dark:text-white font-bold">📦 Temple Inventory & Logistics Node active.</div>;

export const TempleAdminRoutes = () => {
  return (
    <Routes>
      {/* This Layout Route wraps ALL temple admin pages with the Dashboard UI 
        and protects them so only user_type 2 (Temple Admin) can view them.
      */}
      <Route
        element={
          <AdminProtectedRoute allowedTypes={[2]}>
            <TempleAdminDashboard />
          </AdminProtectedRoute>
        }
      >
        {/* Redirect base root query directly to the operational dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        {/* Local Temple Operations Sub-routes */}
        <Route path="dashboard" element={<div className="p-6 text-slate-800 dark:text-white font-bold">Welcome to Temple Operations Command Dashboard</div>} />
        <Route path="bookings" element={<TempleBookings />} />
        <Route path="inventory" element={<TempleInventory />} />
      </Route>
    </Routes>
  );
};

export default TempleAdminRoutes;