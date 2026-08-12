import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiPhone, FiMail, FiLock, FiCheckCircle, FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiChevronLeft, FiAlertCircle } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import api from "../../api/api";
import { useUserAuth } from "../../context/UserAuthContext.jsx";

// Helper function to convert ISO country code to flag emoji
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function UserSignup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [isSuccess, setIsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🌍 Dynamic Countries State
  const [countries, setCountries] = useState([]);
  const [fetchingCountries, setCountriesLoading] = useState(true);
  const [selectedPhoneCode, setSelectedPhoneCode] = useState("+91");
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

  // 🌍 Fetch Countries from Backend API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);
        const { data } = await api.get("/countries");
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCountries(data.data);
          const india = data.data.find(c => c.code === "IN");
          if (india) {
            setSelectedPhoneCode(india.phone_code.startsWith("+") ? india.phone_code : `+${india.phone_code}`);
          } else {
            setSelectedPhoneCode(data.data[0].phone_code.startsWith("+") ? data.data[0].phone_code : `+${data.data[0].phone_code}`);
          }
        }
      } catch (err) {
        console.error("Failed to load countries, using fallback list.", err);
        setCountries([
          { _id: 101, code: "IN", name: "India", phone_code: "+91" },
          { _id: 2, code: "US", name: "United States", phone_code: "+1" },
          { _id: 3, code: "GB", name: "United Kingdom", phone_code: "+44" },
          { _id: 4, code: "AE", name: "UAE", phone_code: "+971" }
        ]);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // 🛡️ Granular Validation Logic
  const validateForm = () => {
    const errors = {};
    if (formData.first_name.trim().length < 2) errors.first_name = "Name must be at least 2 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Please enter a valid email address.";
    if (formData.raw_mobile.trim().length < 7 || formData.raw_mobile.trim().length > 15) errors.raw_mobile = "Mobile number must be between 7 and 15 digits.";
    if (formData.password.length < 6) errors.password = "Password must be at least 6 characters.";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    
    if (!validateForm()) return;

    const cleanCode = selectedPhoneCode.startsWith("+") ? selectedPhoneCode : `+${selectedPhoneCode}`;
    const fullMobileNumber = `${cleanCode}${formData.raw_mobile.trim()}`;

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
      setGlobalError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (formData.otp.length !== 6) return setGlobalError("Enter the 6-digit verification code.");
    
    setGlobalError("");
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
      setGlobalError(err.response?.data?.message || "Invalid OTP. Please check and try again.");
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
      setGlobalError("");
    } catch (err) {
      setGlobalError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0a0a1a]">
        <Loader2 className="animate-spin text-purple-600" size={40} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0a0a1a] lg:bg-[#fcfaff] lg:dark:bg-[#0a0a1a] selection:bg-purple-200 dark:selection:bg-purple-900/50 transition-colors duration-500 relative">
      
      {/* 🖼️ Mobile Only Header */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-48 bg-purple-900 rounded-b-[40px] z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/assets/event-banner.png')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-950/80 to-transparent"></div>
      </div>

      {/* 🖼️ Desktop Split Layout */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative overflow-hidden bg-purple-950">
          <img src="/assets/event-banner.png" alt="Branding Banner" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-transparent to-purple-900/40" />
          <div className="relative z-10 flex flex-col justify-end p-16 w-full">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-5xl font-serif text-white leading-tight mb-6">Join the Community. <br /> Begin Your Journey.</h2>
                  <p className="text-purple-100/70 text-lg max-w-md">Create an account to manage your memberships, bookings, and spiritual connections.</p>
              </motion.div>
          </div>
      </div>

      <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 relative z-10">
        
        {/* Mobile Back Button */}
        <div className="w-full max-w-md mb-6 lg:hidden flex items-center justify-between text-white">
            <Link to="/" className="flex items-center gap-2 text-sm font-medium opacity-80 hover:opacity-100">
                <FiChevronLeft size={20} /> Back
            </Link>
            <span className="font-serif font-bold text-lg">STM Club</span>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 lg:bg-transparent lg:shadow-none lg:p-0 dark:bg-[#111122] lg:dark:bg-transparent">
          
          <div className="hidden lg:block mb-8">
              <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all group">
                  <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
              </Link>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-2">Account Verified!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Redirecting you to the login screen...</p>
              </motion.div>
            ) : step === 1 ? (
              <motion.div key="signup" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                <div className="mb-10 text-center lg:text-left">
                  <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-white mb-3">Create Account</h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">Please fill in your details to join.</p>
                </div>
                
                {globalError && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-500/20 flex items-center gap-3">
                        <FiAlertCircle className="shrink-0" /> {globalError}
                    </motion.div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-5">
                  
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                      <input type="text" placeholder="John Doe" className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border ${fieldErrors.first_name ? 'border-red-400 dark:border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white text-sm sm:text-base`} value={formData.first_name} onChange={(e) => { setFormData({...formData, first_name: e.target.value}); setFieldErrors({...fieldErrors, first_name: null}); }} />
                    </div>
                    {fieldErrors.first_name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.first_name}</p>}
                  </div>
                  
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                      <input type="email" placeholder="name@example.com" className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border ${fieldErrors.email ? 'border-red-400 dark:border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white text-sm sm:text-base`} value={formData.email} onChange={(e) => { setFormData({...formData, email: e.target.value}); setFieldErrors({...fieldErrors, email: null}); }} />
                    </div>
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
                  </div>

                  {/* 🎯 UNIFIED Mobile Input Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                    <div className={`flex items-center w-full bg-slate-50 dark:bg-slate-900/50 border ${fieldErrors.raw_mobile ? 'border-red-400 dark:border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl focus-within:border-purple-500 dark:focus-within:border-purple-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all overflow-hidden`}>
                      
                      {/* Unified Dropdown */}
                      <select 
                          value={selectedPhoneCode} 
                          onChange={(e) => setSelectedPhoneCode(e.target.value)}
                          disabled={fetchingCountries}
                          className="w-[35%] pl-3 pr-1 py-3.5 bg-transparent border-r border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 text-xs sm:text-sm appearance-none cursor-pointer truncate disabled:opacity-50 font-medium"
                      >
                          {fetchingCountries ? (
                            <option value="+91">Loading...</option>
                          ) : (
                            countries.map((c) => {
                              const formattedCode = c.phone_code.startsWith("+") ? c.phone_code : `+${c.phone_code}`;
                              return (
                                <option key={c._id || c.code} value={formattedCode}>
                                  {getFlagEmoji(c.code)} {c.name} ({formattedCode})
                                </option>
                              );
                            })
                          )}
                      </select>
                      
                      {/* Unified Input */}
                      <input 
                          type="tel" 
                          placeholder="98765 43210" 
                          className="w-[65%] pl-4 pr-4 py-3.5 bg-transparent outline-none text-slate-900 dark:text-white text-sm sm:text-base" 
                          value={formData.raw_mobile} 
                          onChange={(e) => { setFormData({...formData, raw_mobile: e.target.value.replace(/\D/g, '')}); setFieldErrors({...fieldErrors, raw_mobile: null}); }} 
                      />
                    </div>
                    {fieldErrors.raw_mobile && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.raw_mobile}</p>}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                        <input type={showPassword ? "text" : "password"} placeholder="••••••••" className={`w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900/50 border ${fieldErrors.password ? 'border-red-400 dark:border-red-500' : 'border-slate-100 dark:border-slate-800'} rounded-2xl outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white text-sm sm:text-base [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} value={formData.password} onChange={(e) => { setFormData({...formData, password: e.target.value}); setFieldErrors({...fieldErrors, password: null}); }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>
                    {fieldErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
                  </div>

                  <button type="submit" disabled={loading} className="w-full mt-2 py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>Create Account</span> <FiArrowRight /></>}
                  </button>
                </form>

                <div className="mt-8 sm:mt-10 text-center border-t border-slate-100 dark:border-slate-800/50 pt-6">
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
                    Already a member? <Link to="/user/login" className="ml-1 text-purple-600 dark:text-purple-400 font-bold hover:underline">Sign In</Link>
                    </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="otp" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="text-center">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4"><FiMail size={40} /></div>
                  <h2 className="text-3xl font-serif text-slate-900 dark:text-white mb-2">Verify Mobile</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">We've sent a 6-digit code to <br /><span className="text-purple-700 dark:text-purple-400 font-bold tracking-wide">{registeredFullMobile}</span></p>
                </div>

                {globalError && <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-500/20">{globalError}</div>}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <input 
                    type="text" 
                    maxLength="6" 
                    placeholder="0 0 0 0 0 0" 
                    className="w-full text-center text-3xl tracking-[0.5rem] font-bold py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-purple-500 dark:focus:border-purple-500 focus:border-solid focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white" 
                    value={formData.otp}
                    onChange={(e) => setFormData({...formData, otp: e.target.value.replace(/[^0-9]/g, '')})} 
                  />
                  
                  <button disabled={loading} className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verify & Register"}
                  </button>

                  <div className="space-y-6 pt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Didn't receive the code? <br />
                      {canResend ? (
                        <button type="button" onClick={handleResendOtp} className="text-purple-600 dark:text-purple-400 font-bold hover:underline transition-colors mt-1">Resend Now</button>
                      ) : (
                        <span className="font-medium">Resend available in <span className="text-purple-600 dark:text-purple-400">{timer}s</span></span>
                      )}
                    </p>
                    <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mx-auto">
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