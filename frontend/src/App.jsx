import React from "react";

import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

/*
|--------------------------------------------------------------------------
| Global Components
|--------------------------------------------------------------------------
*/
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
import { UserRoutes } from "./routes/UserRoutes";

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
import { AdminRoutes } from "./routes/AdminRoutes";

/*
|--------------------------------------------------------------------------
| Admin Authentication
|--------------------------------------------------------------------------
*/
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";

/*
|--------------------------------------------------------------------------
| Temple Admin
|--------------------------------------------------------------------------
*/
import TempleAdminDashboard from "./pages/temple-admin/TempleAdminDashboard";

export default function App() {

  const location = useLocation();

  /*
  |--------------------------------------------------------------------------
  | HIDE NAVBAR CONDITIONS
  |--------------------------------------------------------------------------
  */
  const authPaths = [
    "/user/login",
    "/signup",
    "/verify-otp",
    "/forgot-password",
    "/admin/login",
    "/temple-admin/login",
  ];

  const isAdminArea =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/temple-admin");

  const showNavbar =
    !authPaths.includes(location.pathname) &&
    !isAdminArea;

  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      {/* Navbar */}
      {showNavbar && <Navbar />}

      {/* Routes */}
      <Routes>

        {/* User Routes */}
        {UserRoutes}

        {/* Admin Auth */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/temple-admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/admin/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* Admin Routes */}
        {AdminRoutes}

        {/* Temple Admin */}
        <Route
          path="/temple-admin"
          element={
            <ProtectedRoute allowedTypes={[2]}>
              <TempleAdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <div className="p-4">
                Welcome to Temple Dashboard
              </div>
            }
          />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </>
  );
}

