// src/pages/admin/membership/ViewPurchasedCard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, CreditCard, Calendar, IndianRupee, Hash, MapPin, Clock, Activity } from 'lucide-react';
import api from "../../../api/api";
import { toast, Toaster } from 'react-hot-toast';
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function ViewPurchasedCard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { dark } = useAdminAuth();
    
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCardDetails = async () => {
            try {
                const response = await api.get(`/admin/purchased-memberships/${id}`);
                if (response.data.success) setCard(response.data.data);
            } catch (error) { 
                toast.error("Failed to load details"); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchCardDetails();
    }, [id]);

    // Safe Date Formatter
    const formatDate = (dateString) => {
        if (!dateString) return 'Pending';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return (
        <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
            <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-indigo-500">Decrypting Pass...</p>
        </div>
    );

    if (!card) return (
        <div className="p-20 text-center">
            <p className="text-rose-500 font-black text-xl mb-4">Record Not Found.</p>
            <button onClick={() => navigate(-1)} className="text-indigo-500 font-bold hover:underline">Return to Ledger</button>
        </div>
    );

    const pz = card.personalization || {};
    const maxVisits = card.max_visits || 0;
    const usedVisits = card.used_visits || 0;
    const remainingVisits = Math.max(0, maxVisits - usedVisits);
    const usagePercent = maxVisits > 0 ? (usedVisits / maxVisits) * 100 : 0;

    const statusColors = {
        1: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        0: "bg-slate-500/10 text-slate-500 border-slate-500/20",
        2: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    };

    return (
        <div className={`p-4 md:p-8 min-h-screen font-sans transition-colors ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
            <Toaster />
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 mb-2 text-xs font-black uppercase tracking-widest transition-colors">
                        <ChevronLeft size={16} /> Return to Ledger
                    </button>
                    <h1 className={`text-3xl font-black font-serif ${dark ? 'text-white' : 'text-slate-800'}`}>Encrypted Digital Pass</h1>
                </div>
                <div className={`px-5 py-2.5 rounded-xl border text-[10px] font-black tracking-[0.2em] uppercase shadow-sm inline-flex items-center justify-center ${statusColors[card.card_status]}`}>
                    {card.card_status === 1 ? 'ACTIVE PASS' : card.card_status === 2 ? 'EXPIRED PASS' : 'PENDING ACTIVATION'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Identity & Preferences */}
                <div className="lg:col-span-2 space-y-8">
                    <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className={`p-6 border-b flex items-center gap-3 ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                            <div className="p-2 bg-indigo-500/20 rounded-lg"><User size={16} className="text-indigo-500" /></div>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-700'}`}>Identity Matrix</h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Devotee Name</label><p className={`text-lg font-bold mt-1 ${dark ? 'text-white' : 'text-slate-800'}`}>{card.user_id?.name || 'N/A'}</p></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comm Link (Mobile)</label><p className={`text-lg font-bold mt-1 font-mono tracking-wider ${dark ? 'text-white' : 'text-slate-800'}`}>{card.user_id?.mobile_number || 'N/A'}</p></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date of Birth</label><p className="text-slate-500 font-bold mt-1">{formatDate(pz.birthday)}</p></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sacred Anniversary</label><p className="text-slate-500 font-bold mt-1">{formatDate(pz.anniversary)}</p></div>
                        </div>
                    </div>

                    <div className={`rounded-[2rem] border shadow-sm overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className={`p-6 border-b flex items-center gap-3 ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                            <div className="p-2 bg-indigo-500/20 rounded-lg"><MapPin size={16} className="text-indigo-500" /></div>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${dark ? 'text-white' : 'text-slate-700'}`}>Sanctuary Preferences</h2>
                        </div>
                        <div className="p-8 flex flex-wrap gap-3">
                            {pz.selected_temples?.length > 0 ? (
                                pz.selected_temples.map((temple, idx) => (
                                    <span key={idx} className="px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 text-xs font-black uppercase tracking-widest shadow-sm">
                                        {temple}
                                    </span>
                                ))
                            ) : (<p className="text-slate-500 italic font-medium">No preferred sanctuaries registered.</p>)}
                        </div>
                    </div>
                </div>

                {/* 2. Cryptographic Pass & Telemetry */}
                <div className="space-y-8">
                    
                    {/* The Pass */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-600 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-indigo-400/30">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <CreditCard size={40} className="text-indigo-200" />
                            <div className="text-right">
                                <p className="text-[9px] font-black text-indigo-300 tracking-[0.3em] uppercase mb-1">Tier</p>
                                <p className="text-2xl font-black font-serif tracking-wide">{card.membership_card_id?.name || 'Standard'}</p>
                            </div>
                        </div>

                        {/* 🎯 Smart Discount Display */}
                        {card.membership_card_id?.discount_percentage > 0 && (
                            <div className="relative z-10 mb-8 inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest shadow-sm">
                                    {card.membership_card_id.discount_percentage}% Darshan Discount Active
                                </span>
                            </div>
                        )}

                        <div className="space-y-6 relative z-10">
                            <div>
                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Digital Signature</p>
                                <p className="font-mono text-sm tracking-[0.2em] opacity-90">STM-{card._id.toString().slice(-10).toUpperCase()}</p>
                            </div>
                            <div className="flex justify-between items-end border-t border-indigo-400/30 pt-6 mt-6">
                                <div>
                                    <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Activated</p>
                                    <p className="font-bold text-sm">{formatDate(card.start_date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Expires</p>
                                    <p className="font-bold text-sm">{formatDate(card.end_date)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Usage Telemetry */}
                    <div className={`rounded-[2rem] border shadow-sm p-8 space-y-6 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Activity size={14} className="text-indigo-500"/> Visit Telemetry
                            </h3>
                            <span className="text-xs font-black text-indigo-500">{usedVisits} / {maxVisits}</span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                        </div>
                        <p className={`text-xs font-bold text-right ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {remainingVisits} Visits Remaining
                        </p>
                    </div>

                    {/* Financial Ledger */}
                    <div className={`rounded-[2rem] border shadow-sm p-8 space-y-5 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Financial Ledger</h3>
                        <div className={`flex items-center justify-between py-3 border-b ${dark ? 'border-slate-800' : 'border-slate-50'}`}>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Hash size={14} /> Gateway ID</div>
                            <span className={`text-[11px] font-mono tracking-wider ${dark ? 'text-white' : 'text-slate-700'}`}>{card.razorpay_order_id || 'N/A'}</span>
                        </div>
                        <div className={`flex items-center justify-between py-3 border-b ${dark ? 'border-slate-800' : 'border-slate-50'}`}>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><Clock size={14} /> Settled On</div>
                            <span className={`text-xs font-bold ${dark ? 'text-white' : 'text-slate-700'}`}>
                                {formatDate(card.payment_date || card.created_at)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase"><IndianRupee size={14} /> Cleared Value</div>
                            <span className="text-2xl font-black text-emerald-500">₹{card.paid_amount?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    );
}