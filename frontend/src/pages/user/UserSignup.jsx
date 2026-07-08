import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiPhone, FiMail, FiLock, FiCheckCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiChevronLeft } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import api from "../../api/api";
import { useUserAuth } from "../../context/UserAuthContext.jsx";

export default function UserSignup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🌍 Country Code State
  const [countryCode, setCountryCode] = useState("+91");
  const [registeredFullMobile, setRegisteredFullMobile] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    raw_mobile: "",
    password: "",
    otp: ""
  });

  useEffect(() => {
    if (!authLoading && user) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (formData.password.length < 6) return setError("Password must be at least 6 characters.");
    if (formData.raw_mobile.length < 7) return setError("Enter a valid mobile number.");

    const fullMobileNumber = `${countryCode}${formData.raw_mobile.trim()}`;

    setLoading(true);
    try {
      const { data } = await api.post("/user/signup", {
        first_name: formData.first_name.trim(),
        email: formData.email.toLowerCase().trim(),
        mobile_number: fullMobileNumber,
        password: formData.password
      });

      if (data.success) {
        setRegisteredFullMobile(fullMobileNumber);
        setStep(2);
        setTimer(30);
        setCanResend(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (formData.otp.length !== 6) return setError("Enter the 6-digit verification code.");
    
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/user/verify-otp", {
        mobile_number: registeredFullMobile,
        otp: formData.otp.trim()
      });

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate("/user/login", { 
            state: { mobile: registeredFullMobile, message: "Verification successful! Please log in." },
            replace: true 
          });
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await api.post("/user/resend-otp", { mobile_number: registeredFullMobile });
      setTimer(30);
      setCanResend(false);
      setError("");
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-purple-600" size={40} />
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-slate-50 flex flex-col items-center font-sans overflow-x-hidden selection:bg-purple-200">
      
      {/* 🖼️ CURVED PURPLE HEADER WITH TEMPLE IMAGE OVERLAY */}
      <div className="absolute top-0 left-0 w-full h-[35vh] sm:h-[40vh] bg-purple-900 rounded-b-[3rem] sm:rounded-b-[4rem] overflow-hidden z-0">
        {/* The Temple Image with Opacity */}
        <img 
            src="/assets/event-banner.png" 
            alt="Temple Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 to-purple-800/60 mix-blend-multiply" />
      </div>

      {/* 🔙 TOP NAVIGATION (Matches Screenshot) */}
      <div className="relative z-20 w-full max-w-md px-6 pt-8 flex justify-between items-center text-white">
        <Link to="/" className="flex items-center gap-2 text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
            <FiChevronLeft size={18} /> Back
        </Link>
        <span className="font-serif font-bold text-xl tracking-wide">STM Club</span>
      </div>

      {/* 🪟 OVERLAPPING WHITE CARD */}
      <div className="relative z-10 w-full max-w-md px-4 pt-12 pb-8 flex-1 flex flex-col">
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-8 w-full"
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              /* --- SUCCESS VIEW --- */
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-serif text-slate-900 mb-2">Account Verified!</h2>
                <p className="text-slate-500 text-sm">Redirecting you to the login screen...</p>
              </motion.div>
            ) : step === 1 ? (
              /* --- STEP 1: SIGNUP FORM --- */
              <motion.div key="signup" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-serif text-slate-900 mb-2">Create Account</h2>
                  <p className="text-slate-500 font-medium text-sm">Please fill in your details to join.</p>
                </div>
                
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" /> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-5">
                  
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <input type="text" placeholder="John Doe" required className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 focus:bg-white transition-all text-slate-900 text-sm sm:text-base" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <input type="email" placeholder="name@example.com" required className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 focus:bg-white transition-all text-slate-900 text-sm sm:text-base" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>

                  {/* Mobile Number with Country Code Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="relative w-[30%]">
                          <select 
                              value={countryCode} 
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full px-2 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 transition-all text-slate-700 text-sm sm:text-base appearance-none cursor-pointer text-center font-medium"
                          >
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+61">🇦🇺 +61</option>
                              <option value="+971">🇦🇪 +971</option>
                          </select>
                      </div>
                      
                      <div className="relative group w-[70%]">
                          <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                          <input 
                              type="tel" 
                              placeholder="98765 43210" 
                              required 
                              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 focus:bg-white transition-all text-slate-900 text-sm sm:text-base" 
                              value={formData.raw_mobile} 
                              onChange={(e) => setFormData({...formData, raw_mobile: e.target.value.replace(/\D/g, '')})} 
                          />
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" required className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-purple-500 focus:bg-white transition-all text-slate-900 text-sm sm:text-base [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2 hover:bg-purple-800 transition-all active:scale-[0.98] disabled:opacity-70">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>Create Account <FiArrowRight /></>}
                  </button>
                </form>

                <div className="mt-8 text-center pt-6">
                    <p className="text-slate-500 font-medium text-sm">
                    Already a member? <Link to="/user/login" className="text-purple-600 font-bold hover:underline ml-1">Sign In</Link>
                    </p>
                </div>
              </motion.div>
            ) : (
              /* --- STEP 2: OTP VERIFICATION --- */
              <motion.div key="otp" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><FiMail size={40} /></div>
                  <h2 className="text-3xl font-serif text-slate-900 mb-2">Verify Mobile</h2>
                  <p className="text-slate-500 text-sm">We've sent a 6-digit code to <br /><span className="text-purple-700 font-bold tracking-wide">{registeredFullMobile}</span></p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input 
                    type="text" 
                    maxLength="6" 
                    placeholder="0 0 0 0 0 0" 
                    className="w-full text-center text-3xl tracking-[0.5rem] font-bold py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl outline-none focus:border-purple-500 focus:border-solid focus:bg-white transition-all text-slate-900" 
                    value={formData.otp}
                    onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/[^0-9]/g, '')})} 
                    required 
                  />
                  
                  <button disabled={loading} className="w-full py-4 bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 hover:bg-purple-800 transition-all active:scale-[0.98]">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verify & Register"}
                  </button>

                  <div className="space-y-6 pt-4">
                    <p className="text-sm text-slate-500">
                      Didn't receive the code? <br />
                      {canResend ? (
                        <button type="button" onClick={handleResendOtp} className="text-purple-600 font-bold hover:underline transition-colors mt-1">Resend Now</button>
                      ) : (
                        <span className="text-slate-400 font-medium">Resend available in <span className="text-purple-600">{timer}s</span></span>
                      )}
                    </p>
                    <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-sm text-slate-400 mx-auto hover:text-purple-600 transition-colors">
                        <FiArrowLeft /> Edit Details
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}