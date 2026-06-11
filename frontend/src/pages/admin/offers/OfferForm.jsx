import React, { useState, useEffect } from "react";
import { FaImage, FaSpinner } from "react-icons/fa";

// 🎯 Notice the added props: temples, rituals, events
export default function OfferForm({ initialData, onSubmit, loading, temples = [], rituals = [], events = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    coupon_code: "",
    description: "",
    temple_id: "",
    type: 1, 
    reference_id: "",
    discount_type: "percentage", 
    discount_percentage: "",
    discount_amount: "",
    threshold_enabled: false,
    threshold_amount: 0,
    sequence: 0,
    status: 1,
    valid_from: "",
    valid_to: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        valid_from: initialData.valid_from ? new Date(initialData.valid_from).toISOString().split('T')[0] : "",
        valid_to: initialData.valid_to ? new Date(initialData.valid_to).toISOString().split('T')[0] : "",
        discount_type: initialData.discount_amount ? "flat" : "percentage",
        discount_percentage: initialData.discount_percentage || "",
        discount_amount: initialData.discount_amount || "",
        threshold_enabled: initialData.threshold_enabled || false,
        threshold_amount: initialData.threshold_amount || 0,
        coupon_code: initialData.coupon_code || "",
        sequence: initialData.sequence || 0,
        image: null 
      });
      if (initialData.image) {
        setImagePreview(initialData.image.startsWith('http') ? initialData.image : `http://localhost:5000${initialData.image}`);
      }
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-8">
      
      {/* IDENTIFICATION */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Core Identification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Offer Title <span className="text-rose-500">*</span></label>
            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/5" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Coupon Code</label>
            <input type="text" name="coupon_code" value={formData.coupon_code} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-indigo-100 bg-indigo-50/50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-black text-indigo-700 uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/5" placeholder="AUTO OR ENTER CODE" />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Display Sequence Order</label>
            <input type="number" name="sequence" required value={formData.sequence} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5" />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Description / Terms</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/5" rows="3"></textarea>
          </div>
        </div>
      </div>

      {/* TARGETING SCOPE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Targeting Scope (System Matrix)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SCOPE CONFIG TYPE */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Target Scope Type <span className="text-rose-500">*</span></label>
            <select 
              name="type" 
              required 
              value={formData.type} 
              onChange={(e) => setFormData(prev => ({ ...prev, type: Number(e.target.value), reference_id: "" }))} 
              className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
            >
              <option value={1}>Global / Temple Wide</option>
              <option value={2}>Specific Ritual</option>
              <option value={3}>Specific Event</option>
              <option value={5}>Donations</option>
            </select>
          </div>

          {/* DYNAMIC TEMPLE DROP LIST SELECTION */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Target Temple Location <span className="text-rose-500">*</span></label>
            <select
              name="temple_id"
              required
              value={formData.temple_id}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
            >
              <option value="">-- Select Location --</option>
              {temples?.map((temple) => (
                <option key={temple._id} value={temple.sql_id}>
                  {temple.name} (ID: {temple.sql_id})
                </option>
              ))}
            </select>
          </div>

          {/* CONTEXT-DRIVEN REFERENCE MODULE SELECTOR */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Service Reference Module <span className="text-rose-500">*</span></label>
            
            {Number(formData.type) === 1 ? (
              <select
                name="reference_id"
                required
                value={formData.reference_id}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-400 focus:ring-4 focus:ring-indigo-500/5"
              >
                <option value="0">Global Application Wide (0)</option>
              </select>
            ) : Number(formData.type) === 2 ? (
              <select
                name="reference_id"
                required
                value={formData.reference_id}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
              >
                <option value="">-- Select Ritual --</option>
                {rituals?.map((r) => (
                  <option key={r._id} value={r.sql_id}>{r.name} (SQL: {r.sql_id})</option>
                ))}
              </select>
            ) : Number(formData.type) === 3 ? (
              <select
                name="reference_id"
                required
                value={formData.reference_id}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer"
              >
                <option value="">-- Select Event --</option>
                {events?.map((e) => (
                  <option key={e._id} value={e.sql_id}>{e.name} (SQL: {e.sql_id})</option>
                ))}
              </select>
            ) : (
              <input 
                type="number" 
                name="reference_id" 
                required 
                value={formData.reference_id} 
                onChange={handleChange} 
                className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5" 
                placeholder="Enter Donation Project SQL ID" 
              />
            )}
          </div>

        </div>
      </div>

      {/* FINANCIALS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Financial Deductions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Discount Architecture</label>
            <select name="discount_type" value={formData.discount_type} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5 cursor-pointer">
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Deduction Value <span className="text-rose-500">*</span></label>
            <input type="number" name={formData.discount_type === 'percentage' ? 'discount_percentage' : 'discount_amount'} required value={formData.discount_type === 'percentage' ? formData.discount_percentage : formData.discount_amount} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-indigo-100 bg-indigo-50/30 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-black text-indigo-600 focus:ring-4 focus:ring-indigo-500/5" />
          </div>
        </div>
      </div>

      {/* THRESHOLD LOGIC */}
      <div className={`p-6 sm:p-8 rounded-3xl shadow-sm border transition-all ${formData.threshold_enabled ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200/80'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Cart Threshold Logic</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Require a minimum cart value before applying this discount.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name="threshold_enabled" checked={formData.threshold_enabled} onChange={handleChange} className="sr-only peer" />
            <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 shadow-inner"></div>
          </label>
        </div>
        {formData.threshold_enabled && (
          <div className="mt-6 pt-6 border-t border-amber-100/50">
            <label className="text-[10px] font-black uppercase text-amber-700 block mb-2">Minimum Threshold Value (₹) <span className="text-rose-500">*</span></label>
            <input type="number" name="threshold_amount" min="1" required value={formData.threshold_amount} onChange={handleChange} className="w-full max-w-md h-12 px-4 rounded-xl border border-amber-200 bg-white focus:border-amber-400 outline-none transition-all text-sm font-black text-amber-600 focus:ring-4 focus:ring-amber-500/10" />
          </div>
        )}
      </div>

      {/* DATES & MEDIA */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/80">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">Dates & Status</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Valid From <span className="text-rose-500">*</span></label>
                  <input type="date" name="valid_from" required value={formData.valid_from} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Valid To <span className="text-rose-500">*</span></label>
                  <input type="date" name="valid_to" required value={formData.valid_to} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-none transition-all text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/5" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input type="checkbox" name="status" checked={formData.status === 1} onChange={(e) => setFormData({...formData, status: e.target.checked ? 1 : 0})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                <span className="text-sm font-bold text-slate-700">Set Campaign to Active</span>
              </label>
            </div>
            
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Promotional Asset</h2>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200/80 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative overflow-hidden group h-40">
                {imagePreview ? (
                  <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="Preview Banner" />
                ) : (
                  <div className="text-center">
                    <FaImage className="text-3xl text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">Click to upload graphic</p>
                  </div>
                )}
                <input type="file" name="image" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">Change Image</span>
                </div>
              </div>
            </div>
         </div>
      </div>

      <button type="submit" disabled={loading} className="w-full h-14 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-md shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0">
        {loading ? <FaSpinner className="animate-spin text-lg" /> : "Save Configuration"}
      </button>

    </form>
  );
}