// src/services/adminService.js
import api from "../api/api";

/**
 * 🛕 Provision a new Temple Admin (User Type 2)
 */
export const createTempleAdmin = async (adminData) => {
  const payload = {
    first_name: adminData.firstName,
    last_name: adminData.lastName,
    email: adminData.email,
    mobile_number: adminData.mobileNumber,
    password: adminData.password,
    user_type: 2, // 🎯 Strictly forces this account to be a Temple Admin
    temple_id: adminData.templeId
  };

  const response = await api.post("/admin/create-admin", payload);
  return response.data;
};

/**
 * 📋 Fetch all Temple Admins (Useful for a management table later)
 */
export const getAllTempleAdmins = async () => {
  // Assuming you create this route in the backend later!
  const response = await api.get("/admin/temple-admins");
  return response.data;
};

/**
 * 🏛️ Fetch all Registered Temples (To populate the dropdown in the creation form)
 */
export const getActiveTemples = async () => {
  // Assuming you have a route to fetch temples
  const response = await api.get("/admin/temples");
  return response.data;
};

export const adminService = {
  createTempleAdmin,
  getAllTempleAdmins,
  getActiveTemples
};

export default adminService;