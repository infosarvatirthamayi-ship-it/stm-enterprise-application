import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, ArrowLeft, Shrub, ShieldCheck, 
  ExternalLink, Info, Calendar, Sparkles, 
  ArrowRight, ChevronRight 
} from "lucide-react"; 
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import Navbar from "../../../components/Navbar";

export default function RitualView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ritual, setRitual] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.post(`/user/ritual/show`, { ritual_id: id });
        if (res.data.success) {
          setRitual(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching ritual details:", err);
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo(0, 0); 
    fetchDetails();
  }, [id]);

  const getFormattedAddress = () => {
    const addr = ritual?.address;
    if (!addr) return "Location details being sanctified...";
    return addr.full_address || [addr.address_line1, addr.city, addr.state].filter(Boolean).join(", ");
  };

  if (loading || !ritual) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium animate-pulse text-sm uppercase tracking-widest">Invoking Sacred Details...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFAFF] text-slate-900 font-sans pb-24 lg:pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 pt-24">
        
        {/* --- Header Navigation --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <button 
            onClick={() => navigate("/user/rituals")} 
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-bold uppercase tracking-wider text-xs w-fit"
          >
            <div className="p-2.5 rounded-xl bg-white shadow-sm group-hover:bg-indigo-50 transition-colors border border-slate-200 group-hover:border-indigo-200 group-active:scale-95">
              <ArrowLeft size={16} />
            </div>
            Back to Rituals
          </button>
          
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 w-fit shadow-sm">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Verified Traditional Ritual</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* --- LEFT: Image Section (Sticky) --- */}
          <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-28">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200 bg-white p-2 border border-slate-100 group">
              <img 
                src={getFullImageUrl(ritual.image)} 
                alt={ritual.name}
                className="w-full aspect-[4/5] object-cover rounded-[2rem] transform transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1604340083878-a3947d1775c5?q=80&w=1000'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none rounded-[2rem]"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-indigo-300" />
                    <span className="text-xs font-bold uppercase tracking-wider">Daily Slots Open</span>
                  </div>
                  <Sparkles size={18} className="text-amber-300 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: Content Section --- */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col space-y-8">
            <header>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 leading-tight mb-4 tracking-tight">
                {ritual.name}
              </h1>
              <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                Type: {ritual.type || "Traditional Vedic"}
              </div>
            </header>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Shrub size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-black mb-1">Conducted At</p>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">{ritual.temple_name || "Sacred Temple Site"}</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-black mb-1">Temple Location</p>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium mb-3 truncate">
                      {ritual.address?.city || getFormattedAddress()}
                    </p>
                    {/* 🎯 FIXED: Proper Google Maps Search Query URL */}
                    <button 
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFormattedAddress())}`, '_blank')}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 transition-all group-hover:underline"
                    >
                        View on Map <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Significance Section */}
            <div className="relative p-8 bg-white rounded-[2.5rem] border border-dashed border-slate-300 overflow-hidden shadow-sm">
              <div className="absolute -top-6 -right-6 text-slate-50 opacity-50">
                <Info size={150} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4 flex items-center gap-2">
                   <Info size={14} className="text-indigo-500" /> Divine Significance
                </h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg font-medium">
                  "{ritual.description || "Performed with absolute Vedic precision to invoke divine protection and spiritual harmony for the devotee."}"
                </p>
              </div>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="hidden lg:block pt-4">
              <button 
                onClick={() => navigate(`/book-ritual/${ritual.id}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Proceed to Booking <ArrowRight size={18} />
              </button>
              <div className="mt-5 flex items-center justify-center gap-4 opacity-50 grayscale">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Encrypted Booking Gateway</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Mobile Sticky Footer --- */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <button 
            onClick={() => navigate(`/book-ritual/${ritual.id}`)}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Proceed to Booking <ChevronRight size={16} />
          </button>
      </div>
    </div>
  );
}