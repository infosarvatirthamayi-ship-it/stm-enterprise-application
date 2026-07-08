import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiLock, FiArrowLeft, FiArrowRight, FiCheckCircle, FiShield, FiRotateCcw } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import api from "../../api/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter Identifier, 2: OTP Verification, 3: Password Update
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(0);

  const [formData, setFormData] = useState({
    identifier: "", 
    otp: "",
    new_password: "",
    confirm_password: ""
  });

  // Automatically grabs the number/email passed from the login screen
  useEffect(() => {
    if (location.state?.prefilledIdentifier) {
      setFormData(prev => ({ ...prev, identifier: location.state.prefilledIdentifier }));
    }
  }, [location.state]);

  // Countdown timer loop execution engine
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Formats payload based on input type
  const getPayload = () => {
    const isEmail = formData.identifier.includes("@");
    return isEmail 
      ? { email: formData.identifier.trim() } 
      : { mobile_number: formData.identifier.replace(/\D/g, '').slice(0, 10) };
  };

  // Step 1: Send OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    const payload = getPayload();

    if (!payload.email && payload.mobile_number.length !== 10) {
      return setError("Please enter a valid email or 10-digit mobile number.");
    }
    
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/user/forgot-password", payload);
      if (data.success || data.status === "true") {
        setStep(2);
        setTimer(60); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Account validation mapping error.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP wrapper
  const handleResendOtp = async () => {
    if (timer > 0) return;
    setFormData(prev => ({ ...prev, otp: "" }));
    await handleRequestOtp(null);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6) {
      return setError("Please enter the complete 6-digit verification code.");
    }

    setLoading(true);
    setError("");
    try {
      const payload = getPayload();
      const { data } = await api.post("/user/forgot-verify-otp", {
        ...payload,
        otp: formData.otp
      });
      if (data.success || data.status === "true") {
        setStep(3); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Update Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      return setError("Passwords do not match!");
    }
    if (formData.new_password.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }

    setLoading(true);
    setError("");
    try {
      const payload = getPayload();
      const { data } = await api.post("/user/reset-password", {
        ...payload,
        otp: formData.otp,
        new_password: formData.new_password
      });

      if (data.success || data.status === "true") {
        setSuccess(true);
        setTimeout(() => navigate("/user/login"), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Password modification processing failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfaff] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-100/50 p-8 sm:p-10 border border-purple-50"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiCheckCircle size={45} />
              </div>
              <h2 className="text-3xl font-serif text-slate-900 mb-2">Password Reset!</h2>
              <p className="text-slate-500 mb-6">Your security profile is updated. Redirecting to login...</p>
              <Loader2 className="animate-spin text-purple-600 mx-auto" />
            </motion.div>
          ) : (
            <div key="form">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiShield size={32} />
                </div>
                <h2 className="text-3xl font-serif text-slate-900 mb-2">
                  {step === 1 && "Reset Password"}
                  {step === 2 && "Enter OTP Code"}
                  {step === 3 && "New Credentials"}
                </h2>
                <p className="text-slate-500 text-sm">
                  {step === 1 && "Enter your email or mobile number to receive a reset code."}
                  {step === 2 && `We've sent a 6-digit code to ${formData.identifier}`}
                  {step === 3 && "Create a strong new password for your account access."}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> {error}
                </div>
              )}

              <form onSubmit={step === 1 ? handleRequestOtp : step === 2 ? handleVerifyOtp : handleResetPassword} className="space-y-5">
                {/* STEP 1 VIEW */}
                {step === 1 && (
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-600" />
                    <input
                      type="text"
                      placeholder="Email or Mobile Number"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 outline-none transition-all font-medium"
                      value={formData.identifier}
                      onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    />
                  </div>
                )}

                {/* STEP 2 VIEW */}
                {step === 2 && (
                  <>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      className="w-full text-center text-3xl tracking-[0.5rem] font-bold py-4 bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl outline-none focus:border-purple-500"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      required
                    />
                    <div className="text-center min-h-[24px]">
                      {timer > 0 ? (
                        <p className="text-sm font-medium text-slate-400">Resend code in <span className="text-purple-600 font-bold">{timer}s</span></p>
                      ) : (
                        <button type="button" onClick={handleResendOtp} className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-800 hover:underline transition-all">
                          <FiRotateCcw size={14} /> Resend OTP Code
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* STEP 3 VIEW */}
                {step === 3 && (
                  <>
                    <div className="relative group">
                      <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        placeholder="New Password"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium"
                        value={formData.new_password}
                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      />
                    </div>
                    <div className="relative group">
                      <FiCheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 outline-none font-medium"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading} className="w-full py-4 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                  {loading ? <Loader2 className="animate-spin" /> : <><span>{step === 1 && "Get Reset Code"}{step === 2 && "Verify Code"}{step === 3 && "Update Password"}</span><FiArrowRight /></>}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/user/login" className="text-sm font-bold text-slate-400 hover:text-purple-600 flex items-center justify-center gap-2 transition-colors">
                  <FiArrowLeft /> Back to Login
                </Link>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}