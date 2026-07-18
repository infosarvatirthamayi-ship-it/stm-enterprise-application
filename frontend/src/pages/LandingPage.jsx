// src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Element } from "react-scroll";
import { useUserAuth } from "../context/UserAuthContext";
import { useTheme } from "../context/ThemeContext"; 
import api from "../api/api";
import { toast, Toaster } from "react-hot-toast";

import { 
  ShieldCheck, ArrowRight, Eye, Target, 
  CreditCard, Sparkles, CheckCircle2, Crown, Gift 
} from "lucide-react";

import Navbar from "../components/Navbar";
import SectionHeading from "../components/SectionHeading";
import SectionDivider from "../components/SectionDivider";

import heroBg from "../assets/hero-bg.jpg";
import sankalpImg from "../assets/event-banner.png";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, authenticated, loading: authLoading } = useUserAuth(); 
  const { isDarkMode } = useTheme(); 
  const ENABLE_MEMBERSHIP = false;
  const [plans, setPlans] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Fetch Plans from Public Endpoint
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/web/membership-plans/active");
        if (res.data.success || res.data.status === "true") {
          setPlans(res.data.data?.data || res.data.data || []);
        }
      } catch (err) {
        console.error("LandingPage: Failed to fetch Sovereign plans", err);
      }
    };
    fetchPlans();
  }, []);

  // 2. Plan Carousel Auto-Timer
  useEffect(() => {
    if (plans.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % plans.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [plans]);

  // 🛡️ 3. Refined Routing Gatekeeper
  const handleSTMClubClick = (e) => {
    e.preventDefault(); 
    
    if (authLoading) {
      return toast.loading("Checking secure connection...", { id: "auth-check" });
    }

    // Checking strictly based on session/cookie state (Context is SSR-safe)
    if (authenticated || user) {
      toast.dismiss("auth-check");
      navigate("/user/stm-club");
    } else {
      toast.dismiss("auth-check");
      toast("Authenticate to unlock Sovereign Plans.", { 
        icon: "🗝️", 
        id: "vault-login",
        style: { 
          borderRadius: '10px', 
          background: isDarkMode ? '#1e293b' : '#fff', 
          color: isDarkMode ? '#fff' : '#0f172a' 
        }
      });
      navigate("/user/login", { state: { from: "/user/stm-club" } });
    }
  };

  return (
    <div className={`transition-colors duration-700 overflow-x-hidden ${isDarkMode ? 'bg-[#0a0a1a] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />
      <Toaster position="top-center" />

      {/* --- HERO SECTION --- */}
      <Element name="home">
        <section className="relative h-screen flex items-center justify-center px-6 overflow-hidden">
          <motion.div 
            initial={{ scale: 1.1 }} 
            animate={{ scale: 1 }} 
            transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          <div className={`absolute inset-0 z-[1] ${isDarkMode ? 'bg-[#0a0a1a]/80' : 'bg-black/50'} backdrop-blur-[2px]`} />

          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-4xl text-center"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] shadow-xl"
            >
              <Sparkles size={14} /> Tradition Meets Technology
            </motion.span>
            
            <h1 className="text-6xl md:text-8xl font-serif font-bold leading-tight mb-8 text-white drop-shadow-2xl tracking-tight">
              Sarvatirthamayi
            </h1>
            
            <p className="text-lg md:text-xl font-medium mb-12 text-white/80 max-w-2xl mx-auto leading-relaxed tracking-wide">
              Bridging the gap between the divine and the devotee, 
              connecting rituals and spirituality worldwide through highly secure digital infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              {ENABLE_MEMBERSHIP && (
  <button
    onClick={handleSTMClubClick}
    className="px-12 py-5 bg-purple-600 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:bg-purple-500 hover:shadow-[0_0_60px_rgba(147,51,234,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase text-xs tracking-[0.2em]"
  >
    Enter the Club
  </button>
)}
              {/* NEW: Ritual Services Primary Button */}
  <Link
    to="/user/rituals"
    className="px-12 py-5 bg-orange-600 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(234,88,12,0.4)] hover:bg-orange-500 hover:shadow-[0_0_60px_rgba(234,88,12,0.6)] hover:-translate-y-1 transition-all duration-300 uppercase text-xs tracking-[0.2em] text-center"
  >
    Ritual Services
  </Link>
              <Link
                to="/user/temples"
                className="px-12 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black rounded-2xl hover:bg-white hover:text-slate-900 transition-all duration-300 uppercase text-xs tracking-[0.2em]"
              >
                Explore Destinations
              </Link>
            </div>
          </motion.div>
        </section>
      </Element>

      {/* --- ABOUT SUMMARY SECTION --- */}
      <Element name="about-summary" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Text & Features */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-10"
          >
            <div>
              <SectionHeading title="About Us" /> 
              <SectionDivider />
            </div>
            
            <p className={`text-xl leading-relaxed font-light ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <strong className="font-bold text-purple-600 dark:text-purple-400">Sarvatirthamayi</strong> is more than a platform; it's a secure digital sanctuary designed to reconnect the modern seeker with ancient spiritual heritage using enterprise-grade transparency.
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {["Temple Culture", "Digital Connectivity", "Secure Fulfillment", "Vedic Authenticity"].map((item, i) => (
                <div 
                  key={i} 
                  className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-1 cursor-default ${
                    isDarkMode ? 'bg-slate-900/50 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-lg'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDarkMode ? 'bg-purple-900/30 group-hover:bg-purple-600/30' : 'bg-purple-50 group-hover:bg-purple-100'
                  }`}>
                    <CheckCircle2 className="text-purple-600 dark:text-purple-400" size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-sm tracking-wide">{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button 
                onClick={() => navigate('/about')}
                className="group flex items-center gap-3 font-black text-purple-600 dark:text-purple-400 uppercase text-xs tracking-[0.2em] hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
              >
                Read Our Story 
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300 ease-out" />
              </button>
            </div>
          </motion.div>

          {/* Right Column: Vision & Mission Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
             <div className="absolute -inset-10 bg-gradient-to-tr from-purple-600/15 via-transparent to-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
             
             <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
                <VisionCard 
                  icon={<Eye />} 
                  title="Our Vision" 
                  color="bg-purple-600 text-white" 
                  desc="Fostering a world where every seeker has seamless, secure access to spiritual guidance and divine connection." 
                />
                
                <div className="sm:ml-12 lg:ml-16">
                  <VisionCard 
                    icon={<Target />} 
                    title="Our Mission" 
                    color={isDarkMode ? "bg-slate-900 border border-slate-800 text-white" : "bg-white border border-slate-100 text-slate-900"} 
                    desc="To preserve ancient sanctuaries and provide transparent, highly secure digital infrastructure for sacred rituals." 
                  />
                </div>
             </div>
          </motion.div>
        </div>
      </Element>

      {/* --- MEMBERSHIP (STM CLUB) SECTION --- 
      <section className={`py-32 px-6 relative overflow-hidden ${isDarkMode ? 'bg-[#0f172a]' : 'bg-slate-100'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center bg-slate-950 rounded-[3rem] p-10 md:p-20 shadow-2xl relative overflow-hidden border border-white/5">
            
            
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[50%] -right-[20%] w-[800px] h-[800px] bg-gradient-to-b from-amber-500/10 via-purple-500/10 to-transparent blur-[80px] rounded-full pointer-events-none" 
            />
            {ENABLE_MEMBERSHIP && (
              <>
            
            <div className="lg:col-span-6 space-y-8 relative z-10">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-400/10 border border-amber-400/20 backdrop-blur-md">
                <Crown className="text-amber-400" size={16} />
                <span className="text-amber-400 font-black uppercase tracking-[0.25em] text-[10px]">Sovereign Access</span>
              </div>
              
              <h2 className="text-5xl md:text-7xl font-serif font-bold leading-tight italic text-white drop-shadow-sm">
                The STM Club
              </h2>
              
              <p className="text-slate-300 text-lg max-w-lg leading-relaxed font-light">
                Step into the inner circle. Gain priority access to annual temple visits, personalized pooja fulfillment, and your exclusive, cryptographically secure digital pass.
              </p>
              
              <div className="pt-6">
                {ENABLE_MEMBERSHIP && (
                <button 
                  onClick={handleSTMClubClick} 
                  className="group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-amber-500 to-amber-300 text-slate-900 font-black rounded-2xl uppercase text-[11px] tracking-widest overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(251,191,36,0.2)]"
                >
                  <span className="absolute inset-0 w-full h-full bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
                  {authenticated ? "Enter My Dashboard" : "Become a Member"}
                </button>
              )}
              </div>
            </div>

            
            <div className="lg:col-span-6 relative h-[450px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {plans.length > 0 ? (
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-sm p-12 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 text-center shadow-2xl relative overflow-hidden group z-10"
                  >
                    
                    <motion.div
                      animate={{ x: ['-150%', '250%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                      className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 z-0 pointer-events-none"
                    />

                    <div className="relative z-10">
                      <h4 className="text-amber-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                        {plans[currentIndex]?.name}
                      </h4>
                      
                      <div className="text-6xl font-black text-white mb-8 font-serif tracking-tight drop-shadow-lg flex items-start justify-center">
                        <span className="text-3xl text-white/50 mt-1.5 mr-1 font-sans">₹</span>
                        {Number(plans[currentIndex]?.price).toLocaleString('en-IN')}
                      </div>
                      
                      <div className="inline-flex items-center justify-center gap-3 w-full py-4 bg-amber-500/10 border border-amber-400/20 rounded-2xl text-amber-400 text-xs font-black uppercase tracking-[0.15em] mb-10">
                        <Gift size={16} /> 
                        <span>{plans[currentIndex]?.total_visits || plans[currentIndex]?.visits} Sacred Visits</span>
                      </div>
                      
                      <button onClick={handleSTMClubClick} className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto">
                        View Plan Benefits <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-white/30 font-black uppercase tracking-[0.2em] animate-pulse z-10 flex flex-col items-center gap-3">
                    <ShieldCheck size={32} className="text-white/20" />
                    Loading Sovereign Tiers...
                  </div>
                )}
              </AnimatePresence>
            </div>
            </>
            )}
          </div>
        </div>
      </section>
      */}

      {/* --- DIVINE SERVICES --- */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <SectionHeading title="Divine Fulfillment" />
          <SectionDivider />
          
          <div className="mt-16 max-w-lg mx-auto group">
            <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl cursor-pointer">
              <img src={sankalpImg} alt="Sankalp" className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent opacity-90" />
              
              <div className="absolute bottom-12 left-12 right-12 text-left">
                <span className="bg-purple-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase mb-5 inline-block tracking-[0.2em]">Featured Service</span>
                <h3 className="text-4xl font-serif font-bold text-white mb-3 italic">Sankalp Pooja</h3>
                <p className="text-white/70 text-sm mb-8 leading-relaxed font-medium">Personalized rituals performed in your name at powerful energy centers across India with secure digital evidence.</p>
                
                <button onClick={() => navigate('/user/rituals')} className="flex items-center gap-3 text-amber-400 font-black uppercase text-[10px] tracking-[0.2em] group-hover:gap-5 transition-all">
                  Book Your Ritual <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function VisionCard({ icon, title, desc, color }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`p-10 md:p-12 rounded-[3rem] shadow-xl transition-all duration-300 hover:shadow-2xl ${color}`}
    >
      <div className="mb-8 opacity-90">
        {React.cloneElement(icon, { size: 40 })}
      </div>
      <h3 className="text-3xl font-bold mb-5 font-serif italic">{title}</h3>
      <p className="leading-relaxed text-sm font-medium opacity-80">{desc}</p>
    </motion.div>
  );
}