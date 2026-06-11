import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { FaArrowLeft, FaSave, FaSpinner, FaChevronRight, FaImage } from "react-icons/fa";

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [temples, setTemples] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    temple_id: "",
    name: "",
    date: "",
    price: "",
    short_description: "",
    long_description: "",
    status: 1,
    image: null
  });

  useEffect(() => {
    const loadSystemData = async () => {
      try {
        const [eventRes, templeRes] = await Promise.all([
          api.get(`/admin/events/${id}`),
          api.get("/admin/temples?limit=1000")
        ]);

        const eventData = eventRes.data.data;
        
        // Defensive mapping strategy: handle populated object references or straight legacy key entries
        const targetTempleId = eventData.temple_id?._id || eventData.temple_id?.sql_id || eventData.temple_id || "";

        setFormData({
          temple_id: targetTempleId,
          name: eventData.name || "",
          date: eventData.date ? new Date(eventData.date).toISOString().split('T')[0] : "",
          price: eventData.price || 0,
          short_description: eventData.short_description || "",
          long_description: eventData.long_description || "",
          status: eventData.status ?? 1,
          image: null 
        });
        
        setImagePreview(eventData.image); 

        // Unpack structural payloads defensively
        let extractedTemples = [];
        if (templeRes.data && Array.isArray(templeRes.data.data)) {
          extractedTemples = templeRes.data.data;
        } else if (templeRes.data && Array.isArray(templeRes.data.temples)) {
          extractedTemples = templeRes.data.temples;
        } else if (Array.isArray(templeRes.data)) {
          extractedTemples = templeRes.data;
        }
        setTemples(extractedTemples);
        
      } catch (err) {
        toast.error("Failed to safely bundle event contexts");
        navigate("/admin/event");
      } finally {
        setFetching(false);
      }
    };
    
    loadSystemData();
  }, [id, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Asset payload cap exceeded (Max 5MB limits)");
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.temple_id) return toast.error("Please identify a specific temple relation.");
    if (formData.price < 0) return toast.error("Financial values cannot be negative configurations.");
    
    setLoading(true);
    
    const operationalData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'image' && !formData.image) return; // Prevent overwriting with missing raw payloads during standard mutations
      if (formData[key] !== null && formData[key] !== "") {
        operationalData.append(key, formData[key]);
      }
    });

    try {
      await api.put(`/admin/events/update/${id}`, operationalData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Event settings mutated correctly.");
      setTimeout(() => navigate(`/admin/event`), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Platform exception during write processing");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
        <Link to="/admin/event" className="hover:text-indigo-600 transition-colors">Events</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Modify Data Node</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 hover:text-indigo-600 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Edit Event Record</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Temple Anchor Relational Link</label>
              <select 
                required 
                value={formData.temple_id} 
                onChange={e => setFormData({...formData, temple_id: e.target.value})} 
                className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer"
              >
                <option value="" disabled>-- Bind Platform Temple Entity --</option>
                {temples.map((t) => (
                  <option key={t._id || t.sql_id} value={t._id || t.sql_id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Event Title</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Target Operating Date</label>
              <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all" />
            </div>
            
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Base Cost Amount (₹)</label>
              <input type="number" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-indigo-600 transition-all" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">System Visibility Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: Number(e.target.value)})} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all">
                <option value={1}>Active Configuration (Live Visibility)</option>
                <option value={0}>Inactive (Hidden Database Record)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Card Summary Text</label>
              <textarea required value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-600 transition-all" rows="2"></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Comprehensive Deep Profile Breakdown</label>
              <textarea required value={formData.long_description} onChange={e => setFormData({...formData, long_description: e.target.value})} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-600 transition-all" rows="5"></textarea>
            </div>

            <div className="md:col-span-2 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Mutate System Binary Cover Asset</label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview Banner" />
                  ) : (
                    <FaImage className="text-4xl text-slate-300" />
                  )}
                </div>
                <div className="flex-1 w-full">
                  <input type="file" onChange={handleImageChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-bold hover:file:bg-indigo-700 cursor-pointer transition-all" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Leave completely pristine to preserve the primary storage configuration paths.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Abort Modifications</button>
            <button type="submit" disabled={loading} className="flex-1 h-14 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <FaSpinner className="animate-spin text-xl" /> : <><FaSave className="text-lg" /> Push Data Mutations</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}