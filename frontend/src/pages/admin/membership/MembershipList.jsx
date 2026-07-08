// src/pages/admin/membership/MembershipList.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaUndo, FaInbox, FaTimes, FaChevronRight } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import api from "../../../api/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function MembershipList() {
  const navigate = useNavigate();
  const { dark } = useAdminAuth();
  const undoTimeoutRef = useRef(null);

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/memberships");
      setMemberships(res.data?.data || res.data || []);
    } catch (err) {
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id, name) => {
    const itemToDelete = memberships.find((m) => m._id === id);
    if (!itemToDelete) return;

    // Optimistic UI Removal
    setMemberships((prev) => prev.filter((m) => m._id !== id));

    toast((t) => (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Plan <b>{name}</b> deleted.</span>
        <button
          onClick={() => {
            clearTimeout(undoTimeoutRef.current);
            setMemberships((prev) => [...prev, itemToDelete]);
            toast.dismiss(t.id);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 hover:bg-indigo-500 transition-colors"
        >
          <FaUndo size={12} /> UNDO
        </button>
      </div>
    ), { duration: 5000, position: 'bottom-right' });

    // Server execution after 5 seconds
    undoTimeoutRef.current = setTimeout(async () => {
      try { await api.delete(`/admin/memberships/${id}`); } 
      catch (error) {
        setMemberships((prev) => [...prev, itemToDelete]);
        toast.error("Could not delete from server");
      }
    }, 5000);
  };

  const filteredMemberships = useMemo(() => {
    return memberships.filter((card) => {
      const matchesSearch = card.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const statusText = card.status === 1 ? "Active" : "Inactive";
      return matchesSearch && (statusFilter === "All Status" || statusText === statusFilter);
    });
  }, [searchTerm, statusFilter, memberships]);

  if (loading) return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-indigo-500">Loading Matrix...</p>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">
        <Link to="/admin/dashboard" className="hover:text-indigo-500 transition-colors">Dashboard</Link>
        <FaChevronRight size={8} /> <span className={dark ? 'text-slate-300' : 'text-slate-700'}>Membership Cards</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-serif">Membership Plans</h1>
          <p className="text-[10px] font-black text-indigo-500 mt-2 uppercase tracking-[0.2em]">
            {filteredMemberships.length} Active Profiles
          </p>
        </div>
        <button onClick={() => navigate("/admin/membership/add")} className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-600/20 text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 w-full sm:w-auto">
          <FaPlus size={14} /> Add New Plan
        </button>
      </div>

      {/* Filters */}
      <div className={`rounded-[2rem] p-6 mb-8 shadow-sm border ${dark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search membership by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-xl border outline-none text-sm font-medium transition-all focus:border-indigo-500 ${dark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-6 py-4 rounded-xl border outline-none text-sm font-bold cursor-pointer ${dark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <option>All Status</option><option>Active</option><option>Inactive</option>
            </select>
            <button onClick={() => { setSearchTerm(""); setStatusFilter("All Status"); }} className="px-5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"><FaTimes /></button>
          </div>
        </div>
      </div>

      {filteredMemberships.length > 0 ? (
        <div className={`rounded-[2rem] shadow-sm border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={`text-[10px] uppercase font-black tracking-widest border-b ${dark ? 'bg-slate-950 text-slate-500 border-slate-800' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                <tr>
                  <th className="px-8 py-6">Card Plan</th>
                  <th className="px-8 py-6">Pricing & Perks</th>
                  <th className="px-8 py-6">Duration & Usage</th>
                  <th className="px-8 py-6 text-center">Status</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? 'divide-slate-800 text-slate-300' : 'divide-slate-50 text-slate-600'}`}>
                {filteredMemberships.map((card) => (
                  <tr key={card._id} className={`hover:bg-indigo-500/5 transition-colors group ${dark ? 'hover:bg-indigo-500/10' : ''}`}>
                    <td className="px-8 py-6">
                      <div className={`font-bold text-base ${dark ? 'text-white' : 'text-slate-800'}`}>{card.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[250px] mt-1">{card.description || "No description provided"}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xl font-black text-indigo-500 block">₹{card.price?.toLocaleString()}</span>
                      {card.discount_percentage > 0 && (
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 block">
                          {card.discount_percentage}% Darshan Discount
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold">{card.duration} {card.duration_type === 1 ? "Months" : "Years"}</div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{card.total_visits || card.visits} Visits Allowed</div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1.5 text-[9px] font-black rounded-lg tracking-widest uppercase border ${card.status === 1 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
                        {card.status === 1 ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`/admin/membership/view/${card._id}`)} className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"><FaEye size={18} /></button>
                        <button onClick={() => navigate(`/admin/membership/edit/${card._id}`)} className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><FaEdit size={18} /></button>
                        <button onClick={() => handleDelete(card._id, card.name)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><FaTrash size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST */}
          <div className={`md:hidden divide-y ${dark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {filteredMemberships.map((card) => (
              <div key={card._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`font-bold text-lg ${dark ? 'text-white' : 'text-slate-800'}`}>{card.name}</h3>
                    <span className={`mt-2 inline-block text-[9px] px-3 py-1 rounded-md font-black tracking-widest uppercase border ${card.status === 1 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>
                      {card.status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-indigo-500">₹{card.price?.toLocaleString()}</div>
                    {card.discount_percentage > 0 && (
                        <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                          {card.discount_percentage}% OFF
                        </div>
                    )}
                  </div>
                </div>

                <div className={`flex gap-6 py-4 px-5 rounded-2xl mb-5 ${dark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                  <div className="text-xs">
                    <p className="text-slate-500 font-black uppercase tracking-widest mb-1">Duration</p>
                    <p className={`font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{card.duration} {card.duration_type === 1 ? "Mo" : "Yr"}</p>
                  </div>
                  <div className="text-xs">
                    <p className="text-slate-500 font-black uppercase tracking-widest mb-1">Visits</p>
                    <p className={`font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{card.total_visits || card.visits} Total</p>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-4 border-t pt-5 border-slate-200/50">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/admin/membership/view/${card._id}`)} className={`p-3 rounded-xl transition-colors ${dark ? 'bg-slate-950 text-slate-400 hover:text-indigo-400' : 'bg-slate-50 text-slate-500 hover:text-indigo-500'}`}><FaEye size={16}/></button>
                    <button onClick={() => navigate(`/admin/membership/edit/${card._id}`)} className={`p-3 rounded-xl transition-colors ${dark ? 'bg-slate-950 text-slate-400 hover:text-blue-400' : 'bg-slate-50 text-slate-500 hover:text-blue-500'}`}><FaEdit size={16}/></button>
                  </div>
                  <button onClick={() => handleDelete(card._id, card.name)} className={`p-3 rounded-xl transition-colors ${dark ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-500'}`}><FaTrash size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`rounded-[3rem] p-20 text-center border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}><FaInbox size={40} className="text-slate-400" /></div>
          <h3 className={`text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-800'}`}>No Plans Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-8">We couldn't find any membership plans matching your criteria.</p>
        </div>
      )}
    </div>
  );
}