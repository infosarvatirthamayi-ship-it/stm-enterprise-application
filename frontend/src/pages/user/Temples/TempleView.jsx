// src/pages/user/Temples/TempleView.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { MapPin, ArrowLeft, Clock, ShieldCheck, ExternalLink, Info, ArrowRight, Sparkles } from "lucide-react"; 
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext"; // 👈 Add this import

export default function TempleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/web/temples/${id}`);
        if (res.data.success || res.data.status === "true") {
            setTemple(res.data.temple || res.data.data);
        }
      } catch (err) {
        console.error("Error fetching temple details:", err);
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo(0, 0); 
    fetchDetails();
  }, [id]);

  const getFormattedAddress = () => {
    if (!temple) return "";
    return [temple.address_line1, temple.address_line2, temple.landmark, temple.city_name, temple.state_name, temple.pincode].filter(Boolean).join(", ");
  };

  if (loading || !temple) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Sanctum...</p>
    </div>
  );

  return (
    <div className={`min-h-screen pb-20 font-sans transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/user/temples")} className="group flex items-center gap-3 text-slate-500 hover:text-purple-600 transition-all font-black uppercase tracking-widest text-[10px]">
            <div className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-200 group-hover:border-purple-200 transition-colors"><ArrowLeft size={16} /></div>
            Back to Destinations
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl border border-emerald-200 shadow-sm">
            <ShieldCheck size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Verified Sanctuary</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* --- LEFT: Image Section --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-white p-2 border border-slate-100">
              <img 
                src={getFullImageUrl(temple.image)} alt={temple.name}
                className="w-full aspect-[4/5] object-cover rounded-[2.5rem]"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }}
              />
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                  {temple.is_free_today && (
                    <span className="bg-emerald-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl border border-emerald-400">
                      Free Entry Today
                    </span>
                  )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: Content Section --- */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <header>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight mb-4 tracking-tight font-serif">{temple.name}</h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">{temple.short_description}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Timings */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1.5">Darshan Timings</p>
                    <h3 className="text-lg font-bold text-slate-800">{temple.open_time || "6:00 AM"} - {temple.close_time || "8:00 PM"}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Open every day</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl"><MapPin size={24} /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1.5">Location</p>
                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{temple.city_name || "India"}</h3>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFormattedAddress() || temple.name)}`, '_blank')} 
                      className="text-purple-600 hover:text-purple-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-2.5 transition-colors"
                    >
                        View on Map <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
               <h3 className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black mb-6 flex items-center gap-3">
                  <Info size={16} className="text-purple-500" /> Historical Significance
               </h3>
               <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{temple.long_description || "Detailed temple history is currently being documented by our scholars."}</p>
            </div>

            {/* Checkout / Action Area */}
            <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
               {/* Decorative background blur */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
               
               <div className="text-white relative z-10 w-full sm:w-auto">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Standard Darshan Fee</p>
                 <div className="text-5xl font-black font-serif tracking-tight">
                   {temple.is_free_today || temple.visit_price === 0 ? <span className="text-emerald-400">Free</span> : `₹${temple.visit_price}`}
                 </div>
                 {/* STM Club Upsell */}
                 {temple.visit_price > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                      <Sparkles size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Club Members save 25%</span>
                    </div>
                 )}
               </div>

               <button 
                onClick={() => navigate(`/user/book-temple/${temple.sql_id || temple._id}`)}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-10 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative z-10"
               >
                 Proceed to Booking <ArrowRight size={18} />
               </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}