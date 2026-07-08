// src/pages/user/STMClub/JoinNow.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext";
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import { 
  ChevronDown, MapPin, ShieldCheck, ArrowRight, 
  Sparkles, CreditCard, Calendar, AlertCircle, RefreshCcw
} from "lucide-react";

export default function JoinNow() {
  const navigate = useNavigate();
  
  // 🎯 Production Standard: Only rely on Context State, NEVER localStorage
  const { user, authenticated, loading: authLoading } = useUserAuth(); 
  const { isDarkMode: dark } = useTheme(); 
  
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [membership, setMembership] = useState(null);
  const [showTiers, setShowTiers] = useState(false); 
  
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);

  const isExpired = membership?.end_date ? new Date(membership.end_date) < new Date() : false;
  const isMember = membership && !isExpired;

  // 🛡️ The Bulletproof Bouncer (No localStorage)
  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast.error("Please log in to view Sovereign Plans.", { id: "auth-guard" });
      navigate("/user/login", { state: { from: "/user/stm-club" } }); 
    }
  }, [navigate, authLoading, authenticated]);

  // 🛡️ Isolated Promises for Initialization
  useEffect(() => {
    const fetchInitialData = async () => {
      // 🎯 Safety check using Context state
      if (!authenticated) return; 

      try {
        const [plansRes, memRes] = await Promise.allSettled([
          api.get("/web/membership-plans/active"),
          api.get("/web/membership/my-card")
        ]);

        if (plansRes.status === "fulfilled" && (plansRes.value.data.success || plansRes.value.data.status === "true")) {
          const fetchedPlans = plansRes.value.data.data?.data || plansRes.value.data.data || [];
          setPlans(fetchedPlans);
          if (fetchedPlans.length > 0) setSelectedPlan(fetchedPlans[0]);
        }
        
        if (memRes.status === "fulfilled" && (memRes.value.data.success || memRes.value.data.status === "true")) {
          setMembership(memRes.value.data.data);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (!authLoading && authenticated) {
      fetchInitialData();
    }
  }, [authLoading, authenticated]);

  const handleProceed = () => {
    if (membership && !isExpired && !showTiers) {
      return navigate("/membership-card");
    }
    if (!selectedPlan) return toast.error("Please select a premium tier to continue.");

    navigate("/join-club/premium", { 
      state: { planId: selectedPlan._id || selectedPlan.id, selectedPlan, isRenewal: isExpired } 
    });
  };

  // 🛡️ Suspense UI
  if (authLoading || (loading && authenticated)) {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-slate-400 font-serif animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster position="top-center" />
      
      <section className="pt-32 pb-16 text-center px-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
          <Sparkles size={14} /> The Sarvatirthamayi Experience
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight">
          Elevate Your <span className="text-purple-600">Sacred</span> Presence
        </h1>
      </section>

      <main className="max-w-7xl mx-auto px-4">
        <section className="mb-24 flex flex-col items-center">
          {membership && !showTiers ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className={`relative w-full max-w-md p-8 rounded-[2.5rem] border-2 shadow-2xl transition-all overflow-hidden ${
                isExpired ? 'bg-red-500/5 border-red-500/30' : 'bg-gradient-to-br from-purple-900 to-slate-900 border-purple-500/30 text-white'
              }`}
            >
              <div className="absolute -right-12 -bottom-12 opacity-10 rotate-12 pointer-events-none">
                <CreditCard size={240} />
              </div>

              <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-black opacity-60">Status</p>
                  <h3 className={`text-2xl font-serif font-bold mt-1 ${isExpired ? 'text-red-500' : 'text-white'}`}>
                    {isExpired ? "Membership Expired" : membership.membership_name || "Active Member"}
                  </h3>
                </div>
                {isExpired ? <AlertCircle className="text-red-500" /> : <ShieldCheck className="text-purple-400" size={32} />}
              </div>

              <div className="space-y-5 mb-10 relative z-10">
                {membership.end_date && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5"><Calendar size={18} className="text-purple-400" /></div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50 font-bold tracking-wider">Valid Until</p>
                      <p className="text-sm font-bold">{new Date(membership.end_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <button onClick={handleProceed} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${isExpired ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/25'}`}>
                  {isExpired ? "Renew Now" : "Access Digital Pass"}
                  <ArrowRight size={16} />
                </button>
                <button onClick={() => setShowTiers(true)} className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">
                  <RefreshCcw size={12} className="inline mr-2" /> View Other Plans
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl text-center">
              <h2 className="text-2xl font-serif font-bold mb-8">
                {membership ? "Upgrade Your Tier" : "Select Your Sovereign Tier"}
              </h2>
              <div className="relative mb-6">
                <select 
                  disabled={loading || plans?.length === 0}
                  value={selectedPlan?._id || selectedPlan?.id || ""} 
                  onChange={(e) => setSelectedPlan(plans.find(p => String(p._id || p.id) === String(e.target.value)))}
                  className={`w-full appearance-none border-2 rounded-2xl px-6 py-5 font-bold outline-none transition-colors cursor-pointer ${dark ? 'bg-slate-800 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-200 shadow-xl focus:border-purple-400'}`}
                >
                  {loading && <option value="">Loading Plans...</option>}
                  {!loading && plans?.length === 0 && <option value="">No Plans Available</option>}
                  
                  {plans?.map(p => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name} — ₹{p.price} ({p.duration} {p.duration_type === 2 ? 'Years' : 'Months'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
              </div>
              <button 
                onClick={handleProceed} 
                disabled={loading || plans?.length === 0}
                className="w-full max-w-md py-6 rounded-2xl bg-purple-600 text-white font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-2xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExpired ? "Renew Membership" : "Secure Access"}
              </button>
              {membership && (
                <button onClick={() => setShowTiers(false)} className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-colors">Cancel & Return</button>
              )}
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}