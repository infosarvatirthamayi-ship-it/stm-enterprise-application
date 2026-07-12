import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext"; 
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getFullImageUrl } from "../../../utils/config";
import { 
    Loader2, ChevronLeft, Calendar, User, Phone, 
    Ticket, ShieldCheck, Crown, Sparkles, Heart, MapPin, CheckCircle, Download, ArrowRight
} from "lucide-react";

export default function TempleBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  const { user, authenticated, loading: authLoading } = useUserAuth();

  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [ticketUrl, setTicketUrl] = useState("");
  
  const [priceData, setPriceData] = useState({ 
      base: 0, final: 0, memberDiscount: 0, voucherDiscount: 0, isMember: false 
  });
  
  const [formData, setFormData] = useState({ 
      bookingDate: "", devoteeName: "", whatsappNumber: "", specialWish: "", voucherCode: "" 
  });

  // 1. Auth Protection
  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast("Please login to secure your booking.", { icon: "🔒" });
      navigate("/user/login", { state: { from: `/user/book-temple/${id}` } }); 
    }
  }, [authLoading, authenticated, navigate, id]);

  // 2. Fetch Data
  useEffect(() => {
    if (authLoading || !authenticated) return;
    if (!id || id === "undefined") return navigate("/user/temples");

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const [templeRes, memberRes] = await Promise.allSettled([
            api.get(`/web/temples/${id}`),
            api.get('/user/membership-card/my-card')
        ]);

        if (templeRes.status === "rejected" || !templeRes.value?.data) {
            throw new Error("Temple not found");
        }

        const templeData = templeRes.value.data?.data || templeRes.value.data?.temple;
        if (!templeData) throw new Error("Invalid temple data");

        // Accurate Membership API Check
        const membershipData = memberRes.status === "fulfilled" ? memberRes.value.data?.data : null;
        const isMember = !!membershipData || (user?.status === 1 && user?.membership === "active");

        setTemple(templeData);
        
        let basePrice = Number(templeData?.visit_price) || 0;
        let discount = isMember ? (basePrice * 0.25) : 0; // 25% Discount logic
        
        setPriceData({ 
            base: basePrice, 
            final: Math.max(0, basePrice - discount), 
            memberDiscount: discount, 
            voucherDiscount: 0,
            isMember: isMember
        });

        let safePhone = "";
        if (user?.mobile_number) {
            safePhone = String(user.mobile_number).replace(/\D/g, '').slice(-10);
        }

        setFormData(prev => ({ 
          ...prev, 
          devoteeName: user?.first_name || user?.name || "", 
          whatsappNumber: safePhone 
        }));

      } catch (err) {
        toast.error("Temple details could not be loaded.");
        navigate("/user/temples");
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [id, authLoading, authenticated, user, navigate]);

  // 3. Voucher Logic
  const applyVoucher = async () => {
    if (!formData.voucherCode) return toast.error("Please enter a code");
    const loadToast = toast.loading("Verifying code...");
    try {
        const res = await api.post('/user/vouchers/verify', { 
            voucherCode: formData.voucherCode,
            serviceType: 'temple',
            baseAmount: priceData.base - priceData.memberDiscount 
        });
        
        const { discountAmount, finalAmount } = res.data.data;
        setPriceData(prev => ({ ...prev, final: finalAmount, voucherDiscount: discountAmount }));
        toast.success("Promo code applied!", { id: loadToast });
    } catch (err) {
        toast.error(err.response?.data?.message || "Invalid or Expired Code", { id: loadToast });
    }
  };

  // 4. Payment Logic
  const handlePayment = async () => {
    if (!formData.bookingDate) return toast.error("Please select a visit date.");
    if (!formData.devoteeName?.trim()) return toast.error("Primary devotee name is required.");
    if (!formData.whatsappNumber?.match(/^[0-9]{10}$/)) return toast.error("Enter a valid 10-digit WhatsApp number.");

    setSubmitting(true);
    const loadingToast = toast.loading("Securing your digital pass...");

    try {
      const initRes = await api.post('/user/temple-booking/initiate', {
        temple_id: temple?._id || temple?.id || temple?.sql_id,
        date: formData.bookingDate,
        devotees_name: formData.devoteeName,
        whatsapp_number: formData.whatsappNumber,
        wish: formData.specialWish,
        voucherCode: formData.voucherCode
      });

      const orderData = initRes.data.data;

      if (initRes.data.isFree || orderData?.final_amount === 0) {
          toast.success("Darshan Secured! Pass activated.", { id: loadingToast });
          setTicketUrl(initRes.data.ticketUrl || "success");
          setShowSuccessView(true);
          return;
      }

      toast.dismiss(loadingToast);
      
      const options = {
        key: orderData?.razorpay_public_key || import.meta.env.VITE_RAZORPAY_KEY_ID, 
        amount: Math.round(orderData?.final_amount * 100),
        currency: "INR",
        order_id: orderData?.razorpay_order_id,
        name: "Sarvatirthamayi",
        description: `Digital Pass: ${temple?.name || 'Temple'}`,
        handler: async (response) => {
          const verifyToast = toast.loading("Verifying signature...");
          try {
            const verifyRes = await api.post("/user/temple-booking/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: orderData.bookingId
            });

            if (verifyRes.data.success) {
              toast.dismiss(verifyToast);
              setTicketUrl(verifyRes.data.ticketUrl || "success");
              setShowSuccessView(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else throw new Error("Verification failed.");
          } catch (error) { 
              toast.error(error.message, { id: verifyToast }); 
          }
        },
        prefill: { name: formData.devoteeName, contact: formData.whatsappNumber, email: user?.email || "" },
        theme: { color: "#9333ea" },
        modal: { ondismiss: () => setSubmitting(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error("Transaction declined."); setSubmitting(false); });
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Gateway error.", { id: loadingToast });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a1a]">
      <Loader2 className="animate-spin text-purple-600 mb-4" size={50} />
      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 italic uppercase">Invoking Connection...</h2>
    </div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-12 transition-all duration-300 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster position="top-right" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => navigate(-1)} className="mb-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors">
           <div className={`p-2 rounded-lg shadow-sm border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><ChevronLeft size={14} /></div> 
           Return to Details
        </button>

        <AnimatePresence mode="wait">
          {showSuccessView ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-[3.5rem] p-8 md:p-12 text-center shadow-2xl border dark:border-slate-800">
              <div className="mb-6 p-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full inline-block animate-bounce"><CheckCircle size={80} /></div>
              <h2 className="text-3xl font-black mb-4 italic">Journey Confirmed!</h2>
              <p className="text-slate-500 mb-10 text-lg font-medium">Your visit to <b>{temple?.name}</b> is scheduled. We have sent the ticket to your email.</p>
              <div className="space-y-4">
                <a href={`${import.meta.env.VITE_API_BASE_URL}${ticketUrl}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-3 bg-purple-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-purple-700 active:scale-95 transition-all"><Download size={24} /> Download E-Ticket</a>
                <button onClick={() => navigate("/user/my-temple-bookings")} className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200">View My Bookings</button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
              
              {/* LEFT SIDEBAR - TEMPLE DETAILS & FARE */}
              <div className="xl:col-span-5 xl:sticky xl:top-28 space-y-6">
                <div className="bg-slate-950 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-800">
                  <div className="relative h-56 md:h-64 xl:h-48">
                    <img src={getFullImageUrl(temple?.image)} alt={temple?.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                        <h2 className="text-2xl md:text-3xl font-black mb-1 italic text-white leading-tight">{temple?.name}</h2>
                        <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider"><MapPin size={14}/> {temple?.city_name}</div>
                    </div>
                  </div>
                </div>
                
                {/* UPSELL / MEMBER BADGE SECTION */}
                <div>
                  {priceData.isMember ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 p-5 rounded-[2rem] border border-emerald-500/30 shadow-sm relative overflow-hidden">
                      <Sparkles size={40} className="absolute -right-2 top-0 opacity-20 rotate-12" />
                      <div className="p-2 bg-emerald-500 text-white rounded-xl shrink-0"><Crown size={20} /></div>
                      <div>
                          <p className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-emerald-500">Active Member</p>
                          <p className="text-xs font-medium opacity-90 text-slate-700 dark:text-slate-300">Your 25% STM Club discount is automatically applied.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div whileHover={{ y: -2 }} className="p-5 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-[2rem] border border-amber-500/30 relative overflow-hidden group">
                      <div className="relative z-10 flex flex-col justify-between gap-3">
                        <div>
                          <h4 className="text-amber-600 dark:text-amber-400 font-black text-sm flex items-center gap-2 uppercase tracking-tighter"><Crown size={18} /> Unlock 25% Off</h4>
                          <p className="text-slate-600 dark:text-slate-300 text-xs font-medium mt-1 leading-relaxed">Join the STM Club today to get instant discounts on all Darshans.</p>
                        </div>
                        <button onClick={() => navigate("/user/stm-club")} className="bg-amber-500 text-slate-950 w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition-all text-center">View Club Benefits</button>
                      </div>
                      <Crown size={80} className="absolute -bottom-4 -right-4 text-amber-500/10 group-hover:rotate-12 transition-transform" />
                    </motion.div>
                  )}
                </div>

                {/* FARE BREAKDOWN */}
                <div className={`p-6 rounded-[2rem] border shadow-lg ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Fare Breakdown</h3>
                    <div className="space-y-3 text-sm font-bold">
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                            <span>Standard Entry</span>
                            <span>₹{priceData.base}</span>
                        </div>
                        {priceData.memberDiscount > 0 && (
                            <div className="flex justify-between items-center text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> Member Savings (25%)</span>
                                <span>- ₹{priceData.memberDiscount}</span>
                            </div>
                        )}
                        {priceData.voucherDiscount > 0 && (
                            <div className="flex justify-between items-center text-[11px] font-black text-purple-500 uppercase tracking-widest animate-in fade-in">
                                <span className="flex items-center gap-1.5"><Ticket size={14}/> Promo Applied</span>
                                <span>- ₹{priceData.voucherDiscount}</span>
                            </div>
                        )}
                        <div className={`flex justify-between items-center pt-4 border-t ${dark ? 'border-slate-800' : 'border-slate-100'} text-xl font-black`}>
                            <span>Total Payable</span>
                            <span className="text-purple-600">₹{priceData.final}</span>
                        </div>
                    </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR - FORM SECTION */}
              <div className="xl:col-span-7">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[3rem] p-6 md:p-10 shadow-2xl border ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
                  <h3 className="text-2xl md:text-3xl font-black font-serif tracking-tight mb-8 flex items-center gap-3">
                      Devotee Enrollment {priceData.isMember && <Sparkles className="text-amber-400" size={24}/>}
                  </h3>
                  
                  <div className="space-y-6 md:space-y-8">
                    
                    {/* VOUCHER UI */}
                    <div className={`p-5 rounded-[2rem] border-2 border-dashed ${dark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2"><Ticket className="text-purple-600" size={16}/><h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Promo Code</h4></div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input type="text" placeholder="ENTER CODE" value={formData.voucherCode} onChange={(e) => setFormData({...formData, voucherCode: e.target.value.toUpperCase()})} className={`flex-1 h-14 px-6 border-2 rounded-2xl outline-none font-bold focus:border-purple-500 transition-all uppercase tracking-widest text-sm ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}/>
                        <button onClick={applyVoucher} className="h-14 px-8 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all text-[10px] tracking-widest uppercase">Apply</button>
                      </div>
                    </div>

                    {/* FORM FIELDS */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Visit Date</label>
                        <div className="relative"><Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20}/><input type="date" min={new Date().toISOString().split("T")[0]} className={`w-full h-14 md:h-16 pl-14 pr-4 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} value={formData.bookingDate} onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}/></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Devotee Full Name</label>
                          <div className="relative"><User className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20}/><input placeholder="Full Name" value={formData.devoteeName} className={`w-full h-14 md:h-16 pl-14 pr-4 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} onChange={(e) => setFormData({...formData, devoteeName: e.target.value})}/></div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp Contact</label>
                          <div className="relative"><Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20}/><input placeholder="10-digit number" maxLength="10" value={formData.whatsappNumber} className={`w-full h-14 md:h-16 pl-14 pr-4 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold tracking-widest ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '')})}/></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Gotra, Rashi, or Special Sankalpam (Optional)</label>
                        <div className="relative"><Heart className="absolute left-5 top-5 text-purple-500" size={20}/><textarea placeholder="Specific prayers..." rows="3" className={`w-full py-5 pl-14 pr-4 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold resize-none ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} value={formData.specialWish} onChange={(e) => setFormData({...formData, specialWish: e.target.value})}/></div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-4">
                        <button onClick={handlePayment} disabled={submitting} className="group w-full bg-purple-600 text-white h-20 md:h-24 rounded-[2rem] font-black text-xl md:text-2xl shadow-2xl hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 relative overflow-hidden">
                        {submitting ? <Loader2 className="animate-spin" size={28} /> : (<><ShieldCheck size={24} className="text-purple-300 hidden sm:block"/><span>Pay ₹{priceData.final} & Confirm</span><ArrowRight size={28} className="group-hover:translate-x-2 transition-transform"/></>)}
                        </button>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pt-4 opacity-50">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" className="h-4" alt="Razorpay"/>
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center">256-Bit SSL Secure Connection</span>
                        </div>
                    </div>

                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}