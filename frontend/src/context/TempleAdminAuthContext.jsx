import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { authService } from "../services/authService";

const TempleAdminAuthContext = createContext(null);

export const TempleAdminAuthProvider = ({ children }) => {
  const [templeAdmin, setTempleAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🎯 ZERO LOCAL STORAGE: Pure React state.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) root.classList.add("dark"); 
    else root.classList.remove("dark");
  }, [dark]);

  const refreshTempleAdmin = useCallback(async () => {
    try {
      const res = await authService.checkTempleAdminAuth();
      const data = res?.user || res?.data || null;
      
      if (data && Number(data.user_type) !== 2) {
        throw new Error("Unauthorized portal access");
      }
      
      setTempleAdmin(data);
      return data;
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error("Temple Admin Auth Error:", err);
      }
      setTempleAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshTempleAdmin();
      setLoading(false);
    };
    init();
  }, [refreshTempleAdmin]);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const response = await authService.templeAdminLogin(credentials.email, credentials.password);
      if (response.success || response.status === "true") {
        const data = response.user || response.data;
        setTempleAdmin(data);
        return data;
      }
      throw new Error(response.message || "Login failed");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout("temple-admin");
    } catch (err) {
      console.error("Temple Admin Logout API failed", err);
    } finally {
      setTempleAdmin(null);
      setError(null);
    }
  }, []);

  const value = useMemo(() => ({
    templeAdmin, setTempleAdmin, login, logout, refreshTempleAdmin, loading, error, dark, setDark, authenticated: !!templeAdmin,
  }), [templeAdmin, loading, error, login, logout, refreshTempleAdmin, dark]);

  return (
    <TempleAdminAuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-slate-400 font-serif animate-pulse">Loading Temple Portal...</p>
        </div>
      ) : children}
    </TempleAdminAuthContext.Provider>
  );
};

export const useTempleAdminAuth = () => {
  const context = useContext(TempleAdminAuthContext);
  if (!context) throw new Error("useTempleAdminAuth must be used within a TempleAdminAuthProvider");
  return context;
};