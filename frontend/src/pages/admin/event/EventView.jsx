import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/api';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaArrowLeft, FaEdit, FaSpinner, FaCalendarAlt, 
  FaRupeeSign, FaPlaceOfWorship, FaAlignLeft, FaCheckCircle, FaTimesCircle 
} from 'react-icons/fa';

export default function EventView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/admin/events/${id}`);
        setEvent(res.data.data);
      } catch (err) {
        toast.error("Failed to fetch event details");
        navigate("/admin/event");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-4xl mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Loading Event Profile...</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      
      {/* HEADER ACTIONS */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/admin/event")} 
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold uppercase text-xs tracking-widest transition-colors bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200"
        >
          <FaArrowLeft /> Back to Events
        </button>
        <button 
          onClick={() => navigate(`/admin/event/edit/${id}`)} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
        >
          <FaEdit /> Edit Event Configuration
        </button>
      </div>
      
      {/* SYSTEM EVENT SHELL */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* HERO GRAPHIC BANNER */}
        <div className="relative h-72 sm:h-96 w-full bg-slate-900">
          <img 
            src={event.image || 'https://placehold.co/1200x600/1e293b/ffffff?text=No+Cover+Image+Available'} 
            className="w-full h-full object-cover opacity-75" 
            alt={event.name} 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <span className={`px-3 py-1.5 text-[10px] tracking-widest font-black rounded-lg uppercase inline-flex items-center gap-1.5 mb-3 shadow-sm ${event.status === 1 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              {event.status === 1 ? <><FaCheckCircle/> Active Platform Record</> : <><FaTimesCircle/> Suspended Record</>}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-sm">{event.name}</h1>
          </div>
        </div>

        {/* METRICS PLATFORM MATRIX */}
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="p-3.5 bg-white text-indigo-600 rounded-xl shadow-sm border border-slate-100"><FaPlaceOfWorship size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Assigned Temple</p>
                <p className="font-bold text-slate-800 text-base">{event.temple_id?.name || "Unassigned / Legacy ID Data Error"}</p>
              </div>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="p-3.5 bg-white text-emerald-600 rounded-xl shadow-sm border border-slate-100"><FaCalendarAlt size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Scheduled Date</p>
                <p className="font-bold text-slate-800 text-base">{event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "Continuous / Structural"}</p>
              </div>
            </div>

            <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div className="p-3.5 bg-white text-amber-500 rounded-xl shadow-sm border border-slate-100"><FaRupeeSign size={22}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Pricing Matrix</p>
                <p className="font-black text-slate-900 text-xl">₹{(event.price || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* DESCRIPTIONS SECTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 border-t border-slate-100 pt-10">
            <div className="lg:col-span-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                <FaAlignLeft className="text-indigo-600" /> Card Summary
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100">
                {event.short_description || "No concise summary structured for this system entry."}
              </p>
            </div>
            
            <div className="lg:col-span-2">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
                <FaAlignLeft className="text-indigo-600" /> Full System Description
              </h3>
              <div className="text-slate-600 text-sm leading-relaxed bg-white border border-slate-100 p-6 rounded-2xl shadow-sm whitespace-pre-wrap font-medium">
                {event.long_description || <p className="italic text-slate-400">Detailed long form content missing from records.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}