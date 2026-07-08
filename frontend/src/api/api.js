import axios from "axios";
import { API_BASE_URL } from "../utils/config";

const api = axios.create({
  baseURL: API_BASE_URL, //|| "http://localhost:5000/api/v1",
  withCredentials: true, // 🎯 This alone sends the httpOnly cookie securely
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛡️ REQUEST INTERCEPTOR: Kept simple for headers (Tokens are now in cookies)
//api.interceptors.request.use(
  //(config) => config, 
  //(error) => Promise.reject(error)
//);

// 🛡️ RESPONSE INTERCEPTOR: Silent Rejection
//api.interceptors.response.use(
 // (response) => response,
  //(error) => {
    //return Promise.reject(error);
  //}
//);

export default api;