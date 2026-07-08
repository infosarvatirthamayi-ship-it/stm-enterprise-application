// src/pages/user/STMClub/JoinClub.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext";
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, X, Loader2 } from "lucide-react";

export default function JoinClub() {
  const { user, authenticated, loading: authLoading } = useUserAuth();
  const { isDarkMode: dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const selectedPlan = location.state?.selectedPlan;
  const [temples, setTemples] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ 
    birthday: "", 
    importantDate: "", 
    favoriteTemples: [] 
  });

  const isComplete = formData.favoriteTemples.length === 5 && formData.birthday && formData.importantDate;

  // 🛡️ Route Protection (Bouncer)
  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast.error("Please login to access the Vault.");
      navigate('/user/login', { state: { from: '/user/stm-club' } });
    } else if (!authLoading && authenticated && !selectedPlan) {
      toast.error("Please select a plan first.");
      navigate('/user/stm-club');
    }
  }, [authLoading, authenticated, selectedPlan, navigate]);

  // 🏛️ Fetch Available Temples
  useEffect(() => {
    if (!selectedPlan || !authenticated) return;

    const fetchTemples = async () => {
      try {
        const res = await api.get("/web/temples");
        if (res.data.success || res.data.status === "true") {
          setTemples(res.data.data);
        }
      } catch (err) {
        toast.error("Failed to load sacred destinations.");
      }
    };
    fetchTemples();
  }, [selectedPlan, authenticated]);

  const availableTemples = useMemo(() => {
    return temples.filter(t => !formData.favoriteTemples.includes(t.name));
  }, [temples, formData.favoriteTemples]);

  const handleTempleSelect = (e) => {
    if (isProcessing) return;
    const val = e.target.value;
    if (!val) return;
    if (formData.favoriteTemples.length >= 5) {
      return toast.error("You have reached the 5-temple limit.");
    }
    setFormData(prev => ({ ...prev, favoriteTemples: [...prev.favoriteTemples, val] }));
  };

  const removeTemple = (name) => {
    if (isProcessing) return;
    setFormData(prev => ({ 
      ...prev, 
      favoriteTemples: prev.favoriteTemples.filter(t => t !== name) 
    }));
  };

  const handlePayment = async () => {
    if (!isComplete) return toast.error("Please complete all fields to proceed.");
    setIsProcessing(true);
    
    try {
      // 🎯 Calling the BFF Web Gateway for Razorpay Order Generation
      const { data: orderRes } = await api.post("/web/membership/create-order", {
        planId: selectedPlan._id || selectedPlan.id
      });
      
      const paymentData = orderRes.data.payment || orderRes.data;

      const options = {
        key: paymentData.razorpay_public_key || import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: Number(paymentData.paid_amount || selectedPlan.price) * 100, // Amount in paise
        currency: "INR",
        name: "Sarvatirthamayi Club",
        description: `Activation: ${selectedPlan.name}`,
        order_id: paymentData.razorpay_order_id,
        handler: async (response) => {
          const verifyToast = toast.loading("Confirming your digital legacy...");
          try {
            // 🎯 Calling the BFF Web Gateway for Fulfillment Hook
            const { data: verifyRes } = await api.post("/web/membership/verify-payment", {
              ...response,
              ...formData,
              planId: selectedPlan._id || selectedPlan.id
            });

            if (verifyRes.success || verifyRes.status === "true") {
              toast.success("Welcome to the Inner Circle!", { id: verifyToast });
              navigate("/membership-card", { state: { cardData: verifyRes.data || verifyRes } });
            } else {
               throw new Error(verifyRes.message || "Verification failed");
            }
          } catch (err) {
            toast.error(err.response?.data?.message || "Payment verification failed.", { id: verifyToast });
            setIsProcessing(false); 
          }
        },
        prefill: { 
            name: user?.first_name || user?.name || "", 
            email: user?.email || "",
            contact: user?.mobile_number || "" 
        },
        theme: { color: "#9333ea" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         toast.error(response.error.description || "Payment failed.");
         setIsProcessing(false);
      });
      rzp.open();
    } catch (error) {
      setIsProcessing(false);
      toast.error(error.response?.data?.message || "Secure gateway connection failed.");
    }
  };

  const cardClass = `rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"}`;
  const inputClass = `w-full p-4 rounded-2xl border-2 outline-none transition-all ${dark ? "bg-slate-800 border-slate-700 text-white focus:border-purple-500" : "bg-slate-50 border-slate-200 focus:border-purple-400"}`;

  // Prevent rendering if not ready
  if (authLoading || (!authenticated && !selectedPlan)) return null;

  return (
    <div className={`min-h-screen pb-20 ${dark ? 'bg-[#0b0f1a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-center" />
      <div className={`relative pt-32 pb-48 px-6 text-center ${dark ? 'bg-[#0b0f1a]' : 'bg-purple-700'}`}>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-2 tracking-tight">Personalize Your Card</h1>
        <p className="text-white/70 uppercase tracking-widest text-xs font-bold">Selected Plan: {selectedPlan?.name}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <div className={cardClass}>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Edit3 size={20} className="text-purple-500" /> Sacred Details
                </h2>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selection</span>
                   <span className={`text-xl font-black ${formData.favoriteTemples.length === 5 ? 'text-green-500' : 'text-purple-600'}`}>
                     {formData.favoriteTemples.length}/5
                   </span>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                    <input disabled={isProcessing} type="date" max={new Date().toISOString().split("T")[0]} className={inputClass} value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Significant Anniversary</label>
                    <input disabled={isProcessing} type="date" max={new Date().toISOString().split("T")[0]} className={inputClass} value={formData.importantDate} onChange={(e) => setFormData({...formData, importantDate: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Choose Your 5 Destinations</label>
                  <select disabled={isProcessing || formData.favoriteTemples.length >= 5} className={inputClass} onChange={handleTempleSelect} value="">
                    <option value="">{formData.favoriteTemples.length >= 5 ? "Selection Complete" : "Search destinations..."}</option>
                    {availableTemples.map(t => <option key={t._id || t.id} value={t.name}>{t.name}</option>)}
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <AnimatePresence mode="popLayout">
                      {formData.favoriteTemples.map((name) => {
                        const t = temples.find(item => item.name === name);
                        return (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key={name} className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                            <div className="flex items-center gap-3">
                              <img src={getFullImageUrl(t?.image)} className="w-12 h-12 rounded-xl object-cover" alt="" crossOrigin="anonymous"/>
                              <span className="text-xs font-black uppercase">{name}</span>
                            </div>
                            {!isProcessing && (
                              <button onClick={() => removeTemple(name)} className="text-slate-400 hover:text-red-500 p-2 transition-colors"><X size={18}/></button>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className={`${cardClass} p-8 sticky top-28`}>
              <h4 className="text-lg font-bold mb-6 font-serif">Membership Review</h4>
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between text-slate-500"><span>Selected Plan</span><b className="text-slate-900 dark:text-white">{selectedPlan?.name}</b></div>
                <div className="flex justify-between text-slate-500"><span>Validity</span><b className="text-slate-900 dark:text-white">{selectedPlan?.duration} {selectedPlan?.duration_type === 1 ? 'Month' : 'Year'}(s)</b></div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                   <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Total Investment</p>
                   <p className="text-3xl font-black font-serif mt-1">₹{selectedPlan?.price}</p>
                </div>
              </div>
              <button 
                onClick={handlePayment} 
                disabled={!isComplete || isProcessing}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all duration-300 ${isComplete ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-500/25 active:scale-[0.98]' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}`}
              >
                {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Activate Membership"}
              </button>
              <p className="mt-5 text-[9px] text-center text-slate-400 uppercase font-bold tracking-widest leading-relaxed">
                Temples cannot be modified once the membership is activated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}