import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/api';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaArrowLeft, FaEdit, FaSpinner, FaCalendarAlt, 
  FaRupeeSign, FaPercentage, FaShieldAlt, FaTicketAlt, FaPlaceOfWorship, FaLink, FaChevronRight // 🎯 ADDED FaChevronRight HERE
} from 'react-icons/fa';

export default function OfferView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await api.get(`/admin/offers/${id}`);
        setOffer(res.data.data);
      } catch (err) {
        toast.error("Failed to fetch offer details");
        navigate("/admin/offers");
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mb-4" />
        <p className="text-slate-500 font-bold animate-pulse tracking-widest text-sm uppercase">Loading Profile...</p>
      </div>
    );
  }

  if (!offer) return null;

  const isExpired = new Date() > new Date(offer.valid_to);
  const getTypeName = (type) => {
    const types = { 1: "GLOBAL", 2: "RITUAL", 3: "EVENT", 5: "DONATION" };
    return types[type] || "SERVICE";
  };

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      
      {/* BREADCRUMBS */}
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6 max-w-5xl mx-auto">
        <Link to="/admin/offers" className="hover:text-indigo-600 transition-colors">Offers</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Offer Overview</span>
      </nav>

      {/* HEADER ACTIONS */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <button onClick={() => navigate("/admin/offers")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold uppercase text-xs tracking-widest transition-colors bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 w-full sm:w-auto justify-center">
          <FaArrowLeft /> Back to Hub
        </button>
        <button onClick={() => navigate(`/admin/offer/edit/${id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center">
          <FaEdit /> Edit Configuration
        </button>
      </div>
      
      {/* PROFILE CARD */}
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* BANNER HEADER */}
        <div className="bg-slate-900 p-8 sm:p-10 relative overflow-hidden">
          <FaTicketAlt className="absolute -right-10 -bottom-10 text-white/5 text-[200px]" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border ${offer.status === 1 && !isExpired ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-rose-500 border-rose-400 text-white'}`}>
                {offer.status === 1 && !isExpired ? 'Live Campaign' : 'Inactive / Expired'}
              </span>
              <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-indigo-500 border border-indigo-400 text-white shadow-sm">
                Code: {offer.coupon_code || "AUTO-APPLIED"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 leading-tight">{offer.name}</h1>
            <p className="text-slate-300 font-medium max-w-2xl leading-relaxed">{offer.description || "No specific terms or subtext provided for this campaign."}</p>
          </div>
        </div>

        {/* METRICS & DETAILS */}
        <div className="p-6 sm:p-10">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6">
            <FaShieldAlt className="text-indigo-600" /> Operational Parameters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* SCOPE */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Target Scope</p>
              <span className="text-[9px] font-black bg-slate-800 text-white px-2 py-0.5 rounded uppercase tracking-widest shadow-sm w-max mb-2">
                {getTypeName(offer.type)}
              </span>
              <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5 mb-1 truncate">
                <FaPlaceOfWorship className="text-indigo-400 shrink-0"/> {offer.temple_name}
              </p>
              <p className="font-medium text-slate-500 text-[11px] flex items-center gap-1.5 truncate">
                <FaLink className="text-slate-300 shrink-0"/> {offer.reference_name}
              </p>
            </div>

            {/* DISCOUNT */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Deduction Value</p>
              <p className="font-black text-emerald-600 text-2xl flex items-center gap-1 mt-1">
                {offer.discount_percentage ? <><FaPercentage size={18}/> {offer.discount_percentage}% OFF</> : <><FaRupeeSign size={18}/> {offer.discount_amount} OFF</>}
              </p>
            </div>

            {/* USAGE */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Global Usage</p>
              <p className="font-bold text-slate-800 text-lg mt-1">{offer.used_count || 0} / {offer.usage_limit || "∞"} <span className="text-sm font-medium text-slate-500">Claims</span></p>
            </div>

            {/* THRESHOLD */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Price Threshold</p>
              {offer.threshold_enabled ? (
                 <p className="font-bold text-amber-600 text-lg mt-1">Min ₹{offer.threshold_amount} Cart</p>
              ) : (
                <p className="font-bold text-slate-600 text-sm mt-1">No Minimum</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-8">
            <div className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500"><FaCalendarAlt size={20}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Campaign Start</p>
                <p className="font-bold text-slate-800">{new Date(offer.valid_from).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500"><FaCalendarAlt size={20}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Campaign End</p>
                <p className="font-bold text-slate-800">{new Date(offer.valid_to).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}