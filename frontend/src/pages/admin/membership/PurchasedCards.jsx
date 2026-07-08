// src/pages/admin/membership/PurchasedCards.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CreditCard, User, ShieldCheck } from 'lucide-react';
import api from "../../../api/api";
import { toast, Toaster } from 'react-hot-toast';
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function PurchasedCards() {
    const navigate = useNavigate();
    const { dark } = useAdminAuth();
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', cardStatus: 'All', paymentStatus: 'All', page: 1, limit: 10 });
    const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 0 });

    const fetchPurchasedCards = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = {
                page: filters.page, limit: filters.limit,
                search: filters.search.trim(),
                cardStatus: filters.cardStatus, paymentStatus: filters.paymentStatus
            };
            const response = await api.get('/admin/purchased-memberships', { params: queryParams });
            if (response.data.success) {
                setData(response.data.data);
                setPagination({ totalRecords: response.data.totalRecords || 0, totalPages: response.data.totalPages || 1 });
            }
        } catch (error) { toast.error("Failed to load records"); } 
        finally { setLoading(false); }
    }, [filters]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => fetchPurchasedCards(), 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters.search, filters.cardStatus, filters.paymentStatus, filters.page, fetchPurchasedCards]);

    const resetFilters = () => setFilters({ search: '', cardStatus: 'All', paymentStatus: 'All', page: 1, limit: 10 });

    const getCardStatusBadge = (status) => {
        const s = Number(status);
        const styles = {
            0: "bg-slate-500/10 text-slate-500 border-slate-500/20", 
            1: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", 
            2: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
        const labels = { 0: "INACTIVE", 1: "ACTIVE", 2: "EXPIRED" };
        return <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border uppercase ${styles[s] || styles[0]}`}>{labels[s] || "UNKNOWN"}</span>;
    };

    const getPaymentStatusBadge = (status) => {
        const s = Number(status);
        const styles = {
            1: "bg-amber-500/10 text-amber-500 border-amber-500/20", 
            2: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", 
            3: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        };
        const labels = { 1: "PENDING", 2: "PAID", 3: "FAILED" };
        return <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border uppercase ${styles[s] || styles[1]}`}>{labels[s] || "PENDING"}</span>;
    };

    const inputClass = `px-5 py-3.5 rounded-xl border outline-none text-sm font-bold transition-all focus:border-indigo-500 ${dark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'}`;

    return (
        <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
            <Toaster />
            <div className="mb-8">
                <h1 className={`text-3xl font-black font-serif flex items-center gap-3 tracking-tight ${dark ? 'text-white' : 'text-slate-800'}`}>
                    <ShieldCheck className="text-indigo-500" size={32} /> Subscription Ledger
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-2">Membership Management &gt; Sales Records</p>
            </div>

            <div className={`p-5 rounded-[2rem] shadow-sm mb-8 border ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Search by Order ID or Member..." className={`w-full pl-12 ${inputClass}`} value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))} />
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-3 w-full lg:w-auto">
                        <select className={`flex-1 md:w-44 ${inputClass} cursor-pointer`} value={filters.cardStatus} onChange={(e) => setFilters(prev => ({...prev, cardStatus: e.target.value, page: 1}))}>
                            <option value="All">All Statuses</option><option value="1">Active</option><option value="0">Inactive</option><option value="2">Expired</option>
                        </select>
                        <select className={`flex-1 md:w-44 ${inputClass} cursor-pointer`} value={filters.paymentStatus} onChange={(e) => setFilters(prev => ({...prev, paymentStatus: e.target.value, page: 1}))}>
                            <option value="All">All Payments</option><option value="1">Pending</option><option value="2">Paid</option><option value="3">Failed</option>
                        </select>
                        <button onClick={resetFilters} className="flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 rounded-xl hover:bg-rose-500 hover:text-white transition-colors w-full md:w-auto">
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className={`rounded-[2rem] shadow-sm border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className={`text-[9px] uppercase font-black tracking-widest border-b ${dark ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            <tr>
                                <th className="p-6">Member Identity</th>
                                <th className="p-6">Assigned Tier</th>
                                <th className="p-6 text-center">Visits</th>
                                <th className="p-6 font-bold">Total Paid</th>
                                <th className="p-6 text-center font-bold">Status Matrix</th>
                                <th className="p-6 text-center font-bold">Action</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${dark ? 'divide-slate-800 text-slate-300' : 'divide-slate-50 text-slate-600'}`}>
                            {loading ? (
                                <tr><td colSpan="6" className="p-20 text-center"><div className="animate-spin h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 mx-auto"></div></td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="p-20 text-center text-sm font-bold italic opacity-50">No records found matching criteria.</td></tr>
                            ) : data.map((item) => (
                                <tr key={item._id} className={`hover:bg-indigo-500/5 transition-colors ${dark ? 'hover:bg-indigo-500/10' : ''}`}>
                                    <td className="p-6">
                                        <div className={`font-bold text-sm ${dark ? 'text-white' : 'text-slate-800'}`}>{item.user_id?.name || 'Unknown Entity'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1"><User size={10}/> {item.user_id?.mobile_number || '-'}</div>
                                    </td>
                                    <td className="p-6">
                                        <div className={`flex items-center gap-3 font-bold text-sm ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><CreditCard size={14} /></div>
                                            {item.membership_card_id?.name || 'Sovereign Pass'}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest shadow-sm">
                                            {item.used_visits ?? 0} / {item.max_visits ?? 0}
                                        </span>
                                    </td>
                                    <td className="p-6"><span className={`text-lg font-black ${dark ? 'text-emerald-400' : 'text-emerald-600'}`}>₹{item.paid_amount?.toLocaleString() || 0}</span></td>
                                    <td className="p-6">
                                        <div className="flex flex-col items-center gap-2">
                                            {getCardStatusBadge(item.card_status)}
                                            {getPaymentStatusBadge(item.payment_status)}
                                        </div>
                                    </td>
                                    <td className="p-6 text-center">
                                        <button onClick={() => navigate(`/admin/purchased-member-card/view/${item._id}`)} className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"><Eye size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={`p-5 flex flex-col sm:flex-row justify-between items-center border-t gap-4 ${dark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Showing {data.length} of {pagination.totalRecords} Ledgers</div>
                    <div className="flex items-center gap-2">
                        <button disabled={filters.page === 1} onClick={() => setFilters(p => ({...p, page: 1}))} className={`p-2 rounded-xl disabled:opacity-30 ${dark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}><ChevronsLeft size={16}/></button>
                        <button disabled={filters.page === 1} onClick={() => setFilters(p => ({...p, page: p.page - 1}))} className={`p-2 rounded-xl disabled:opacity-30 ${dark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}><ChevronLeft size={16}/></button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-4 py-2 bg-indigo-500/10 rounded-xl mx-1">Page {filters.page}</span>
                        <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(p => ({...p, page: p.page + 1}))} className={`p-2 rounded-xl disabled:opacity-30 ${dark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}><ChevronRight size={16}/></button>
                        <button disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(p => ({...p, page: pagination.totalPages}))} className={`p-2 rounded-xl disabled:opacity-30 ${dark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}><ChevronsRight size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}