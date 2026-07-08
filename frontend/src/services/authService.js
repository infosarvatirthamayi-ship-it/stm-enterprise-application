// src/services/authService.js
import api from "../api/api";

export const userLogin = async (identifier, password) => {
  // 🎯 THE FIX: Send the unified identifier directly to the correct /user/login endpoint
  const response = await api.post("web/user/login", { 
    identifier: String(identifier).trim(),
    password 
  });
  return response.data;
};

export const adminLogin = async (email, password) => {
  // 🎯 THE FIX: Aligned with backend webRoutes.js (/admin/auth/login)
  const response = await api.post("/admin/login", { email, password });
  return response.data;
};

// 🎯 Isolated Temple Admin Login Gateway
export const templeAdminLogin = async (email, password) => {
  const response = await api.post("/temple-admin/login", { email, password });
  return response.data;
};

export const userSignup = async (userData) => {
  const payload = {
    first_name: userData.firstName,
    email: userData.email,
    mobile_number: userData.mobileNumber || userData.mobile,
    password: userData.password
  };
  const response = await api.post("/user/signup", payload);
  return response.data;
};

// 🎯 UPDATE: Support 3 distinct logout routes aligned exactly with the backend
export const logout = async (role = "user") => {
  let logoutUrl = "/user/logout";
  if (role === "admin") logoutUrl = "/admin/auth/logout"; 
  if (role === "temple-admin") logoutUrl = "/temple-admin/logout";
  
  return await api.post(logoutUrl);
};

// 🎯 Centralized Check-Auth calls for the Contexts
export const checkAdminAuth = async () => {
  const response = await api.get("/admin/check-auth");
  return response.data;
};

export const checkTempleAdminAuth = async () => {
  const response = await api.get("/temple-admin/check-auth");
  return response.data;
};

export const authService = {
  adminLogin,
  templeAdminLogin,
  userLogin,
  userSignup,
  logout,
  checkAdminAuth,
  checkTempleAdminAuth
};

export default authService;