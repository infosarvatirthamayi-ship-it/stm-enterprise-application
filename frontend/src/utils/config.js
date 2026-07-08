// src/utils/config.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000';
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
  
  const baseUrl = IMAGE_BASE_URL.replace(/\/$/, ""); 

  // 🎯 THE FIX: Intercept hardcoded production URLs and force them to localhost during dev
  if (imagePath.startsWith('http')) {
      if (baseUrl.includes('localhost') && imagePath.includes('api.sarvatirthamayi.com')) {
          return imagePath.replace('https://api.sarvatirthamayi.com', baseUrl);
      }
      return imagePath;
  }

  const cleanPath = imagePath.replace(/^\//, "");
  return `${baseUrl}/${cleanPath}`;
};