import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, ArrowLeft, Shrub, ShieldCheck, 
  ExternalLink, Info, Tags, ArrowRight, Sparkles 
} from "lucide-react"; 
import { motion } from "framer-motion";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext";

export default function RitualView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  
  const [ritual, setRitual] = useState(null);
  const [startingPrice, setStartingPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetailsAndPackages = async () => {
      try {
        setLoading(true);
        const ritualRes = await api.post(`/user/ritual/show`, { ritual_id: id });
        
        if (ritualRes.data.success) {
          const ritualData = ritualRes.data.data;
          setRitual(ritualData);

          const mongoId = ritualData._id || ritualData.id || id;
          const packageRes = await api.get(`/web/rituals/${mongoId}/packages`).catch(() => ({ data: { data: [] } }));
          
          const pkgs = packageRes.data?.data || [];
          if (pkgs.length > 0) {
             const lowest = Math.min(...pkgs.map(p => Number(p.display_price)));
             setStartingPrice(lowest);
          }
        }
      } catch (err) {
        console.error("Error fetching ritual details:", err);
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    fetchDetailsAndPackages();
  }, [id]);

  const getFormattedAddress = () => {
    const addr = ritual?.address;
    if (!addr || (!addr.full_address && !addr.city && !addr.address_line1)) {
      return "Sacred Temple Location";
    }
    return addr.full_address || [addr.address_line1, addr.city, addr.state].filter(Boolean).join(", ");
  };

  // Premium Loading State
  if (loading || !ritual) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center transition-colors duration-500 ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
        <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900/30 rounded-full absolute"></div>
            <div className="w-20 h-20 border-4 border-transparent border-t-indigo-600 rounded-full animate-spin absolute"></div>
            <Sparkles className="text-indigo-500 animate-pulse" size={24} />
        </div>
        <p className="mt-8 animate-pulse text-indigo-500 font-black tracking-[0.2em] uppercase text-[10px]">
          Invoking Sacred Details...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans pb-24 lg:pb-12 transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 pt-28">
        
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <button 
            onClick={() => navigate("/user/rituals")} 
            className={`group flex items-center gap-3 transition-all font-bold uppercase tracking-wider text-[10px] w-fit ${dark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            <div className={`p-2.5 rounded-xl transition-all border group-active:scale-95 ${dark ? 'bg-slate-900 border-slate-800 group-hover:border-indigo-500/50 group-hover:bg-indigo-900/20' : 'bg-white shadow-sm border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50'}`}>
              <ArrowLeft size={16} />
            </div>
            Back to Ceremonies
          </button>
          
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border w-fit shadow-sm backdrop-blur-md ${dark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Traditional Ritual</span>
          </div>
        </div>

        {/* Main Content Layout */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start"
        >
          
          {/* Left Column: Image */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-32">
            <div className={`relative rounded-[2.5rem] overflow-hidden p-2 border group shadow-2xl ${dark ? 'bg-[#0f172a] border-slate-800 shadow-indigo-900/10' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <img 
                src={getFullImageUrl(ritual.image)} 
                alt={ritual.name}
                className="w-full aspect-[4/5] object-cover rounded-[2rem] transform transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604340083878-a3947d1775c5?q=80&w=1000'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-[2rem]"></div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-8">
            <header>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight capitalize drop-shadow-sm">
                {ritual.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                  <div className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${dark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                    Type: {ritual.type || "Traditional Vedic"}
                  </div>
                  {startingPrice !== null && (
                      <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${dark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        <Tags size={14}/> Packages From ₹{startingPrice}
                      </div>
                  )}
              </div>
            </header>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 group ${dark ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/80' : 'bg-white border-slate-200/80 hover:shadow-md'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${dark ? 'bg-indigo-900/30 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                    <Shrub size={24} />
                  </div>
                  <div>
                    <p className={`text-[9px] uppercase tracking-[0.2em] font-black mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Conducted At</p>
                    <h3 className="text-lg font-black leading-snug">{ritual.temple_name || "Sacred Temple Site"}</h3>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 group ${dark ? 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/80' : 'bg-white border-slate-200/80 hover:shadow-md'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl transition-colors ${dark ? 'bg-blue-900/30 text-blue-400 group-hover:bg-blue-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-[9px] uppercase tracking-[0.2em] font-black mb-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Temple Location</p>
                    <p className={`text-sm leading-relaxed font-bold mb-3 truncate ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {ritual.address?.city || getFormattedAddress()}
                    </p>
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFormattedAddress())}`, '_blank')}
                        className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 transition-all group-hover:underline ${dark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                    >
                        View on Map <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Significance Section */}
            <div className={`relative p-8 md:p-10 rounded-[2.5rem] border border-dashed overflow-hidden shadow-sm ${dark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-300'}`}>
              <div className={`absolute -top-10 -right-10 opacity-10 ${dark ? 'text-slate-500' : 'text-slate-800'}`}>
                <Info size={200} />
              </div>
              <div className="relative z-10">
                <h3 className={`text-[10px] uppercase tracking-[0.2em] font-black mb-5 flex items-center gap-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                   <Info size={16} className="text-indigo-500" /> Divine Significance
                </h3>
                <p className={`leading-relaxed text-base md:text-lg font-medium italic ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                  "{ritual.description || "Performed with absolute Vedic precision to invoke divine protection and spiritual harmony for the devotee."}"
                </p>
              </div>
            </div>

            {/* CTA Button - NOW VISIBLE ON ALL DEVICES */}
            <div className="pt-4 mt-auto">
              <button 
                onClick={() => navigate(`/user/book-ritual/${id}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Proceed to Package Selection <ArrowRight size={20} />
              </button>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}