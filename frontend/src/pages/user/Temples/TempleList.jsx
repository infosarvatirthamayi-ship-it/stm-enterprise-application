import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Clock, ArrowRight, Inbox, Loader2, X } from "lucide-react";
import Navbar from "../../../components/Navbar";
import heroBg from "../../../assets/hero-bg.jpg"; 

export default function TempleList() {
  const navigate = useNavigate();
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 1. Memoized fetch function
  const fetchTemples = useCallback(async (query = "") => {
    try {
      setIsSearching(true);
      const res = await api.get(`/user/temples?per_page=100&search=${query}`);
      const data = res.data?.data?.data || res.data?.data || [];
      setTemples(data);
    } catch (err) {
      setTemples([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  // 2. Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTemples(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchTemples]);

  // 3. Bulletproof Navigation handler
  const handleNavigate = (temple) => {
    // Priority: SQL ID -> MongoDB _id
    const targetId = temple.sql_id || temple.id || temple._id;
    
    if (!targetId || targetId === "undefined" || targetId === undefined) {
      console.error("Navigation Blocked: Missing ID for temple:", temple);
      return;
    }
    navigate(`/user/temples/${targetId}`);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <div className="font-bold tracking-widest uppercase text-xs text-indigo-600 animate-pulse">Sanctifying Connection...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFAFF] font-sans pb-20">
      <Navbar />

      {/* Hero Section with proper top-padding to prevent Navbar overlap */}
      {/* Hero Section - Flexbox removed, physical padding applied */}
      {/* Hero Section - Using inline styles to bypass Tailwind cache issues */}
      <section className="relative min-h-[650px] flex items-center justify-center bg-slate-900 overflow-hidden">
      
        <img src={heroBg} className="absolute inset-0 w-full h-full object-cover brightness-[0.35]" alt="Hero" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center w-full">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Verified Temples</h1>
          
          <div className="relative group text-left">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or city..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-14 pr-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 outline-none focus:bg-white/20 transition-all shadow-xl"
            />
            {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-white" size={20} />}
          </div>
        </div>
      </section>

      
      {/* Grid Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {temples.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {temples.map((t) => (
                <motion.div 
                  key={t.id || t._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleNavigate(t)}
                  className="bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="h-48 rounded-[1.5rem] overflow-hidden mb-4 relative">
                    <img 
                      src={getFullImageUrl(t.image)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={t.name}
                      onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'}
                    />
                    {t.is_free_today && <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm">FREE</span>}
                  </div>
                  <div className="px-2 pb-2">
                    <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">{t.city_name || "Sacred Site"}</p>
                    <h3 className="font-black text-lg text-slate-800 line-clamp-1">{t.name}</h3>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                      <span className="font-black text-slate-800">₹{t.visit_price || 0}</span>
                      <div className="p-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-colors">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 text-slate-400"
            >
              <Inbox size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-black uppercase tracking-widest text-xs">No temples found matching your search</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}