import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { MapPin, ArrowLeft, Clock, ShieldCheck, ExternalLink, Info, Phone, ArrowRight } from "lucide-react"; 
import Navbar from "../../../components/Navbar";

export default function TempleView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Fallback robust lookup checking numeric ID or Mongo ID
        const res = await api.get(`/user/temples/${id}`);
        if (res.data.success) setTemple(res.data.temple || res.data.data);
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
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Sanctum...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFAFF] text-slate-900 font-sans pb-24">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/user/temples")} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-bold uppercase tracking-wider text-xs">
            <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-200 group-hover:border-indigo-200"><ArrowLeft size={16} /></div>
            Back to Hub
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
            <ShieldCheck size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Verified Temple</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* --- LEFT: Image Section --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-white p-2 border border-slate-100">
              <img 
                src={getFullImageUrl(temple.image)} alt={temple.name}
                className="w-full aspect-[4/5] object-cover rounded-[2rem]"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }}
              />
              {/* Overlays */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {temple.is_free_today && <span className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Free Entry Today</span>}
              </div>
            </div>
          </div>

          {/* --- RIGHT: Content Section --- */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <header>
              <h1 className="text-4xl md:text-6xl font-black text-slate-800 leading-tight mb-4 tracking-tight">{temple.name}</h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">{temple.short_description}</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Timings */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-black mb-1">Darshan Timings</p>
                    <h3 className="text-base font-bold text-slate-800">{temple.open_time || "6:00 AM"} - {temple.close_time || "8:00 PM"}</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Open every day</p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><MapPin size={24} /></div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-black mb-1">Location</p>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{temple.city_name}</h3>
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFormattedAddress())}`, '_blank')} className="text-indigo-600 hover:text-indigo-800 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 mt-2">
                        View Map <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-sm">
               <h3 className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4 flex items-center gap-2">
                  <Info size={14} className="text-indigo-500" /> Historical Significance
               </h3>
               <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{temple.long_description || "Detailed temple history is being documented."}</p>
            </div>

            {/* Action Area */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
               <div className="text-white">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Standard Darshan Fee</p>
                 <div className="text-4xl font-black">
                   {temple.is_free_today ? <span className="text-emerald-400">Free</span> : `₹${temple.visit_price || 0}`}
                 </div>
               </div>
               <button 
                onClick={() => navigate(`/book-temple/${temple.sql_id || temple._id}`)}
                className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 Book Visit <ArrowRight size={18} />
               </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}