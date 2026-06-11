import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { FaArrowLeft, FaSave, FaImage, FaSpinner, FaChevronRight } from "react-icons/fa";

export default function AddEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [temples, setTemples] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    temple_id: "",
    name: "",
    short_description: "",
    long_description: "",
    date: "",
    price: "",
    status: 1,
    image: null,
  });

  useEffect(() => {
    const fetchPlatformTemplesList = async () => {
      try {
        // Enforce large record limits to cleanly guarantee collection visibility inside selectors
        const res = await api.get("/admin/temples?limit=1000");
        
        let packagedPayload = [];
        if (res.data && Array.isArray(res.data.data)) {
          packagedPayload = res.data.data;
        } else if (res.data && Array.isArray(res.data.temples)) {
          packagedPayload = res.data.temples;
        } else if (Array.isArray(res.data)) {
          packagedPayload = res.data;
        }
        
        setTemples(packagedPayload);
      } catch (err) {
        toast.error("Unstable core network connection: failed to read dependency datasets");
      }
    };
    fetchPlatformTemplesList();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("System storage allocation boundaries deny files > 5MB");
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.temple_id) return toast.error("An operational validation link requires a distinct temple entity mapping choice.");
    if (formData.price < 0) return toast.error("Negative pricing units are incompatible structural entries.");

    setLoading(true);
    const multiPartFormPayload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        multiPartFormPayload.append(key, formData[key]);
      }
    });

    try {
      await api.post("/admin/events", multiPartFormPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Event structured record committed successfully.");
      setTimeout(() => navigate("/admin/event"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Execution engine failed transaction commit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
        <Link to="/admin/event" className="hover:text-indigo-600 transition-colors">Events</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Register New Entity Node</span>
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
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create New System Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Assign Target Temple Context <span className="text-rose-500">*</span></label>
              <select 
                name="temple_id" 
                required 
                value={formData.temple_id}
                onChange={handleInputChange} 
                className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all cursor-pointer"
              >
                <option value="" disabled>-- Bind Platform Temple Entity --</option>
                {temples.map((t) => (
                  <option key={t._id || t.sql_id} value={t._id || t.sql_id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Event Structural Title <span className="text-rose-500">*</span></label>
              <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800 transition-all" placeholder="e.g. Annual Diwali Deepotsav Celebration" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Calendar Execution Date <span className="text-rose-500">*</span></label>
              <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 transition-all" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Base Cost Ticket Pricing (₹) <span className="text-rose-500">*</span></label>
              <input type="number" name="price" min="0" required value={formData.price} onChange={handleInputChange} className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-indigo-600 transition-all" placeholder="0" />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Concise Summary Text <span className="text-rose-500">*</span></label>
              <textarea name="short_description" required value={formData.short_description} onChange={handleInputChange} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-600 transition-all" rows="2" placeholder="Provide a summary descriptive line optimized for card views..."></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Comprehensive Informational Data Payload <span className="text-rose-500">*</span></label>
              <textarea name="long_description" required value={formData.long_description} onChange={handleInputChange} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-600 transition-all" rows="5" placeholder="Document thorough schedules, processes, historical values, rules..."></textarea>
            </div>

            <div className="md:col-span-2 bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Upload Event Cover Graphic Asset</label>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-32 h-32 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Temporary Local Preview" />
                  ) : (
                    <FaImage className="text-4xl text-slate-300" />
                  )}
                </div>
                <div className="flex-1 w-full">
                  <input type="file" required onChange={handleImageChange} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-bold hover:file:bg-indigo-700 cursor-pointer transition-all" />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Standard dimensions requirement values: 1200x600 structural aspect aspect ratios. Cap: 5MB maximum boundaries.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 h-14 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel and Purge Form State</button>
            <button type="submit" disabled={loading} className="flex-1 h-14 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <FaSpinner className="animate-spin text-xl" /> : <><FaSave className="text-lg" /> Publish System Record</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}