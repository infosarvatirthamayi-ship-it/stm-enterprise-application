// src/components/protected/AdminProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

export const AdminProtectedRoute = ({ children, allowedTypes }) => {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  const isTemplePath = location.pathname.startsWith("/temple-admin");
  const isLoginPath = location.pathname.includes("/login");

  // 1. Premium Loading State
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-ping" />
          <Loader2 className="animate-spin text-indigo-500 relative z-10" size={40} strokeWidth={2} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 animate-pulse">
          Validating Clearance
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Bouncer
  if (!admin) {
    if (isLoginPath) return null; // Break infinite loop if already on login
    const loginPath = isTemplePath ? "/temple-admin/login" : "/admin/login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  const roleType = Number(admin?.user_type);

  // 3. Role-Based Access Control (RBAC) Strict Enforcement
  if (allowedTypes && !allowedTypes.includes(roleType)) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-black tracking-widest uppercase mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-8">You do not have clearance for this sector.</p>
        <button 
          onClick={() => window.location.href = roleType === 1 ? "/admin/dashboard" : "/temple-admin/dashboard"}
          className="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
};