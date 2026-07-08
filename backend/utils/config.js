// backend/utils/config.js
require('dotenv').config();

const getFullImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  
  // 🎯 Pulling directly from your .env file instead of hardcoding
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_API_URL 
    : process.env.BASE_ASSET_URL || "http://localhost:5000";
    
  return `${baseUrl}/${path.replace(/\\/g, "/")}`;
};

module.exports = {
  getFullImageUrl
};