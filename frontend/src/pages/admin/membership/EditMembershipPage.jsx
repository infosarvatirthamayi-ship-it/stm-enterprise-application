// src/pages/admin/membership/EditMembershipPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FaChevronRight, FaSpinner, FaTrash } from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import api from "../../../api/api";
import { useAdminAuth } from "../../../context/AdminAuthContext";

export default function EditMembershipPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dark } = useAdminAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allTemples, setAllTemples] = useState([]); 

  const [formData, setFormData] = useState({
    name: "", status: 1, duration_type: 1, duration: 1, price: "", 
    discount_percentage: 0, visits: 1, description: "", selectedTemples: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [membRes, templesRes] = await Promise.all([
          api.get(`/admin/memberships/${id}`),
          api.get("/admin/memberships/temples-list") 
        ]);

        const m = membRes.data?.data || membRes.data;
        setAllTemples(templesRes.data || []);

        const mappedTemples = (m.temples || []).map(t => ({
          templeId: t.temple_id || t.templeId?._id || t.templeId,
          name: t.temple_name || t.name || t.templeId?.name || "Unknown Temple",
          maxVisits: t.max_visits || t.maxVisits || 1 
        }));

        setFormData({
          name: m.name || "",
          status: m.status !== undefined ? m.status : 1,
          duration_type: m.duration_type || 1,
          duration: m.duration || 1,
          price: m.price || "",
          discount_percentage: m.discount_percentage || 0,
          visits: m.visits || m.total_visits || 1,
          description: m.description || "",
          selectedTemples: mappedTemples
        });
      } catch (err) { 
        toast.error("Failed to load membership data."); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchData();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discount_percentage: Number(formData.discount_percentage),
        duration: Number(formData.duration),
        total_visits: Number(formData.visits),
        visits: Number(formData.visits),
        status: Number(formData.status),
        duration_type: Number(formData.duration_type),
        temples: formData.selectedTemples.map(t => ({
          temple_id: t.templeId,
          temple_name: t.name,
          max_visits: Number(t.maxVisits)
        }))
      };

      await api.put(`/admin/memberships/update/${id}`, payload);
      toast.success("Membership Plan Updated!");
      setTimeout(() => navigate("/admin/membership-card"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const addTemple = (e) => {
    const tId = e.target.value;
    if (!tId) return;
    if (formData.selectedTemples.some(item => item.templeId === tId)) return toast.error("Temple already added");
    const temple = allTemples.find(t => t._id === tId);
    setFormData({ ...formData, selectedTemples: [...formData.selectedTemples, { templeId: tId, name: temple.name, maxVisits: 1 }] });
  };

  const removeTemple = (idx) => setFormData({...formData, selectedTemples: formData.selectedTemples.filter((_, i) => i !== idx)});
  const updateVisits = (idx, val) => {
    const list = [...formData.selectedTemples];
    list[idx].maxVisits = Number(val);
    setFormData({...formData, selectedTemples: list});
  };

  const inputClass = `w-full border px-5 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm ${dark ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400'}`;
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block ml-1";

  if (loading) return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] gap-4 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="animate-spin h-10 w-10 rounded-full border-4 border-indigo-600/20 border-t-indigo-600" />
      <p className="text-xs font-black uppercase tracking-widest animate-pulse text-indigo-500">Decrypting File...</p>
    </div>
  );

  return (
    <div className={`min-h-screen p-4 md:p-8 font-sans transition-colors ${dark ? 'bg-[#0a0a1a]' : 'bg-[#f8fafc]'}`}>
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <nav className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">
          <Link to="/admin/membership-card" className="hover:text-indigo-500">Membership Cards</Link>
          <FaChevronRight size={8} /> <span className={dark ? 'text-slate-300' : 'text-slate-700'}>Edit Plan</span>
        </nav>

        <div className={`rounded-[2rem] shadow-2xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-8 border-b ${dark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
            <h2 className={`text-2xl font-black font-serif ${dark ? 'text-white' : 'text-slate-800'}`}>Edit Membership Plan</h2>
          </div>

          <form onSubmit={handleUpdate} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className={labelClass}>Plan Name</label>
                <input required type="text" className={inputClass} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={formData.status} onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}>
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Global Visit Limit</label>
                <input required type="number" min="1" className={inputClass} value={formData.visits} onChange={(e) => setFormData({ ...formData, visits: e.target.value })} />
              </div>

              {/* 🎯 SMART DISCOUNT ENGINE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 block ml-1">Price (INR)</label>
                  <input required type="number" min="0" className={inputClass} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 block ml-1">Darshan Discount (%)</label>
                  <input required type="number" min="0" max="100" className={inputClass} placeholder="e.g. 20" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Unit</label>
                  <select className={inputClass} value={formData.duration_type} onChange={(e) => setFormData({ ...formData, duration_type: Number(e.target.value) })}>
                    <option value={1}>Months</option>
                    <option value={2}>Years</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Length</label>
                  <input required type="number" min="1" className={inputClass} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                </div>
              </div>

              {/* Temple Assignment */}
              <div className={`md:col-span-2 border-t pt-8 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                <label className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-4 block">Assigned Temples (Optional)</label>
                <select className={inputClass} onChange={addTemple} value="">
                  <option value="">-- Add another temple --</option>
                  {allTemples.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>

                <div className="mt-4 space-y-3">
                  {formData.selectedTemples.map((temple, index) => (
                    <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border ${dark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Temple Name</span>
                        <span className={`font-bold ${dark ? 'text-white' : 'text-slate-700'}`}>{temple.name}</span>
                      </div>
                      <div className="w-24">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Visits</label>
                        <input type="number" min="1" className={inputClass} value={temple.maxVisits} onChange={(e) => updateVisits(index, e.target.value)} />
                      </div>
                      <button type="button" onClick={() => removeTemple(index)} className="text-rose-500 p-3 hover:bg-rose-500/10 rounded-xl mt-4"><FaTrash /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea rows="3" className={`${inputClass} resize-none`} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>
            </div>

            <div className={`flex justify-end gap-4 pt-8 border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-4 font-bold text-slate-500 hover:text-slate-300">Cancel</button>
              <button disabled={submitting} type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95">
                {submitting ? <FaSpinner className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}