import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  CheckCircle, Home, Calendar, User, 
  Sparkles, ArrowRight, ShieldCheck 
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext";

export default function BookingSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  
  const { receiptUrl, ritualName, bookingDetails } = location.state || {};

  useEffect(() => {
    if (!receiptUrl) {
      const timer = setTimeout(() => navigate("/user/rituals"), 3000);
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [receiptUrl, navigate]);

  if (!receiptUrl) {
    return (
      <div className={`h-screen flex flex-col items-center justify-center text-center font-sans ${dark ? 'bg-slate-900' : 'bg-[#f8fafc]'}`}>
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <h2 className={`text-lg font-black tracking-tight mb-1 ${dark ? 'text-slate-200' : 'text-slate-700'}`}>Verifying State</h2>
        <p className={`text-sm font-medium mb-6 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Redirecting to active services...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-hidden relative font-sans transition-colors duration-300 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />

      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-24 md:py-32 text-center flex flex-col justify-center min-h-screen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`rounded-[3rem] p-8 md:p-14 shadow-2xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
        >
          <div className="mb-6 relative inline-block">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="relative p-5 bg-emerald-500/10 text-emerald-500 rounded-full"
            >
              <CheckCircle size={64} strokeWidth={2} />
            </motion.div>
            <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-pulse" size={20} />
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
            Ritual Confirmed
          </h1>
          
          <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-black uppercase tracking-widest text-[9px] mb-8">
            <ShieldCheck size={12} /> Sankalpa Registered Successfully
          </div>

          <p className={`text-sm md:text-base font-medium mb-10 max-w-md mx-auto leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-500'}`}>
            Pranams, your sacred request for <br />
            <span className="text-indigo-500 font-black text-lg block mt-1">{ritualName}</span>
            has been successfully scheduled in our system.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
            <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Primary Devotee</p>
                <div className="flex items-center gap-2 font-bold text-sm">
                    <div className={`p-1.5 rounded-md shadow-sm border ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}><User size={14} className="text-indigo-500" /></div>
                    {bookingDetails?.devoteeName}
                </div>
            </div>
            <div className={`p-4 rounded-2xl border ${dark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[9px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Scheduled Date</p>
                <div className="flex items-center gap-2 font-bold text-sm">
                    <div className={`p-1.5 rounded-md shadow-sm border ${dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-100'}`}><Calendar size={14} className="text-indigo-500" /></div>
                    {new Date(bookingDetails?.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate("/user/rituals")}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Explore More Rituals <ArrowRight size={16} />
            </button>
            
            <button 
              onClick={() => navigate("/home")}
              className={`w-full py-4 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${dark ? 'bg-transparent border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Home size={16} /> Return to Dashboard 
            </button>
          </div>

          <div className={`mt-10 pt-6 border-t opacity-40 flex items-center justify-center gap-2 grayscale ${dark ? 'border-slate-700' : 'border-slate-100'}`}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-3" />
              <span className="text-[8px] font-black uppercase tracking-widest">Transaction Verified</span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}