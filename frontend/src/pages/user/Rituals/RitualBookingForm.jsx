import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext";
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getFullImageUrl } from "../../../utils/config";
import { 
  Loader2, User, CheckCircle, Calendar, Phone, 
  MessageSquare, ArrowRight, ShieldCheck, Crown, Lock, 
  ChevronLeft, MapPin, Ticket, X, Sparkles, Gift
} from "lucide-react";

export default function RitualBookingForm() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user, authenticated, loading: authLoading } = useUserAuth();
  const { isDarkMode: dark } = useTheme();
  
  const [ritual, setRitual] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthorizedMember, setIsAuthorizedMember] = useState(false);

  // Voucher State
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [formData, setFormData] = useState({
    bookingDate: "", devoteeName: "", whatsappNumber: "", specialWish: ""
  });

  // Calculate Prices based on selected package
  const basePrice = Number(selectedPackage?.original_price || 0);
  const memberDiscount = isAuthorizedMember ? (basePrice * 0.25) : 0;
  const voucherDiscount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - memberDiscount - voucherDiscount);

  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast("Please login to secure your booking.", { icon: "🔒" });
      navigate("/user/login", { state: { from: `/user/book-ritual/${id}` } }); 
    }
  }, [authLoading, authenticated, navigate, id]);

  useEffect(() => {
    if (authLoading || !authenticated) return;
    if (!id || id === "undefined") return navigate("/user/rituals");

    const fetchRitualData = async () => {
      try {
        setLoading(true);
        // 🎯 THE FIX: Fetching Membership using the correct webRoute endpoint
        const [ritualRes, packageRes, memberRes] = await Promise.allSettled([
            api.post(`/user/ritual/show`, { ritual_id: id }),
            api.get(`/web/rituals/${id}/packages`),
            api.get(`/web/membership/my-card`) 
        ]);

        if (ritualRes.status === "fulfilled" && ritualRes.value.data.success) {
            setRitual(ritualRes.value.data.data);
        } else {
            throw new Error("Ritual not found");
        }

        const pkgs = packageRes.status === "fulfilled" ? (packageRes.value.data.data || []) : [];
        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);

        // 🎯 THE FIX: Verify Membership Status reliably
        const membershipData = memberRes.status === "fulfilled" ? memberRes.value.data?.data : null;
        setIsAuthorizedMember(!!membershipData || (user?.status === 1 && user?.membership === "active"));

        let safePhone = user?.mobile_number ? String(user.mobile_number).replace(/\D/g, '').slice(-10) : "";

        setFormData(prev => ({
          ...prev,
          devoteeName: user?.first_name || user?.name || "",
          whatsappNumber: safePhone
        }));

      } catch (err) {
        toast.error("Failed to load booking details.");
        navigate("/user/rituals");
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo(0, 0);
    fetchRitualData();
  }, [id, authLoading, authenticated, user, navigate]);

  const openCouponDiscovery = async () => {
    try {
      const res = await api.get("/user/vouchers/available?type=ritual");
      setAvailableCoupons(res.data.data || []);
      setShowCouponModal(true);
    } catch (err) {
      toast.error("Could not fetch offers.");
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode) return toast.error("Please enter a code");
    const loadToast = toast.loading("Verifying code...");
    setIsVerifyingVoucher(true);
    try {
        const priceForVoucher = basePrice - memberDiscount;
        const res = await api.post('/user/vouchers/verify', { 
            code: voucherCode,
            serviceType: 'ritual',
            amount: priceForVoucher 
        });
        
        setAppliedVoucher({
            code: voucherCode.toUpperCase(),
            discountAmount: res.data.data.discountAmount
        });
        toast.success("Promo code applied!", { id: loadToast });
        setShowCouponModal(false);
    } catch (err) {
        toast.error(err.response?.data?.message || "Invalid or Expired Code", { id: loadToast });
        setAppliedVoucher(null);
    } finally {
        setIsVerifyingVoucher(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!formData.bookingDate) return toast.error("Please select a ritual date");
    if (!formData.devoteeName.trim()) return toast.error("Devotee name is required");
    if (!formData.whatsappNumber.match(/^[0-9]{10}$/)) return toast.error("Enter a valid 10-digit number");
    
    setSubmitting(true);
    const loadingToast = toast.loading("Securing ritual slot...");

    try {
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        setSubmitting(false);
        return toast.error("Failed to load secure payment gateway.", { id: loadingToast });
      }

      const finalTempleId = ritual.temple_id?._id || ritual.temple_id;
      const finalRitualId = ritual._id || ritual.id || id;

      const initRes = await api.post("web/user/ritual-booking/initiate", {
        templeId: finalTempleId,
        ritualId: finalRitualId,
        packageId: selectedPackage.id,
        date: formData.bookingDate,
        whatsappNumber: formData.whatsappNumber,
        devoteesName: formData.devoteeName,
        wish: formData.specialWish,
        voucherCode: appliedVoucher?.code || null
      });

      const orderData = initRes.data.data;
      toast.dismiss(loadingToast);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.payment.razorpay_public_key,
        amount: Math.round(Number(orderData.final_amount) * 100),
        order_id: orderData.payment.razorpay_order_id,
        name: "Sarvatirthamayi",
        description: `Ritual: ${ritual?.name}`,
        handler: async (response) => {
          const verifyToast = toast.loading("Verifying signature...");
          try {
            const verifyRes = await api.post("web/user/ritual-booking/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: orderData.bookingId
            });

            if (verifyRes.data.success) {
              toast.dismiss(verifyToast);
              navigate("/user/booking-success", { state: { receiptUrl: "success", bookingDetails: formData, ritualName: ritual.name } });
            }
          } catch (error) {
            toast.error("Payment verification failed.", { id: verifyToast });
          }
        },
        prefill: { name: formData.devoteeName, contact: formData.whatsappNumber, email: user?.email },
        theme: { color: "#4F46E5" }, 
        modal: { ondismiss: () => setSubmitting(false) }
      };
      
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Payment Setup Failed", { id: loadingToast });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${dark ? 'bg-slate-900' : 'bg-[#f8fafc]'}`}>
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <h2 className={`text-xs font-black tracking-[0.2em] uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Securing Sanctuary...</h2>
    </div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-12 transition-all duration-300 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <Toaster position="top-right" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className={`group mb-8 flex items-center gap-2 transition-all font-bold uppercase tracking-wider text-[10px] w-fit ${dark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'}`}>
            <div className={`p-2 rounded-lg shadow-sm transition-colors border ${dark ? 'bg-slate-800 border-slate-700 group-hover:bg-indigo-900' : 'bg-white border-slate-200 group-hover:bg-indigo-50'}`}>
              <ChevronLeft size={16} />
            </div>
            Back to Options
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* --- LEFT SIDEBAR --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className={`rounded-[2.5rem] overflow-hidden shadow-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="h-56 relative">
                <img src={getFullImageUrl(ritual?.image)} alt={ritual?.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                   <h2 className="text-2xl font-black mb-1 leading-tight tracking-tight capitalize">{ritual?.name}</h2>
                   <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-black uppercase tracking-widest">
                      <MapPin size={12} className="text-indigo-400"/> {ritual?.address?.city || ritual?.temple_name || "Sacred Site"}
                   </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <p className={`text-[10px] uppercase font-black tracking-[0.15em] px-2 mb-3 ${dark ? 'text-slate-400' : 'text-slate-400'}`}>Select Package</p>
                  {packages.length > 0 ? packages.map((pkg) => (
                    <div 
                      key={pkg.id} onClick={() => { setSelectedPackage(pkg); setAppliedVoucher(null); }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center 
                        ${selectedPackage?.id === pkg.id 
                            ? (dark ? 'border-indigo-500 bg-indigo-900/30' : 'border-indigo-600 bg-indigo-50/50 shadow-md') 
                            : (dark ? 'border-slate-700 hover:border-slate-600' : 'border-slate-100 hover:border-slate-200')}`}
                    >
                      <span className={`text-sm font-bold capitalize ${selectedPackage?.id === pkg.id ? 'text-indigo-600' : (dark ? 'text-slate-300' : 'text-slate-600')}`}>{pkg.name}</span>
                      <div className="text-right">
                          <span className="font-black text-lg block">₹{pkg.original_price}</span>
                      </div>
                    </div>
                  )) : (
                     <div className={`p-4 rounded-2xl text-xs font-bold text-center border ${dark ? 'bg-rose-900/20 text-rose-400 border-rose-900/50' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        No packages currently available.
                     </div>
                  )}
                </div>

                {selectedPackage && (
                  <div className={`p-5 rounded-2xl border shadow-lg ${dark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-slate-100'}`}>
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Fare Breakdown</h3>
                      <div className="space-y-3 text-sm font-bold">
                          <div className={`flex justify-between items-center ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span>Base Price</span><span>₹{basePrice}</span>
                          </div>
                          
                          {memberDiscount > 0 && (
                              <div className="flex justify-between items-center text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> Member Savings</span>
                                  <span>- ₹{memberDiscount}</span>
                              </div>
                          )}

                          {voucherDiscount > 0 && (
                              <div className="flex justify-between items-center text-[11px] font-black text-indigo-500 uppercase tracking-widest animate-in fade-in">
                                  <span className="flex items-center gap-1.5"><Ticket size={14}/> Promo Applied</span>
                                  <span>- ₹{voucherDiscount}</span>
                              </div>
                          )}

                          <div className={`flex justify-between items-center pt-4 border-t mt-2 ${dark ? 'border-slate-800' : 'border-slate-100'} text-xl font-black`}>
                              <span>Total Payable</span>
                              <span className="text-indigo-600">₹{finalPrice}</span>
                          </div>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: FORM SECTION --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {isAuthorizedMember ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 bg-emerald-50/10 text-emerald-500 px-6 py-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden">
                <Crown size={24} className="shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Active STM Member</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase">25% Discount Applied Securely</p>
                </div>
              </motion.div>
            ) : (
              <motion.div whileHover={{ y: -2 }} className={`p-5 sm:p-6 rounded-2xl border relative overflow-hidden shadow-sm ${dark ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className={`font-black text-xs sm:text-sm flex items-center gap-2 uppercase tracking-wider ${dark ? 'text-amber-500' : 'text-amber-800'}`}><Gift size={16} /> STM Club Exclusive</h4>
                    <p className={`text-[10px] sm:text-[11px] font-bold mt-1 uppercase tracking-tight ${dark ? 'text-amber-500/70' : 'text-amber-700/80'}`}>
                        Join the club to save 25% instantly on this booking!
                    </p>
                  </div>
                  <button onClick={() => navigate("/user/stm-club")} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-amber-500/20 hover:bg-amber-600 transition-all shrink-0">Join Now</button>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2.5rem] p-6 sm:p-10 shadow-xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <h3 className="text-2xl font-black mb-8 tracking-tight">Booking Details</h3>
              
              <div className="space-y-6">
                <div className={`p-5 rounded-[2rem] border-2 border-dashed ${dark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Ticket className="text-indigo-600" size={16}/><h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Promo Code</h4></div>
                      <button onClick={openCouponDiscovery} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-tighter flex items-center gap-1"><Sparkles size={12}/> View Offers</button>
                    </div>
                    
                    {appliedVoucher ? (
                      <div className="flex items-center justify-between bg-indigo-600 text-white p-4 rounded-2xl shadow-xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3"><CheckCircle size={20}/><p className="font-black text-lg tracking-[0.2em]">{appliedVoucher.code}</p></div>
                        <button onClick={() => setAppliedVoucher(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={18}/></button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="text" placeholder="ENTER CODE" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} className={`flex-1 h-14 px-6 border-2 rounded-2xl outline-none font-bold focus:border-indigo-500 transition-all uppercase tracking-widest text-sm ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}/>
                        <button onClick={applyVoucher} disabled={isVerifyingVoucher || !voucherCode} className="h-14 px-8 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-[10px] tracking-widest uppercase">{isVerifyingVoucher ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Apply"}</button>
                      </div>
                    )}
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Ritual Date <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                type="date" min={new Date().toISOString().split("T")[0]} 
                                className={`w-full h-14 pl-12 pr-4 border rounded-xl outline-none font-bold transition-all text-sm ${dark ? 'bg-slate-900 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-700'}`} 
                                value={formData.bookingDate} onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Devotee Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                placeholder="Full Name" value={formData.devoteeName} 
                                className={`w-full h-14 pl-12 pr-4 border rounded-xl outline-none font-bold transition-all text-sm ${dark ? 'bg-slate-900 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-700'}`} 
                                onChange={(e) => setFormData({...formData, devoteeName: e.target.value})}
                            />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">WhatsApp No. <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                placeholder="10 Digit Number" maxLength="10" value={formData.whatsappNumber} 
                                className={`w-full h-14 pl-12 pr-4 border rounded-xl outline-none font-bold transition-all text-sm ${dark ? 'bg-slate-900 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-700'}`} 
                                onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '')})}
                            />
                        </div>
                      </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Special Sankalpa / Wish</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18}/>
                            <textarea 
                                placeholder="Include Gotra, Nakshatra, or specific prayers..." rows="3"
                                className={`w-full py-4 pl-12 pr-4 h-32 border rounded-xl outline-none font-medium resize-none transition-all text-sm ${dark ? 'bg-slate-900 border-slate-700 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-600'}`} 
                                value={formData.specialWish} onChange={(e) => setFormData({...formData, specialWish: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handlePayment} 
                    disabled={submitting || !selectedPackage} 
                    className="group w-full bg-indigo-600 text-white h-16 rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-8"
                >
                  {submitting ? <Loader2 className="animate-spin" size={24} /> : (<><Lock size={18} className="text-indigo-300"/><span>Pay ₹{finalPrice}</span><ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>)}
                </button>
                <div className="flex items-center justify-center gap-3 pt-2 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-3" alt="Razorpay"/>
                    <span className="text-[9px] font-black uppercase tracking-widest">Secured Gateway</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* DISCOVERY MODAL */}
      <AnimatePresence>
        {showCouponModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0f172a]/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className={`w-full max-w-md rounded-[3rem] p-8 sm:p-10 shadow-2xl border relative overflow-hidden ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <Sparkles className="absolute -top-6 -left-6 text-indigo-500/10 w-32 h-32" />
              <div className="flex justify-between items-center mb-8 relative z-10">
                  <h3 className="text-2xl font-black italic tracking-tighter">Divine Offers</h3>
                  <button onClick={() => setShowCouponModal(false)} className={`p-2 rounded-full transition-colors ${dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><X size={24}/></button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {availableCoupons.length > 0 ? availableCoupons.map((cpn) => (
                  <motion.div key={cpn._id} whileHover={{ x: 5 }} onClick={() => handleApplyVoucher(cpn.code)} className={`p-5 border-2 rounded-[2rem] cursor-pointer transition-all group ${dark ? 'border-indigo-900/30 hover:bg-indigo-900/10' : 'border-indigo-50 hover:bg-indigo-50/50'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-black text-indigo-600 text-xl tracking-[0.2em]">{cpn.code}</span>
                        <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full uppercase tracking-tighter">{cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} OFF`}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{cpn.description || "Valid for a limited duration on sacred visits."}</p>
                  </motion.div>
                )) : (
                  <div className="text-center py-10 opacity-50"><Ticket size={40} className="mx-auto mb-4" /><p className="text-sm font-bold uppercase tracking-widest">No Active Offers</p></div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}