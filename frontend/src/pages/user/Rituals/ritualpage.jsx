import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config"; 
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Inbox, ChevronLeft } from "lucide-react"; 
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext";

export default function RitualPage() {
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  
  const [rituals, setRituals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🎯 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/web/rituals").catch(() => ({ data: { data: [] } }));
        const ritualsData = res.data?.data || res.data || [];
        setRituals(Array.isArray(ritualsData) ? ritualsData : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🎯 Pagination Engine
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRituals = rituals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(rituals.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center transition-colors duration-300 ${dark ? 'bg-slate-900' : 'bg-[#f8fafc]'}`}>
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="animate-pulse text-indigo-500 font-black tracking-widest uppercase text-[10px]">
          Invoking Sacred Services...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-20 transition-colors duration-300 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[55vh] md:h-[65vh] flex items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2070" 
            className="w-full h-full object-cover opacity-40" 
            alt="Sacred Rituals" 
          />
        </div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center text-white px-6 mt-10">
          <span className="text-indigo-400 font-black tracking-[0.3em] uppercase text-[10px] sm:text-xs mb-4 block">Divine Offerings</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">Sacred Rituals</h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-300 font-medium leading-relaxed">
            Direct your prayers through ancient Vedic traditions performed by verified pandits at consecrated energy centers.
          </p>
        </motion.div>
        <div className={`absolute bottom-0 w-full h-32 bg-gradient-to-t ${dark ? 'from-slate-900' : 'from-slate-50'} to-transparent z-10`}></div>
      </section>

      {/* --- RITUAL GRID --- */}
      <section className="py-12 px-4 sm:px-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Available Ceremonies</h2>
              <p className={`mt-2 text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Select a ritual to view detailed packages and pricing.</p>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border shadow-sm ${dark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-500'}`}>
              {rituals.length} Offerings Found
            </div>
          </div>

          {rituals.length > 0 ? (
            <>
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {currentRituals.map((ritual, index) => (
                    <motion.div 
                      key={ritual._id || ritual.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border rounded-[2rem] p-4 flex flex-col shadow-sm transition-all duration-300 group ${dark ? 'bg-slate-800 border-slate-700 hover:border-indigo-500/50' : 'bg-white border-slate-100 hover:shadow-xl hover:border-indigo-200'}`}
                    >
                      <div className="w-full h-48 bg-slate-800 rounded-2xl mb-5 overflow-hidden relative">
                        <img 
                          src={getFullImageUrl(ritual.image)} 
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                          alt={ritual.name}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604340083878-a3947d1775c5?q=80&w=800'; }}
                        />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                          <MapPin className="text-indigo-500 text-xs" size={12} />
                          <span className={`text-[9px] font-black uppercase tracking-widest max-w-[120px] truncate ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {ritual.temple_name || "Sacred Site"}
                          </span>
                        </div>
                      </div>

                      <div className="px-2 flex-1 flex flex-col">
                          <h3 className="text-lg font-black mb-2 leading-tight group-hover:text-indigo-500 transition-colors capitalize">
                            {ritual.name}
                          </h3>
                          <p className={`text-xs mb-4 leading-relaxed line-clamp-2 font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {ritual.description}
                          </p>
                          
                          <div className="mt-auto pt-4 flex flex-col gap-3">
                              <div className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-between border-t border-dashed pt-3 ${dark ? 'border-slate-700 text-emerald-400' : 'border-slate-200 text-emerald-600'}`}>
                                 <span>Packages Available</span>
                              </div>
                              <button 
                                onClick={() => navigate(`/user/ritual-view/${ritual._id || ritual.id}`)}
                                className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border ${dark ? 'bg-indigo-900/20 text-indigo-400 border-indigo-900/50 hover:bg-indigo-600 hover:text-white hover:border-indigo-500' : 'bg-slate-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'}`}
                              >
                                View Packages <ChevronRight size={14} />
                              </button>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* 🎯 UI Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white shadow-sm hover:bg-slate-50 text-slate-800 border border-slate-200'}`}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-full text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : (dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200')}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white shadow-sm hover:bg-slate-50 text-slate-800 border border-slate-200'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`rounded-3xl p-16 border text-center shadow-sm ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${dark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <Inbox size={32} className={dark ? 'text-slate-500' : 'text-slate-300'} />
              </div>
              <h3 className="text-lg font-black mb-1">No Rituals Available</h3>
              <p className={`font-medium text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>There are currently no active ceremonies scheduled.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}