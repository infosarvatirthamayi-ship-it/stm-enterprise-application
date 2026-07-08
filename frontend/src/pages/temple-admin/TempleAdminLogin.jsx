import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTempleAdminAuth } from "../../context/TempleAdminAuthContext";
import logo from "../../assets/favicon.ico"; 
import backgroundImage from "../../assets/Admin_bg.jpg"; 

export default function TempleAdminLogin() {
  const navigate = useNavigate();
  // 🎯 Wired to Temple Admin Context
  const { templeAdmin, login, dark, setDark } = useTempleAdminAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-Redirect if already logged in as Temple Admin
  useEffect(() => {
    if (templeAdmin && Number(templeAdmin.user_type) === 2) {
      navigate("/temple-admin/dashboard", { replace: true });
    }
  }, [templeAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login({ email: email.trim().toLowerCase(), password: password.trim() });
      navigate("/temple-admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative flex items-center justify-center px-4 overflow-hidden transition-colors duration-500 ${dark ? 'dark bg-slate-950' : 'bg-slate-100'}`}>
      <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${dark ? 'opacity-40 mix-blend-overlay' : 'opacity-20'}`} style={{ backgroundImage: `url(${backgroundImage})` }} />
      <div className={`absolute inset-0 backdrop-blur-[2px] transition-colors duration-500 ${dark ? 'bg-gradient-to-br from-indigo-900/30 to-slate-950/90' : 'bg-white/40'}`} />

      <div className={`relative z-10 w-full max-w-[420px] rounded-[2.5rem] border backdrop-blur-2xl shadow-2xl p-10 transition-all duration-500 ${dark ? 'bg-white/5 border-white/10 shadow-black/50' : 'bg-white/70 border-white/50 shadow-indigo-500/10'}`}>
        
        {/* 🟠 Orange Glow specifically for Temple Portal */}
        <div className={`absolute -top-20 -left-20 w-48 h-48 rounded-full blur-[80px] transition-all duration-500 ${dark ? 'bg-orange-600 opacity-50' : 'bg-orange-400 opacity-30'}`} />

        <div className="absolute top-6 right-6 z-20">
          <button type="button" onClick={() => setDark(!dark)} className={`p-2.5 rounded-full border backdrop-blur-md transition-all active:scale-90 ${dark ? 'border-white/10 bg-white/10 text-amber-300 hover:bg-white/20' : 'border-slate-200 bg-white text-indigo-600 hover:bg-slate-50 shadow-sm'}`}>
            {dark ? <Sun size={16} strokeWidth={2.5} /> : <Moon size={16} strokeWidth={2.5} />}
          </button>
        </div>

        <div className="text-center relative z-10 mt-2">
          <img src={logo} alt="STM Logo" className="w-16 h-16 object-contain mx-auto mb-6 drop-shadow-2xl" />
          <h1 className={`text-3xl font-black tracking-tight font-serif transition-colors ${dark ? 'text-white' : 'text-slate-800'}`}>Temple Authority</h1>
          <p className={`text-[10px] mt-2 mb-8 uppercase tracking-[0.2em] font-black transition-colors ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Local Temple Operations</p>
        </div>

        {error && (
          <div className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-xs font-bold leading-relaxed shadow-inner ${dark ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-red-200 bg-red-50 text-red-600'}`}>
            <AlertCircle size={16} className={`mt-0.5 shrink-0 ${dark ? 'text-red-400' : 'text-red-500'}`} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-2">
            <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ml-1 transition-colors ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Email Classification</label>
            <input type="email" placeholder="templeadmin@stmclub.com" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full h-14 px-5 rounded-2xl border outline-none transition-all font-bold focus:ring-2 focus:ring-indigo-500/50 ${dark ? 'bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 focus:border-indigo-500' : 'bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 shadow-inner'}`} />
          </div>

          <div className="space-y-2">
            <label className={`block text-[10px] uppercase tracking-[0.2em] font-black ml-1 transition-colors ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Security Passkey</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full h-14 pl-5 pr-12 rounded-2xl border outline-none transition-all font-bold tracking-widest focus:ring-2 focus:ring-indigo-500/50 ${dark ? 'bg-black/20 border-white/10 text-white placeholder:text-white/20 focus:bg-black/40 focus:border-indigo-500' : 'bg-white/50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 shadow-inner'}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute top-1/2 right-4 -translate-y-1/2 transition-colors ${dark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-indigo-600'}`}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-[0.98] disabled:opacity-60 mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-orange-500/20`}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : <><ShieldCheck size={16} /> Authorize Access</>}
          </button>
        </form>
      </div>
    </div>
  );
}