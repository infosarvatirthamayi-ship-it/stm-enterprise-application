import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { authService } from "../services/authService";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🎯 ZERO LOCAL STORAGE: Ephemeral state only.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) root.classList.add("dark"); 
    else root.classList.remove("dark"); 
  }, [dark]);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await authService.checkAdminAuth();
      const adminData = res?.user || res?.data || null;
      
      if (adminData && Number(adminData.user_type) !== 1) {
        throw new Error("Unauthorized portal access");
      }
      
      setAdmin(adminData);
      return adminData;
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Admin Auth Error:", err);
      }
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshAdmin();
      setLoading(false);
    };
    init();
  }, [refreshAdmin]);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const response = await authService.adminLogin(credentials.email, credentials.password);
      if (response.success || response.status === "true") {
        const adminData = response.user || response.data;
        setAdmin(adminData);
        return adminData;
      }
      throw new Error(response.message || "Login failed");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout("admin");
    } catch (err) {
      console.error("Admin Logout API failed", err);
    } finally {
      setAdmin(null);
      setError(null);
    }
  }, []);

  const value = useMemo(() => ({
    admin, setAdmin, login, logout, refreshAdmin, loading, error, dark, setDark, authenticated: !!admin,
  }), [admin, loading, error, login, logout, refreshAdmin, dark]);

  return (
    <AdminAuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-400 font-serif animate-pulse">Loading Admin Portal...</p>
        </div>
      ) : children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
};