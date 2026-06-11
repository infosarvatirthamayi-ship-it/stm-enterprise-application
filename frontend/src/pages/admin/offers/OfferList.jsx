import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/api";
import { 
  FaPlus, FaEye, FaEdit, FaTrash, FaSearch, FaChevronRight, 
  FaChevronLeft, FaImage, FaPlaceOfWorship, FaLink, FaInbox, FaSpinner
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";

export default function OfferList() {
  const navigate = useNavigate();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10); 

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/offers?page=${currentPage}&limit=${limit}&search=${searchTerm}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      setOffers(data);
      setTotalPages(res.data?.totalPages || Math.ceil((res.data?.total || 0) / limit) || 1);
    } catch (error) {
      toast.error("Failed to load offers");
      setOffers([]); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely erase this offer?")) return;
    try {
      await api.delete(`/admin/offers/${id}`);
      toast.success("Offer deleted successfully");
      
      if (offers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete offer");
    }
  };

  const getTypeName = (type) => {
    const types = { 1: "GLOBAL", 2: "RITUAL", 3: "EVENT", 5: "DONATION" };
    return types[type] || "SERVICE";
  };

  const getPaginationGroup = () => {
    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages = [1];
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      
      pages.push(totalPages);
    }
    return pages;
  };

  if (loading && offers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mb-4" />
        <p className="text-slate-500 font-bold animate-pulse tracking-widest text-sm uppercase">Loading Promotional Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <Toaster />

      {/* BREADCRUMBS */}
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
        <Link to="/admin/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Offers Hub</span>
      </nav>

      {/* HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Active Offers</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm text-slate-500 font-medium">System Promotional Engine</span>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm border border-indigo-100/50">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/admin/offer/create")}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <FaPlus size={14} /> Deploy Offer
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by offer name, coupon code, or temple..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/5"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
          />
        </div>
      </div>

      {/* DATA TABLE */}
      {offers.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          {/* 🎯 Removed global whitespace-nowrap to prevent UI stretching/scrolling */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left table-auto">
              <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-500 font-black tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 whitespace-nowrap">Image & Campaign</th>
                  <th className="px-6 py-5 whitespace-nowrap">Deployment Scope</th>
                  <th className="px-6 py-5 whitespace-nowrap">Value Drop</th>
                  <th className="px-6 py-5 whitespace-nowrap w-20">Seq</th>
                  <th className="px-6 py-5 text-center whitespace-nowrap w-32">Status</th>
                  <th className="px-6 py-5 text-right whitespace-nowrap w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {offers.map((offer) => {
                  const isExpired = new Date() > new Date(offer.valid_to);
                  const imageUrl = offer.image 
                    ? (offer.image.startsWith('http') ? offer.image : `http://localhost:5000${offer.image}`) 
                    : null;

                  return (
                    <tr key={offer._id} className="hover:bg-slate-50/60 transition-colors group">
                      
                      {/* IMAGE & TITLE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-sm">
                            {imageUrl ? (
                              <img src={imageUrl} alt={offer.name} className="w-full h-full object-cover" />
                            ) : (
                              <FaImage size={18} className="text-slate-300" />
                            )}
                          </div>
                          {/* 🎯 Max-width ensures long titles wrap cleanly instead of stretching table */}
                          <div className="min-w-[200px] max-w-[300px]">
                            <p className="font-bold text-slate-800 text-sm leading-tight truncate">{offer.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5" title={offer.description}>
                              {offer.coupon_code ? <span className="font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded mr-1">{offer.coupon_code}</span> : null}
                              {offer.description || "Auto-Applied Discount"}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      {/* SCOPE & NAMES */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start min-w-[180px] max-w-[250px]">
                          <span className="text-[9px] font-black bg-slate-700 text-white px-2 py-0.5 rounded shadow-sm tracking-widest">
                            {getTypeName(offer.type)}
                          </span>
                          <span className="text-xs text-slate-700 font-bold flex items-center gap-1.5 truncate w-full">
                            <FaPlaceOfWorship className="text-indigo-400 shrink-0"/> 
                            <span className="truncate">{offer.temple_name || `Temple ID: ${offer.temple_id}`}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 truncate w-full">
                            <FaLink className="text-slate-300 shrink-0"/> 
                            <span className="truncate">{offer.reference_name || `Ref ID: ${offer.reference_id}`}</span>
                          </span>
                        </div>
                      </td>

                      {/* DISCOUNT */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {offer.discount_percentage ? (
                          <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm border border-emerald-100 shadow-sm">
                            {offer.discount_percentage}% OFF
                          </span>
                        ) : (
                          <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm border border-indigo-100 shadow-sm">
                            ₹{offer.discount_amount} CUT
                          </span>
                        )}
                      </td>
                      
                      {/* SEQUENCE */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-slate-500 font-bold text-sm bg-slate-50 px-3 py-1 rounded-md border border-slate-100 shadow-sm">
                          {offer.sequence || 0}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                          offer.status === 1 && !isExpired 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          {offer.status === 1 && !isExpired ? "Live" : isExpired ? "Expired" : "Halted"}
                        </span>
                      </td>
                      
                      {/* ACTIONS */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => navigate(`/admin/offer/view/${offer._id}`)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm rounded-lg transition-all" title="View Details">
                            <FaEye size={14}/>
                          </button>
                          <button onClick={() => navigate(`/admin/offer/edit/${offer._id}`)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm rounded-lg transition-all" title="Edit Configuration">
                            <FaEdit size={14}/>
                          </button>
                          <button onClick={() => handleDelete(offer._id)} className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 hover:shadow-sm rounded-lg transition-all" title="Purge Record">
                            <FaTrash size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-16 border border-slate-100 text-center text-slate-400 shadow-sm">
          <FaInbox size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="font-bold text-sm text-slate-500">No promotional campaigns found in the database.</p>
        </div>
      )}

      {/* 🎯 SMART PAGINATION MATRIX */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
            className="w-9 h-9 border bg-white rounded-lg hover:bg-slate-100 hover:text-indigo-600 text-slate-400 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center shadow-sm"
          >
            <FaChevronLeft size={10} />
          </button>
          
          {getPaginationGroup().map((p, i) => (
            <button 
              key={i} 
              onClick={() => typeof p === 'number' && setCurrentPage(p)} 
              disabled={typeof p !== 'number'}
              className={`min-w-[36px] h-9 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center
                ${currentPage === p ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 border border-indigo-600' : ''}
                ${typeof p === 'number' && currentPage !== p ? 'bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 text-slate-500 shadow-sm' : ''}
                ${typeof p !== 'number' ? 'bg-transparent text-slate-400 cursor-default' : ''}
              `}
            >
              {p}
            </button>
          ))}

          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
            className="w-9 h-9 border bg-white rounded-lg hover:bg-slate-100 hover:text-indigo-600 text-slate-400 transition-all disabled:opacity-50 disabled:hover:bg-white flex items-center justify-center shadow-sm"
          >
            <FaChevronRight size={10} />
          </button>
        </div>
      )}
    </div>
  );
}