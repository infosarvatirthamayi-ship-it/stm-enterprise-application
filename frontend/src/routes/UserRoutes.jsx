import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import About from "../pages/About";
import ExploreTemples from "../pages/ExploreTemples";

// Import User Components
import LandingPage from "../pages/LandingPage";
import UserLogin from "../pages/user/UserLogin";
import UserSignup from "../pages/user/UserSignup";
import VerifyOtpPage from "../pages/user/VerifyOtpPage";
import UserForgotPassword from "../pages/user/ForgotPassword";
import UserProfile from "../pages/user/Profile";
import JoinNow from '../pages/user/STMClub/JoinNow';
import JoinClub from '../pages/user/STMClub/JoinClub';

import TempleList from '../pages/user/Temples/TempleList';
import TempleView from '../pages/user/Temples/TempleView';

import AssistanceIndex from '../pages/user/TempleAssistance/index';

import RitualPage from '../pages/user/Rituals/ritualpage';
import RitualView from '../pages/user/Rituals/ritualview';
import RitualBookingForm from '../pages/user/Rituals/RitualBookingForm';
import BookingSuccessPage from "../pages/user/Rituals/BookingSuccessPage";

// 🎯 THE FIX: Imported isolated UserProtectedRoute
import { UserProtectedRoute } from "../components/protected/UserProtectedRoute";
import BookingForm from "../pages/user/TempleAssistance/BookingForm";
import MembershipSuccess from "../pages/user/STMClub/MembershipSuccess"; 

export function UserRoutes() {
  return (
    <Routes>
      {/* Public User Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/temples" element={<ExploreTemples />} />
      
      <Route path="/user/login" element={<UserLogin />} />
      <Route path="/signup" element={<UserSignup />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/user/forgot-password" element={<UserForgotPassword />} />
      
      {/* User Features */}
      <Route path="/user/stm-club" element={<JoinNow />} />
      <Route path="/user/temples" element={<TempleList />} />
      <Route path="/user/temples/:id" element={<TempleView />} />
      <Route path="/user/temple-assistance" element={<AssistanceIndex />} />
      
      <Route path="/user/rituals" element={<RitualPage />} />
      <Route path="/ritual-view/:id" element={<RitualView />} />
      <Route path="/join-now" element={<JoinNow />} />
    
      {/* Protected User Routes (Type 3) */}
      <Route path="/profile" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <UserProfile />
        </UserProtectedRoute>
      } />
      
      <Route path="/book-temple/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <BookingForm />
        </UserProtectedRoute>
      } />
      
      <Route path="/book-ritual/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <RitualBookingForm />
        </UserProtectedRoute>
      } />
      
      <Route path="/booking-success" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <BookingSuccessPage />
        </UserProtectedRoute>
      } />

      <Route path="/membership-card" element={
  <UserProtectedRoute allowedTypes={[3]}>
    <MembershipSuccess />
  </UserProtectedRoute>
} />
      
      <Route path="/join-club/:id" element={
        <UserProtectedRoute allowedTypes={[3]}>
          <JoinClub />
        </UserProtectedRoute>
      } />
      
      <Route path="/my-account" element={<Navigate to="/profile" replace />} />
    </Routes>
  );
}