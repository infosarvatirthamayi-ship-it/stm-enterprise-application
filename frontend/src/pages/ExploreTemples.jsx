import React, { useState, useEffect } from 'react';
import api from '../api/api'; // 👈 Using your exact API interceptor!
import toast from 'react-hot-toast';

export default function ExploreTemples() {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemples();
  }, []);

  const fetchTemples = async () => {
    try {
      // 🎯 Hits: http://localhost:5000/api/v1/web/temples
      const response = await api.get('/temples');
      
      if (response.data.success) {
        setTemples(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load temples.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 The "5 Favorite Temples" Engine Trigger
  const toggleFavorite = async (templeId) => {
    try {
      const response = await api.post('/profile/favorite-temple', { templeId });
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update favorites.');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20 text-xl font-bold">Loading Sacred Temples...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-10 text-center text-orange-600">Explore Temples</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {temples.map((temple) => (
          <div key={temple._id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition hover:shadow-xl">
            
            {/* Image Container */}
            <div className="h-56 bg-gray-200 relative">
              {temple.image ? (
                <img src={temple.image} alt={temple.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">No Image Available</div>
              )}
              
              {temple.is_free_today && (
                <span className="absolute top-3 right-3 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow">
                  Free Entry Today
                </span>
              )}
            </div>

            {/* Content Container */}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">{temple.name}</h2>
              <p className="text-gray-600 mb-5 text-sm font-medium">
                📍 {temple.location}
              </p>

              {/* 🧠 THE SMART PRICING VIP UI */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200 mb-6">
                {!temple.is_free_today && temple.standard_price > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-gray-500 text-sm">
                      <span>Standard Price:</span>
                      <span className="line-through">₹{temple.standard_price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-700 font-bold">25% VIP Club Price:</span>
                      <span className="text-2xl font-black text-orange-600">₹{temple.club_member_price}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-green-600 font-bold text-center py-3 text-lg">
                    Completely Free to Visit!
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4">
                <button 
                  onClick={() => toggleFavorite(temple._id)}
                  className="flex-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold py-3 px-4 rounded-lg transition border border-gray-200"
                >
                  ❤️ Save
                </button>
                <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition">
                  Book Visit
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}