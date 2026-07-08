// src/pages/user/Temples/TempleList.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Inbox, Loader2, MapPin, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Navbar from "../../../components/Navbar";
import heroBg from "../../../assets/hero-bg.jpg";
import { useTheme } from "../../../context/ThemeContext";

export default function TempleList() {
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // 🎯 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 12;

  // 1. Memoized fetch function mapping to Web BFF
  const fetchTemples = useCallback(async (query = "", page = 1) => {
    try {
      setIsSearching(true);
      const res = await api.get(`/web/temples?per_page=${perPage}&page=${page}&search=${query}`);
      
      const data = res.data?.data?.data || res.data?.data || [];
      const total = res.data?.data?.last_page || res.data?.data?.totalPages || Math.ceil((res.data?.data?.total || data.length) / perPage) || 1;

      setTemples(data);
      setTotalPages(total);
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
      setCurrentPage(1);
      fetchTemples(searchTerm, 1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchTemples]);

  // Handle Page Changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchTemples(searchTerm, newPage);
      window.scrollTo({ top: 400, behavior: "smooth" }); // Smooth scroll to grid top
    }
  };

  // 3. Bulletproof Navigation handler
  const handleNavigate = (temple) => {
    const targetId = temple.sql_id || temple.id || temple._id;
    if (!targetId) return console.error("Navigation Blocked: Missing ID");
    navigate(`/user/temples/${targetId}`);
  };

  if (loading && currentPage === 1) return (
    <div className={`h-screen flex flex-col items-center justify-center transition-colors duration-500 ${dark ? 'bg-[#0a0a1a]' : 'bg-slate-50'}`}>
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-16 h-16 border-4 border-purple-500/20 rounded-full animate-ping" />
        <Loader2 className="animate-spin text-purple-500 relative z-10" size={48} />
      </div>
      <div className="font-black tracking-[0.2em] uppercase text-[10px] text-purple-500 animate-pulse">
        Sanctifying Connection...
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-24 font-sans transition-colors duration-700 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Navbar />

      {/* Premium Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center bg-slate-950 overflow-hidden pt-20">
        <img src={heroBg} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" alt="Hero" />
        <div className={`absolute inset-0 bg-gradient-to-b from-transparent ${dark ? 'to-[#0a0a1a]' : 'to-[#f8fafc]'}`} />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center w-full px-6">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-300 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
              <Sparkles size={14} /> Global Access
            </span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight drop-shadow-2xl">Sacred Destinations</h1>
            <p className="text-slate-300 font-medium text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Explore verified spiritual centers and secure your digital darshan pass instantly.
            </p>
            
            <div className="relative group text-left max-w-2xl mx-auto shadow-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
              <input 
                type="text" 
                placeholder="Search by temple name or city..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-16 pl-16 pr-14 rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 text-white placeholder:text-slate-400 outline-none focus:bg-white/20 focus:border-purple-400 focus:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all font-medium text-lg"
              />
              {isSearching && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-purple-400" size={22} />}
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Grid & Pagination Section */}
      <section className="py-12 px-4 max-w-7xl mx-auto relative z-20 -mt-10">
        <AnimatePresence mode="wait">
          {temples.length > 0 ? (
            <motion.div 
              key={`page-${currentPage}`} // 🎯 Animates the entire page transition
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {temples.map((t, index) => (
                  <motion.div 
                    key={t.id || t._id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNavigate(t)}
                    className={`p-3 rounded-[2.5rem] border backdrop-blur-sm shadow-xl transition-all duration-500 cursor-pointer group ${
                      dark 
                        ? 'bg-slate-900/50 border-slate-800 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-1' 
                        : 'bg-white border-slate-200 hover:shadow-2xl hover:border-purple-200 hover:-translate-y-1'
                    }`}
                  >
                    <div className="h-56 rounded-[2rem] overflow-hidden mb-5 relative bg-slate-800">
                      <img 
                        src={getFullImageUrl(t.image)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                        alt={t.name}
                        onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {t.is_free_today && (
                        <span className="absolute top-4 left-4 bg-emerald-500 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400">
                          FREE TODAY
                        </span>
                      )}
                    </div>
                    <div className="px-4 pb-4">
                      <p className="text-[10px] flex items-center gap-1 text-purple-500 font-black uppercase tracking-widest mb-2">
                        <MapPin size={12} /> {t.city_name || "Sacred Site"}
                      </p>
                      <h3 className={`font-bold text-xl line-clamp-1 font-serif ${dark ? 'text-white' : 'text-slate-900'}`}>{t.name}</h3>
                      
                      <div className={`flex justify-between items-center mt-5 pt-5 border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Darshan Fee</p>
                          <span className={`font-black text-lg ${dark ? 'text-white' : 'text-slate-900'}`}>₹{t.visit_price || 0}</span>
                        </div>
                        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-colors duration-300 ${
                          dark ? 'bg-slate-800 text-slate-400 group-hover:bg-purple-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-purple-600 group-hover:text-white'
                        }`}>
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 🎯 Advanced Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-16">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isSearching}
                    className={`p-3 rounded-xl shadow-sm transition-all flex items-center justify-center ${
                      dark 
                        ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-30' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 disabled:opacity-50'
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isSearching}
                            className={`w-11 h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                              currentPage === pageNum 
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-500" 
                                : dark 
                                  ? "bg-slate-900 border border-slate-800 text-slate-400 hover:border-purple-500/50 hover:text-purple-400"
                                  : "bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className={`text-sm font-bold ${dark ? 'text-slate-600' : 'text-slate-400'}`}>...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isSearching}
                    className={`p-3 rounded-xl shadow-sm transition-all flex items-center justify-center ${
                      dark 
                        ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 disabled:opacity-30' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-purple-600 hover:border-purple-300 disabled:opacity-50'
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-32">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${dark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100'}`}>
                <Inbox size={40} className={dark ? 'text-slate-600' : 'text-slate-400'} />
              </div>
              <h3 className={`text-2xl font-black font-serif mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>No Destinations Found</h3>
              <p className={`font-medium max-w-sm mx-auto ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Try adjusting your search terms or exploring different sacred regions.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}