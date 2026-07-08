// src/pages/admin/CreateTempleAdmin.jsx
import React, { useState } from "react";
import { UserPlus, Mail, Phone, Lock, Building2, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createTempleAdmin } from "../../services/adminService"; // Import the service we just made

export default function CreateTempleAdmin() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    templeId: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createTempleAdmin(formData);
      setSuccess("Temple Admin successfully provisioned and verified.");
      // Clear the form on success
      setFormData({ firstName: "", lastName: "", email: "", mobileNumber: "", password: "", templeId: "" });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to provision Temple Admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
          Provision Temple Authority
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Create and assign an operational administrator to a specific temple registry.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Status Banners */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/30 p-4 flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/30 p-4 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">First Name</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" name="firstName" required placeholder="Srikanth"
                  value={formData.firstName} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Last Name</label>
              <div className="relative">
                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" name="lastName" placeholder="Sharma"
                  value={formData.lastName} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" name="email" required placeholder="admin@temple.com"
                  value={formData.email} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" name="mobileNumber" required placeholder="9876543210"
                  value={formData.mobileNumber} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Temple Assignment */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Temple Assignment (ID)</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" name="templeId" required placeholder="e.g., 101 or TPL-54"
                  value={formData.templeId} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Temporary Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Initial Passkey</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} name="password" required placeholder="••••••••"
                  value={formData.password} onChange={handleChange}
                  className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="submit" disabled={loading}
              className="w-full md:w-auto px-8 h-12 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Provisioning...</> : 'Deploy Temple Administrator'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}