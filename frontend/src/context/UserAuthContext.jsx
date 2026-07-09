import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from "react";
import { authService } from "../services/authService";
import api from "../api/api";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      // 🎯 Secure Web Tier Route
      const res = await api.get("/web/user/check-auth");
      const userData = res.data?.user || null;
      setUser(userData);
      return userData;
    } catch (err) {
      // 🛡️ PRO ERROR HANDLING: Silent fail for check-auth on network drops
      if (!err.response) {
        console.warn("⚠️ Backend unreachable. Operating in offline/guest mode.");
      } else if (err.response.status !== 401) {
        // 🛡️ FIXED: Only print a warning if the error is NOT a standard 401 unauthenticated guest
        console.warn("⚠️ Auth Check Failed:", err.response?.data?.message || err.message);
      }
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = useCallback(async (credentials) => {
    setError(null);
    try {
      const response = await api.post("/web/user/login", {
        identifier: credentials.identifier,
        password: credentials.password
      });
      
      const resData = response.data;
      
      if (resData.success || resData.status === "true") {
        const userData = resData.user || resData.data;
        setUser(userData);
        return userData;
      }
      throw new Error(resData.message || "Login failed");
    } catch (err) {
      // 🛡️ PRO ERROR HANDLING: The Production Safety Net
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (!err.response) {
        // The server is down, connection refused, or no internet
        errorMessage = "Unable to connect to the server. Please check your internet or try again later.";
      } else if (err.response.status === 403) {
        // Aggressive Admin Blocker or Permission issues
        errorMessage = err.response.data?.message || "Access Denied.";
      } else if (err.response.status === 404 || err.response.status === 401) {
        // Standard user errors (wrong password, account not found)
        errorMessage = err.response.data?.message || "Invalid credentials.";
      }

      setError(errorMessage);
      
      // We throw a standardized error so the UI (UserLogin.jsx) can catch it cleanly
      throw new Error(errorMessage); 
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout("user");
    } catch (err) {
      console.warn("⚠️ Server unreachable during logout. Clearing local session safely.");
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    authenticated: !!user,
  }), [user, loading, error, login, logout, refreshUser]);

  return (
    <UserAuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-slate-500 font-serif animate-pulse">Entering Sacred Space...</p>
        </div>
      ) : (
        children
      )}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
};