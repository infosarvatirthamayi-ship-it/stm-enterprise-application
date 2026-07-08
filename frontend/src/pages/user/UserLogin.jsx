import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle, FiChevronLeft, FiAlertCircle } from 'react-icons/fi';
import { useUserAuth } from "../../context/UserAuthContext";
import { Loader2 } from "lucide-react";

const UserLogin = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { login, user, loading: authLoading } = useUserAuth();

    const destination = location.state?.from || "/";

    const [inputValue, setInputValue] = useState(location.state?.mobile || ''); 
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState(location.state?.message || "");

    useEffect(() => {
        if (location.state?.message) {
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (!authLoading && user) {
            navigate(destination, { replace: true });
        }
    }, [user, authLoading, navigate, destination]);

    useEffect(() => {
        if (successMsg) {
            const timer = setTimeout(() => setSuccessMsg(""), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMsg]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        const trimmedInput = inputValue.trim();
        const isEmail = trimmedInput.includes("@") || /[a-zA-Z]/.test(trimmedInput);
        
        let payload = { password };
        
        if (isEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedInput)) {
                setLoading(false);
                return setError("Hmm, that email doesn't look quite right. (e.g., name@example.com)");
            }
            // 🎯 Send as unified identifier
            payload.identifier = trimmedInput.toLowerCase(); 
        } else {
            const cleanMobile = trimmedInput.replace(/\D/g, "");
            if (cleanMobile.length < 7) {
                setLoading(false);
                return setError("Please enter a valid mobile number (between 7 and 15 digits).");
            }
            // 🎯 Send as unified identifier
            payload.identifier = cleanMobile; 
        }

        try {
            const res = await login(payload);
            if (res) {
                navigate(destination, { replace: true }); 
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Invalid credentials. Please verify and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-[#0a0a1a]">
                <Loader2 className="animate-spin text-purple-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-[#0a0a1a] lg:bg-[#fcfaff] lg:dark:bg-[#0a0a1a] selection:bg-purple-200 dark:selection:bg-purple-900/50 transition-colors duration-500">
            
            <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] relative overflow-hidden bg-purple-950">
                <img src="/assets/event-banner.png" alt="Branding Banner" className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950 via-transparent to-purple-900/40" />
                <div className="relative z-10 flex flex-col justify-end p-16 w-full">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h2 className="text-5xl font-serif text-white leading-tight mb-6">Experience the Divine <br /> in Every Moment.</h2>
                        <p className="text-purple-100/70 text-lg max-w-md">Connect with your spiritual roots and manage your memberships with ease.</p>
                    </motion.div>
                </div>
            </div>

            <div className="w-full lg:w-[50%] xl:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 md:p-20 relative bg-white dark:bg-[#0a0a1a] transition-colors duration-500">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
                    <div className="mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all group">
                            <FiChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Home
                        </Link>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl sm:text-4xl font-serif text-slate-900 dark:text-white mb-3">Sign In</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Welcome back! Please enter your details.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {successMsg && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400 text-sm flex items-center gap-3">
                                <FiCheckCircle className="text-green-500 dark:text-green-400 shrink-0" /> {successMsg}
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3">
                                <FiAlertCircle className="text-red-500 dark:text-red-400 shrink-0" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email or Mobile Number</label>
                            <div className="relative group">
                                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                                <input 
                                    type="text" 
                                    placeholder="Enter registered email or phone" 
                                    value={inputValue} 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:border-purple-500 dark:focus:border-purple-500 outline-none font-medium text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-900" 
                                    onChange={(e) => setInputValue(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                                <Link to="/user/forgot-password" state={{ prefilledIdentifier: inputValue }} className="text-purple-600 dark:text-purple-400 text-xs font-bold hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:border-purple-500 dark:focus:border-purple-500 outline-none font-medium text-slate-900 dark:text-white transition-all focus:bg-white dark:focus:bg-slate-900 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <><span>Sign In</span> <FiArrowRight /></>}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-medium">New to our community? <Link to="/signup" className="ml-2 text-purple-600 dark:text-purple-400 font-bold hover:underline">Create an account</Link></p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UserLogin;