// src/utils/config.js

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:5000';
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800';
  
  const baseUrl = IMAGE_BASE_URL.replace(/\/$/, ""); 

  // 🎯 THE FIX: Convert any Windows backslashes to web-safe forward-slashes FIRST
  const webSafePath = imagePath.replace(/\\/g, "/");
        
  // Now we check 'webSafePath' instead of 'imagePath'
  if (webSafePath.startsWith('http')) {
      if (baseUrl.includes('localhost') && webSafePath.includes('api.sarvatirthamayi.com')) {
          return webSafePath.replace('https://api.sarvatirthamayi.com', baseUrl);
      }
      return webSafePath;
  }

  // Clean any leading slashes from 'webSafePath' before combining
  const cleanPath = webSafePath.replace(/^\//, "");
  return `${baseUrl}/${cleanPath}`;
};