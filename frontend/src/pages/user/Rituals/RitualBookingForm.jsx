import React, { useState, useEffect, useMemo } from "react";
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
  const { id } = useParams(); // This is the ritual sql_id
  const navigate = useNavigate();
  const { user, loading: authLoading } = useUserAuth();
  const { isDarkMode: dark } = useTheme();
  const [ritual, setRitual] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Voucher logic
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [formData, setFormData] = useState({
    bookingDate: "",
    devoteeName: "",
    whatsappNumber: "",
    specialWish: ""
  });

  const isAuthorizedMember = useMemo(() => {
    return Number(user?.status) === 1 && user?.membership === "active";
  }, [user]);

  const { finalPrice, membershipSavings, voucherSavings } = useMemo(() => {
    const basePrice = Number(selectedPackage?.price || 0);
    let currentPrice = basePrice;
    let memDisc = 0;
    let vDisc = 0;

    if (isAuthorizedMember && basePrice > 0) {
      memDisc = basePrice * 0.25;
      currentPrice -= memDisc;
    }

    if (appliedVoucher) {
      vDisc = appliedVoucher.discountAmount;
      currentPrice = Math.max(0, currentPrice - vDisc);
    }

    return { 
      finalPrice: currentPrice.toFixed(2), 
      membershipSavings: memDisc.toFixed(2),
      voucherSavings: vDisc.toFixed(2)
    };
  }, [selectedPackage, isAuthorizedMember, appliedVoucher]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/user/login"); return; }

    const fetchRitualData = async () => {
      try {
        setLoading(true);
        // Fetch ritual details
        const resRitual = await api.post(`/user/ritual/show`, { ritual_id: id });
        setRitual(resRitual.data.data);
        
        // Fetch ritual packages
        const resPackages = await api.post(`/user/ritual/packages`, { ritual_id: id });
        const pkgs = resPackages.data.data.data || [];
        setPackages(pkgs);
        if (pkgs.length > 0) setSelectedPackage(pkgs[0]);

        setFormData(prev => ({
          ...prev,
          devoteeName: user.name || "",
          whatsappNumber: user.mobile_number || ""
        }));
      } catch (err) {
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    window.scrollTo(0, 0);
    fetchRitualData();
  }, [id, authLoading, user, navigate]);

  const openCouponDiscovery = async () => {
    try {
      const res = await api.get("/user/vouchers/available?type=ritual");
      setAvailableCoupons(res.data.data || []);
      setShowCouponModal(true);
    } catch (err) {
      toast.error("Could not fetch offers.");
    }
  };

  const handleApplyVoucher = async (codeToApply = null) => {
    const targetCode = codeToApply || voucherCode;
    if (!targetCode.trim()) return toast.error("Enter a code first");
    
    setIsVerifyingVoucher(true);
    try {
      const midPrice = isAuthorizedMember ? (selectedPackage.price * 0.75) : selectedPackage.price;
      const res = await api.post("/user/vouchers/verify", {
        code: targetCode,
        amount: midPrice,
        serviceType: "ritual"
      });

      setAppliedVoucher({
        code: targetCode.toUpperCase(),
        discountAmount: res.data.data.discountAmount,
        voucherId: res.data.data.voucherId
      });
      setVoucherCode(targetCode.toUpperCase());
      setShowCouponModal(false);
      toast.success("Divine Offer Applied!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid Voucher Code");
      setAppliedVoucher(null);
    } finally {
      setIsVerifyingVoucher(false);
    }
  };

  const handlePayment = async () => {
    if (!formData.bookingDate) return toast.error("Please select a ritual date");
    if (!formData.devoteeName.trim()) return toast.error("Devotee name is required");
    if (!formData.whatsappNumber.match(/^[0-9]{10}$/)) return toast.error("Enter a valid 10-digit number");
    
    setSubmitting(true);
    try {
      // 1. Create the Order
      const res = await api.post("/user/ritual/booking", {
        temple_id: ritual.temple_id,
        ritual_id: id,
        ritual_package_id: selectedPackage.id,
        date: formData.bookingDate,
        whatsAppNumber: formData.whatsappNumber,
        devoteeName: formData.devoteeName,
        wish: formData.specialWish,
        offerId: appliedVoucher?.voucherId
      });

      const orderData = res.data.data;
      
      // 2. Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.payment.razorpay_public_key,
        amount: Math.round(Number(finalPrice) * 100),
        order_id: orderData.payment.razorpay_order_id,
        name: "Sarvatirthamayi",
        description: `Sacred Ritual: ${ritual?.name}`,
        handler: async (response) => {
          try {
            // 3. Verify the Payment
            const verifyRes = await api.post("/user/ritual/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              toast.success("Ritual Booked Successfully!");
              navigate("/booking-success", { 
                state: { 
                  receiptUrl: "success", // Mock receipt for now
                  bookingDetails: formData,
                  ritualName: ritual.name
                } 
              });
            }
          } catch (error) {
            toast.error("Payment verification failed.");
          }
        },
        prefill: { name: formData.devoteeName, contact: formData.whatsappNumber },
        theme: { color: "#4F46E5" }, // Indigo-600
        modal: { ondismiss: () => setSubmitting(false) }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment Initiation Failed");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
      <h2 className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase">Securing Sanctuary...</h2>
    </div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-12 transition-all duration-300 ${dark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'} font-sans`}>
      <Toaster position="top-right" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className="group mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-bold uppercase tracking-wider text-[10px] w-fit">
            <div className="p-2 rounded-lg bg-white shadow-sm group-hover:bg-indigo-50 border border-slate-200">
              <ChevronLeft size={16} />
            </div>
            Back to Options
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* --- LEFT SIDEBAR: Ritual Info & Packages --- */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
              <div className="h-56 relative">
                <img src={getFullImageUrl(ritual?.image)} alt={ritual?.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                   <h2 className="text-2xl font-black mb-1 leading-tight tracking-tight">{ritual?.name}</h2>
                   <div className="flex items-center gap-1.5 opacity-80 text-[10px] font-black uppercase tracking-widest">
                      <MapPin size={12} className="text-indigo-400"/> {ritual?.temple_name || "Sacred Site"}
                   </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.15em] px-2 mb-3">Select Package</p>
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      onClick={() => { setSelectedPackage(pkg); setAppliedVoucher(null); }}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPackage?.id === pkg.id ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <span className={`text-sm font-bold ${selectedPackage?.id === pkg.id ? 'text-indigo-700' : 'text-slate-600'}`}>{pkg.name}</span>
                      <span className="font-black text-slate-800">₹{pkg.price}</span>
                    </div>
                  ))}
                  {packages.length === 0 && (
                     <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold text-center border border-rose-100">No packages currently available for this ritual.</div>
                  )}
                </div>

                {/* DYNAMIC PRICE SUMMARY */}
                {selectedPackage && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Base Price</span><span>₹{selectedPackage?.price}</span>
                      </div>
                      {isAuthorizedMember && (
                          <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase">
                              <span className="flex items-center gap-1.5"><ShieldCheck size={12}/> Member Savings (25%)</span>
                              <span>-₹{membershipSavings}</span>
                          </div>
                      )}
                      {appliedVoucher && (
                          <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase animate-in slide-in-from-right-2">
                              <span className="flex items-center gap-1.5"><Ticket size={12}/> Promo Applied</span>
                              <span>-₹{voucherSavings}</span>
                          </div>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-2">
                          <span className="text-xs uppercase font-black text-slate-800 tracking-wider">Total</span>
                          <span className="text-3xl font-black text-indigo-600 tracking-tight">₹{finalPrice}</span>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: FORM SECTION --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* MEMBER BADGE / UPSELL */}
            {isAuthorizedMember ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 bg-emerald-50 text-emerald-700 px-6 py-4 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
                <Crown size={24} className="fill-emerald-200 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">Active STM Member</p>
                  <p className="text-[10px] font-bold opacity-80 uppercase">25% Discount Applied Automatically</p>
                </div>
              </motion.div>
            ) : (
              <motion.div whileHover={{ y: -2 }} className="p-5 sm:p-6 bg-amber-50 rounded-2xl border border-amber-200 relative overflow-hidden group shadow-sm">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-amber-800 font-black text-xs sm:text-sm flex items-center gap-2 uppercase tracking-wider"><Gift size={16} /> STM Club Exclusive</h4>
                    <p className="text-amber-700/80 text-[10px] sm:text-[11px] font-bold mt-1 uppercase tracking-tight">Members get <span className="font-black text-amber-600">25% OFF</span> all ritual bookings.</p>
                  </div>
                  <button onClick={() => navigate("/user/stm-club")} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-amber-200 hover:bg-amber-600 transition-all shrink-0">Join Now</button>
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-black mb-8 tracking-tight text-slate-800">Booking Details</h3>
              
              <div className="space-y-6">
                {/* VOUCHER DISCOVERY UI */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><Ticket className="text-indigo-600" size={16}/><h4 className="font-black text-[10px] uppercase tracking-widest text-slate-500">Have a Code?</h4></div>
                    <button onClick={openCouponDiscovery} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider flex items-center gap-1"><Sparkles size={12}/> View Offers</button>
                  </div>
                  {appliedVoucher ? (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-xl shadow-sm animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-3"><CheckCircle size={18}/><p className="font-black text-sm tracking-widest">{appliedVoucher.code}</p></div>
                      <button onClick={() => setAppliedVoucher(null)} className="p-1.5 hover:bg-indigo-100 rounded-lg transition-colors"><X size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" placeholder="ENTER PROMO" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} className="flex-1 h-12 px-4 bg-white border border-slate-200 rounded-xl outline-none font-bold focus:border-indigo-500 transition-all uppercase text-xs tracking-widest"/>
                      <button onClick={() => handleApplyVoucher()} disabled={isVerifyingVoucher || !voucherCode} className="px-6 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all text-[10px] uppercase tracking-widest">{isVerifyingVoucher ? <Loader2 className="animate-spin" size={14}/> : "Apply"}</button>
                    </div>
                  )}
                </div>

                {/* FORM INPUTS */}
                <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Ritual Date <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input type="date" min={new Date().toISOString().split("T")[0]} className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold transition-all text-sm text-slate-700" onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Devotee Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input placeholder="Full Name" value={formData.devoteeName} className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold transition-all text-sm text-slate-700" onChange={(e) => setFormData({...formData, devoteeName: e.target.value})}/>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">WhatsApp No. <span className="text-rose-500">*</span></label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input placeholder="10 Digit Number" value={formData.whatsappNumber} className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-bold transition-all text-sm text-slate-700" onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}/>
                        </div>
                      </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-2">Special Sankalpa / Wish</label>
                        <div className="relative">
                            <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18}/>
                            <textarea placeholder="Include Gotra, Nakshatra, or specific prayers..." className="w-full py-4 pl-12 pr-4 h-32 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none font-medium resize-none transition-all text-sm text-slate-600" onChange={(e) => setFormData({...formData, specialWish: e.target.value})}/>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handlePayment} 
                    disabled={submitting || !selectedPackage || !formData.bookingDate || !formData.devoteeName} 
                    className="group w-full bg-indigo-600 text-white h-16 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100 mt-8"
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

      {/* OFFER DISCOVERY MODAL */}
      <AnimatePresence>
        {showCouponModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-sm rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-xl font-black tracking-tight text-slate-800">Available Promos</h3>
                  <button onClick={() => setShowCouponModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700"><X size={20}/></button>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {availableCoupons.length > 0 ? availableCoupons.map((cpn) => (
                  <div key={cpn.id} onClick={() => handleApplyVoucher(cpn.code)} className="p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-black text-indigo-700 text-sm tracking-widest">{cpn.code}</span>
                        <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-1 rounded shadow-sm uppercase tracking-wider">
                            {cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} OFF`}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-snug">{cpn.description || "Applicable on your ritual booking."}</p>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-40">
                      <Ticket size={32} className="mx-auto mb-3 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">No Offers Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}