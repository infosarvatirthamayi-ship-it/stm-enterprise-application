import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config"; 
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import { FaPlaceOfWorship, FaMapMarkerAlt, FaInbox, FaChevronRight } from "react-icons/fa";
import Navbar from "../../../components/Navbar";

// You can use any premium dark background for your Hero section here
import heroBg from "../../../assets/hero-bg.jpg";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function RitualPage() {
  const navigate = useNavigate();
  const [temples, setTemples] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Ensure these endpoints exist in your routes!
        const [templeRes, ritualRes] = await Promise.all([
          api.get("/user/temples").catch(() => ({ data: { data: [] } })),
          api.get("/user/rituals").catch(() => ({ data: { data: [] } }))
        ]);
        
        setTemples(templeRes.data?.data || []);
        setRituals(ritualRes.data?.data || []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <div className="animate-pulse text-indigo-600 font-bold tracking-widest uppercase text-sm">
          Invoking Sacred Services...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[55vh] md:h-[65vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroBg || "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=2070"} 
            className="w-full h-full object-cover brightness-[0.35]" 
            alt="Sacred Rituals Backdrop" 
          />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center text-white px-6 mt-10"
        >
          <span className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs sm:text-sm mb-4 block">
            Divine Offerings
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight">
            Sacred Rituals
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-slate-300 font-medium leading-relaxed">
            Direct your prayers through ancient Vedic traditions performed by verified pandits at consecrated energy centers.
          </p>
        </motion.div>

        {/* Beautiful bottom gradient fade */}
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10"></div>
      </section>

      {/* --- TEMPLE CAROUSEL SECTION --- */}
      {temples.length > 0 && (
        <section className="py-16 relative z-20 -mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true, dynamicBullets: true }}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              className="pb-16 temple-swiper"
            >
              {temples.map((temple) => (
                <SwiperSlide key={temple._id}>
                  <div className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 group border border-slate-100 cursor-pointer h-[320px]">
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={getFullImageUrl(temple.image)} 
                        alt={temple.name}
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                         <span className="bg-indigo-600/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block">
                           Verified Site
                         </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-black text-slate-800 truncate mb-1" title={temple.name}>{temple.name}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <FaMapMarkerAlt className="text-indigo-400" /> {temple.city_name || "Sacred Location"}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* --- RITUAL DETAILS GRID --- */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Available Ceremonies</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">Select a ritual to view detailed packages and book your auspicious slot.</p>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              {rituals.length} Offerings Found
            </div>
          </div>

          {rituals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rituals.map((ritual, index) => (
                <motion.div 
                  key={ritual._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group"
                >
                  <div className="w-full h-48 bg-slate-100 rounded-2xl mb-5 overflow-hidden relative">
                    <img 
                      src={getFullImageUrl(ritual.image)} 
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      alt={ritual.name}
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }}
                    />
                    {/* Floating Temple Tag */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <FaPlaceOfWorship className="text-indigo-600 text-xs" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-800 max-w-[120px] truncate">
                        {ritual.temple_name || "Temple Service"}
                      </span>
                    </div>
                  </div>

                  <div className="px-2 flex-1 flex flex-col">
                      <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {ritual.name}
                      </h3>
                      <p className="text-slate-500 text-xs mb-6 leading-relaxed line-clamp-3 font-medium">
                        {ritual.description || "Consecrated Vedic ceremony conducted with traditional rites and holy offerings."}
                      </p>
                      
                      <button 
                        onClick={() => navigate(`/ritual-view/${ritual._id}`)}
                        className="mt-auto w-full bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 border border-indigo-100 hover:border-indigo-600"
                      >
                        View Packages <FaChevronRight size={10} />
                      </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaInbox size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-1">No Rituals Available</h3>
              <p className="font-medium text-sm text-slate-500">There are currently no active ceremonies scheduled in the system.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}