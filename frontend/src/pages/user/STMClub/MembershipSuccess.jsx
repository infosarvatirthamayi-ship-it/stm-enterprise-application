// src/pages/user/STMClub/MembershipSuccess.jsx
import React, { useRef, useEffect, useState } from "react";
import { useUserAuth } from "../../../context/UserAuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Download, CheckCircle2, Home, Star, Loader2, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import api from "../../../api/api";
import { getFullImageUrl } from "../../../utils/config";
import { toast, Toaster } from "react-hot-toast";

export default function MembershipSuccess() {
  const { user } = useUserAuth();
  const { isDarkMode: dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const cardRef = useRef(null);
  
  const [cardData, setCardData] = useState(location.state?.cardData || null);
  const [loading, setLoading] = useState(!location.state?.cardData);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!cardData) {
      api.get("/web/membership/my-card")
        .then(res => {
          if (res.data.success || res.data.status === "true") {
             setCardData(res.data.data || res.data);
          } else {
             navigate("/user/stm-club");
          }
        })
        .catch(() => navigate("/user/stm-club"))
        .finally(() => setLoading(false));
    }
  }, [cardData, navigate]);

  const downloadCard = async () => {
    setIsDownloading(true);
    const downloadToast = toast.loading("Minting your digital legacy...");
    try {
      const element = cardRef.current;
      const canvas = await html2canvas(element, { 
        scale: 4, // High Resolution
        backgroundColor: null,
        useCORS: true,
        logging: false
      }); 
      
      const data = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = data;
      link.download = `STM-Card-${user?.first_name?.replace(/\s+/g, '-').toLowerCase() || 'member'}.png`;
      link.click();
      toast.success("Sacred Card saved securely!", { id: downloadToast });
    } catch (err) {
      toast.error("Download failed.", { id: downloadToast });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a] text-white">
      <Loader2 className="animate-spin text-purple-500" size={40} />
    </div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-20 flex flex-col items-center px-4 transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-center" />
      
      <div className="text-center mb-10">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/10 rounded-full border border-green-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
          <CheckCircle2 size={40} className="text-green-500" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">The Circle is Complete</h1>
        <p className="text-slate-500 text-sm mt-3 font-medium uppercase tracking-widest">Your digital identity is active.</p>
      </div>

      {/* --- PREMIUM CARD DESIGN START --- */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        ref={cardRef} 
        className="w-full max-w-md aspect-[1.58/1] relative rounded-[2.5rem] overflow-hidden shadow-2xl p-[1.5px] bg-gradient-to-br from-purple-400 via-indigo-600 to-slate-900"
      >
        <div className="bg-slate-950/90 backdrop-blur-xl h-full w-full rounded-[2.4rem] p-8 flex flex-col justify-between text-white relative overflow-hidden">
          
          {/* Background Aura */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/30 rounded-full blur-[60px] pointer-events-none" />

          {/* Header */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-3">
              <img 
                src="/favicon.ico" 
                className="w-10 h-10 rounded-xl shadow-lg border border-white/10" 
                alt="Logo" 
                crossOrigin="anonymous" 
              />
              <div>
                <h4 className="text-[10px] font-black tracking-[0.25em] uppercase text-slate-200">Sarvatirthamayi</h4>
                <p className="text-[8px] text-purple-400 font-bold uppercase tracking-[0.3em] mt-0.5">Premium Legacy</p>
              </div>
            </div>
            <Star size={20} className="text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" fill="currentColor" />
          </div>

          {/* Body */}
          <div className="relative z-10 mt-6">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-white/40 mb-1.5 flex items-center gap-1.5">
              <Fingerprint size={12} className="text-purple-400" /> Cardholder
            </p>
            <h3 className="text-2xl font-serif font-bold tracking-tight">{user?.first_name || user?.name || "Member"}</h3>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end relative z-10 pt-5 border-t border-white/10">
            <div>
              <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/40 mb-1.5">Digital ID</p>
              <p className="font-mono text-slate-200 text-[11px] tracking-widest uppercase">
                {cardData?.membership_card_id || cardData?._id ? `STM-${String(cardData.membership_card_id || cardData._id).slice(-8).toUpperCase()}` : "STM-VAULT"}
              </p>
            </div>
            
            {/* Sacred Places Grid */}
            <div className="flex -space-x-3">
              {cardData?.templeDetails?.slice(0, 4).map((temple, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-[3px] border-slate-950 overflow-hidden bg-slate-800 shadow-xl">
                  <img 
                    src={getFullImageUrl(temple.image)} 
                    className="w-full h-full object-cover" 
                    alt="temple"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
              {cardData?.templeDetails?.length > 4 && (
                <div className="w-8 h-8 rounded-full border-[3px] border-slate-950 bg-purple-600 flex items-center justify-center text-[9px] font-bold shadow-xl">
                  +{cardData.templeDetails.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      {/* --- PREMIUM CARD DESIGN END --- */}

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-12 flex flex-col gap-4 w-full max-w-md"
      >
        <button 
          onClick={downloadCard} 
          disabled={isDownloading} 
          className="w-full bg-purple-600 hover:bg-purple-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98]"
        >
          {isDownloading ? <Loader2 className="animate-spin" /> : <Download size={18} />} Save to Device
        </button>
        
        <button 
          onClick={() => navigate("/")} 
          className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] border-2 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 flex items-center justify-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
        >
          <Home size={16} /> Dashboard
        </button>
      </motion.div>
    </div>
  );
}