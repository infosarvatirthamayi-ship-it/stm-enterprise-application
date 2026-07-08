// src/pages/admin/membership/ViewMembership.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../api/api";
import { FaChevronRight, FaSpinner } from "react-icons/fa";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function ViewMembership() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/memberships/${id}`)
      .then((res) => { setData(res.data?.data || res.data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse text-indigo-500">Retrieving Specifications...</p>
    </div>
  );

  if (!data) return (
    <div className="p-20 text-center">
      <p className="text-rose-500 font-black text-xl mb-4">Membership Matrix Not Found.</p>
      <Link to="/admin/membership-card" className="text-indigo-500 font-bold hover:underline">Return to Ledger</Link>
    </div>
  );

  const labelClass = "text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block";
  const valueClass = `text-lg font-bold ${dark ? 'text-white' : 'text-slate-800'} block`;

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
      <div className="max-w-5xl mx-auto">
        <nav className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8">
          <Link to="/admin/membership-card" className="hover:text-indigo-500">Membership Cards</Link>
          <FaChevronRight size={8} /> <span className={dark ? 'text-slate-300' : 'text-slate-700'}>View Matrix</span>
        </nav>

        <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-8 border-b ${dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
            <h2 className={`text-2xl font-black font-serif ${dark ? 'text-white' : 'text-slate-800'}`}>Plan Specifications</h2>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12 mb-12">
              
              <div>
                <label className={labelClass}>Card Name</label>
                <span className={valueClass}>{data.name}</span>
              </div>

              <div>
                <label className={labelClass}>Operational Status</label>
                <span className={`inline-block px-3 py-1 mt-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${data.status === 1 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {data.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block">Listed Price</label>
                <span className="text-2xl font-black text-emerald-500">₹{data.price?.toLocaleString()}</span>
              </div>

              <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">Darshan Discount</label>
                <span className="text-2xl font-black text-indigo-500">{data.discount_percentage || 0}% OFF</span>
              </div>

              <div>
                <label className={labelClass}>Duration</label>
                <span className={valueClass}>{data.duration} {data.duration_type === 1 ? 'Months' : 'Years'}</span>
              </div>

              <div>
                <label className={labelClass}>Total Visits Allowed</label>
                <span className={valueClass}>{data.visits || data.total_visits || 0}</span>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Description / Benefits</label>
                <span className={`text-sm font-medium italic ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{data.description || "N/A"}</span>
              </div>
            </div>

            <div className="mb-12">
              <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 block">Designated Sanctuaries</label>
              
              <div className={`border rounded-2xl overflow-hidden ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
                {data.temples?.length > 0 ? data.temples.map((t, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-5 border-b last:border-0 transition-colors ${dark ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <span className={`text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {t.templeId?.name || t.temple_name || t.name || "Unknown Temple"}
                    </span>
                    <span className="bg-indigo-500 text-white text-[10px] font-black tracking-widest px-4 py-1.5 rounded-xl uppercase shadow-lg shadow-indigo-500/20">
                      {t.maxVisits || t.max_visits || 0} Visits
                    </span>
                  </div>
                )) : (
                  <div className={`p-6 text-center text-sm font-bold italic ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    No specific temples mapped. Subject to Global Visit Limit.
                  </div>
                )}
              </div>
            </div>

            <div className={`flex justify-end gap-4 pt-8 border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => navigate("/admin/membership-card")} className="px-8 py-4 font-bold text-slate-500 hover:text-slate-400 transition-colors">
                Back to Ledger
              </button>
              <button onClick={() => navigate(`/admin/membership/edit/${id}`)} className="bg-amber-500 hover:bg-amber-400 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95">
                Edit Specifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}