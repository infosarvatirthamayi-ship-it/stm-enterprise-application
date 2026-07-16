import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ==========================================
// IMPORTS
// ==========================================
import About from "../pages/About";
import ExploreTemples from "../pages/ExploreTemples";
import LandingPage from "../pages/LandingPage";

import UserLogin from "../pages/user/UserLogin";
import UserSignup from "../pages/user/UserSignup";
import VerifyOtpPage from "../pages/user/VerifyOtpPage";
import UserForgotPassword from "../pages/user/ForgotPassword";
import UserProfile from "../pages/user/Profile";

import JoinNow from '../pages/user/STMClub/JoinNow';
import JoinClub from '../pages/user/STMClub/JoinClub';
import MembershipSuccess from "../pages/user/STMClub/MembershipSuccess"; 

import TempleList from '../pages/user/Temples/TempleList';
import TempleView from '../pages/user/Temples/TempleView';
import TempleBooking from '../pages/user/Temples/TempleBooking';
import AssistanceIndex from '../pages/user/TempleAssistance/index';

import RitualPage from '../pages/user/Rituals/ritualpage';
import RitualView from '../pages/user/Rituals/ritualview';
import RitualBookingForm from '../pages/user/Rituals/RitualBookingForm';
import BookingSuccessPage from "../pages/user/Rituals/BookingSuccessPage";

// The Booking component mapping to TempleBooking
//import BookingForm from "../pages/user/TempleAssistance/BookingForm"; 

// Protected Route Wrapper
import { UserProtectedRoute } from "../components/protected/UserProtectedRoute";

export const UserRoutes = () => {
  return (
    <Routes>
      {/* ==========================================
          🌍 PUBLIC ROUTES (No Login Required)
          ========================================== */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/temples" element={<ExploreTemples />} />
      
      {/* ==========================================
          🔐 AUTH ROUTES
          ========================================== */}
      <Route path="/user/login" element={<UserLogin />} />
      <Route path="/signup" element={<UserSignup />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/user/forgot-password" element={<UserForgotPassword />} />
      
      {/* ==========================================
          📖 UNPROTECTED USER FEATURES
          ========================================== */}
      <Route path="/user/stm-club" element={<JoinNow />} />
      <Route path="/join-now" element={<JoinNow />} />
      <Route path="/user/temples" element={<TempleList />} />
      <Route path="/user/temples/:id" element={<TempleView />} />
      <Route path="/user/temple-assistance" element={<AssistanceIndex />} />
      <Route path="/user/rituals" element={<RitualPage />} />
      
      {/* Fixed: Standardized to /user/... prefix */}
      <Route path="/user/ritual-view/:id" element={<RitualView />} />
    
      {/* ==========================================
          🛡️ PROTECTED USER ROUTES (Requires Login - Type 3)
          ========================================== */}
      <Route path="/user/profile" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <UserProfile />
        </UserProtectedRoute>
      } />
      
      {/* 🚀 THE FIX: This now strictly matches your browser URL: /user/book-temple/:id 
      <Route path="/user/book-temple/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <BookingForm />
        </UserProtectedRoute>
      } />*/}
      {/* 🚀 ADD THIS NEW ROUTE HERE */}
      <Route path="/user/book-temple/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <TempleBooking />
        </UserProtectedRoute>
      } />
      <Route path="/user/book-ritual/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <RitualBookingForm />
        </UserProtectedRoute>
      } />
      
      <Route path="/user/booking-success" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <BookingSuccessPage />
        </UserProtectedRoute>
      } />

      <Route path="/user/membership-card" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <MembershipSuccess />
        </UserProtectedRoute>
      } />
      
      <Route path="/user/join-club/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <JoinClub />
        </UserProtectedRoute>
      } />
      
      {/* ==========================================
          🔄 LEGACY REDIRECTS (Prevents broken old links)
          ========================================== */}
      <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
      <Route path="/my-account" element={<Navigate to="/user/profile" replace />} />
      
      {/* If an old link points to /book-temple/26 without 'user', redirect them correctly */}
      <Route path="/book-temple/:id" element={<Navigate to="/user/book-temple/:id" replace />} />
    </Routes>
  );
};