import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config"; 
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronRight, Inbox, ChevronLeft, Sparkles } from "lucide-react"; 
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext";

export default function RitualPage() {
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  
  const [rituals, setRituals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🎯 Ref for smart pagination scrolling
  const gridTopRef = useRef(null);

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
    // Smooth, precise scroll to the top of the grid
    if (gridTopRef.current) {
      const yOffset = -100; // Account for fixed navbar
      const y = gridTopRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center transition-colors duration-300 ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
        <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full absolute"></div>
            <div className="w-20 h-20 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin absolute"></div>
            <Sparkles className="text-indigo-500 animate-pulse" size={24} />
        </div>
        <div className="mt-8 animate-pulse text-indigo-500 font-black tracking-[0.2em] uppercase text-[10px]">
          Invoking Sacred Services...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-24 transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Parallax Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2070" 
            className="w-full h-full object-cover opacity-30 object-top transform scale-105" 
            alt="Sacred Rituals" 
          />
        </div>
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950 z-10"></div>
        <div className={`absolute bottom-0 w-full h-32 bg-gradient-to-t ${dark ? 'from-[#0a0a1a]' : 'from-slate-50'} to-transparent z-20 transition-colors duration-500`}></div>
        
        {/* Hero Content */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 1, ease: "easeOut" }} 
            className="relative z-30 text-center text-white px-6 mt-16 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <Sparkles className="text-indigo-400" size={14} />
            <span className="text-indigo-300 font-black tracking-[0.3em] uppercase text-[10px]">Divine Offerings</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-none drop-shadow-2xl">
            Sacred <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Rituals</span>
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-300 font-medium leading-relaxed drop-shadow-md">
            Direct your prayers through ancient Vedic traditions performed by verified pandits at consecrated energy centers.
          </p>
        </motion.div>
      </section>

      {/* --- RITUAL GRID SECTION --- */}
      <section className="px-4 sm:px-6 relative z-30 -mt-10" ref={gridTopRef}>
        <div className="max-w-7xl mx-auto">
          
          {/* Header & Meta */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Available Ceremonies</h2>
              <p className={`mt-2 text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Select a ritual to view detailed packages and pricing.</p>
            </div>
            <div className={`text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-2xl border shadow-sm backdrop-blur-md ${dark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-600'}`}>
              <span className="text-indigo-500">{rituals.length}</span> Offerings Found
            </div>
          </div>

          {rituals.length > 0 ? (
            <>
              {/* Cards Grid */}
              <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                  {currentRituals.map((ritual, index) => (
                    <motion.div 
                      key={ritual._id || ritual.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className={`group flex flex-col rounded-[2.5rem] overflow-hidden border shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 ${dark ? 'bg-[#0f172a] border-slate-800 hover:border-indigo-500/30 hover:shadow-indigo-900/20' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-indigo-100'}`}
                    >
                      {/* Image Container */}
                      <div className="w-full aspect-[4/3] bg-slate-800 relative overflow-hidden">
                        <img 
                          src={getFullImageUrl(ritual.image)} 
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                          alt={ritual.name}
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604340083878-a3947d1775c5?q=80&w=800'; }}
                        />
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                        
                        {/* Glassmorphism Badge */}
                        <div className="absolute top-4 left-4 bg-white/20 dark:bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/20">
                          <MapPin className="text-white" size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white max-w-[140px] truncate drop-shadow-md">
                            {ritual.temple_name || "Sacred Site"}
                          </span>
                        </div>
                      </div>

                      {/* Content Container */}
                      <div className="p-6 flex-1 flex flex-col">
                          <h3 className={`text-xl font-black mb-3 leading-tight group-hover:text-indigo-500 transition-colors capitalize ${dark ? 'text-white' : 'text-slate-900'}`}>
                            {ritual.name}
                          </h3>
                          <p className={`text-sm mb-6 leading-relaxed line-clamp-2 font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {ritual.description}
                          </p>
                          
                          {/* Footer / CTA */}
                          <div className="mt-auto pt-5 border-t border-dashed border-slate-200 dark:border-slate-700/70">
                              <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                 Packages Available
                              </div>
                              <button 
                                onClick={() => navigate(`/user/ritual-view/${ritual._id || ritual.id}`)}
                                className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 flex items-center justify-center gap-2 border ${dark ? 'bg-slate-800/50 text-slate-300 border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500' : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600'}`}
                              >
                                View Details <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                              </button>
                          </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* 🎯 UI Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-16">
                  <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white shadow-sm hover:bg-slate-50 text-slate-800 border border-slate-200 hover:shadow-md'}`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${dark ? 'bg-slate-800/50' : 'bg-white shadow-sm border border-slate-100'}`}>
                    {[...Array(totalPages)].map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => paginate(i + 1)}
                        className={`w-10 h-10 rounded-full text-xs font-black transition-all duration-300 ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : (dark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${dark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white shadow-sm hover:bg-slate-50 text-slate-800 border border-slate-200 hover:shadow-md'}`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-[3rem] p-16 md:p-24 border text-center shadow-sm max-w-2xl mx-auto mt-10 ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${dark ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-50 text-slate-300'}`}>
                <Inbox size={40} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3 font-serif italic tracking-tight">No Rituals Available</h3>
              <p className={`font-medium text-base ${dark ? 'text-slate-400' : 'text-slate-500'}`}>There are currently no active ceremonies scheduled. Please check back soon for upcoming sacred offerings.</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}