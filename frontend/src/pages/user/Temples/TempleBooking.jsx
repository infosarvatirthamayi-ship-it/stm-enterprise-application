import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext"; 
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { getFullImageUrl } from "../../../utils/config";
import { 
    Loader2, ChevronLeft, Calendar, User, Phone, 
    Ticket, ShieldCheck, Crown, Sparkles, Heart
} from "lucide-react";

export default function TempleBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  const { user, authenticated, loading: authLoading } = useUserAuth();

  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [priceData, setPriceData] = useState({ 
      base: 0, final: 0, memberDiscount: 0, voucherDiscount: 0, isMember: false 
  });
  
  const [formData, setFormData] = useState({ 
      bookingDate: "", devoteeName: "", whatsappNumber: "", specialWish: "", voucherCode: "" 
  });

  // 1. Auth Protection
  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast("Please login to secure your booking.", { icon: "🔐" });
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

        const membershipData = memberRes.status === "fulfilled" ? memberRes.value.data?.data : null;
        const isMember = !!membershipData; 

        setTemple(templeData);
        
        let basePrice = Number(templeData?.visit_price) || 0;
        let discount = isMember ? (basePrice * 25) / 100 : 0;
        
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
        console.error("Booking Init Error:", err);
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
          return navigate("/user/my-temple-bookings"); 
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
              toast.success("Payment Confirmed! Pass activated.", { id: verifyToast });
              navigate("/user/my-temple-bookings");
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

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-[#0a0a1a]"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className={`min-h-screen pt-28 pb-20 font-sans transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster position="top-center" />
      <main className="max-w-6xl mx-auto px-6">
        
        <button onClick={() => navigate(-1)} className="mb-8 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors">
           <div className={`p-2 rounded-lg shadow-sm border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><ChevronLeft size={14} /></div> 
           Return to Details
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* Left Column - Pricing & Image */}
          <div className="xl:col-span-5 h-fit space-y-6 sticky top-28">
             <div className="bg-slate-950 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-800">
                <div className="relative h-48">
                    <img 
                      src={getFullImageUrl(temple?.image)} 
                      alt={temple?.name || "Temple"} 
                      className="w-full h-full object-cover" 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545641203-7d072a14e3b2?q=80&w=800'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                </div>
                <div className="p-8 text-white relative -mt-12 z-10">
                    <h2 className="text-2xl font-serif font-black leading-tight mb-6">{temple?.name || "Sacred Temple"}</h2>
                    
                    {priceData.isMember ? (
                        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-4">
                            <div className="p-2 bg-emerald-500 text-white rounded-xl"><Crown size={20} /></div>
                            <div>
                                <h4 className="font-black text-emerald-400 text-sm mb-1 uppercase tracking-widest">Active Member</h4>
                                <p className="text-xs text-slate-300 font-medium">Your 25% STM Club discount is automatically applied.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/10 border border-amber-500/30 p-5 rounded-2xl">
                            <h4 className="flex items-center gap-2 font-black text-amber-400 text-sm mb-2"><Crown size={16} /> Unlock 25% Off</h4>
                            <p className="text-xs text-slate-300 font-medium mb-4">Join the STM Club today to get instant discounts on all Darshans.</p>
                            <button onClick={() => navigate('/user/stm-club')} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                                View Club Benefits
                            </button>
                        </div>
                    )}
                </div>
             </div>

             <div className={`p-6 rounded-[2rem] border shadow-lg ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Fare Breakdown</h3>
                 <div className="space-y-3 text-sm font-bold">
                     <div className="flex justify-between items-center text-slate-500">
                         <span>Standard Darshan</span>
                         <span>₹{priceData.base}</span>
                     </div>
                     {priceData.memberDiscount > 0 && (
                         <div className="flex justify-between items-center text-emerald-500">
                             <span className="flex items-center gap-1.5"><Crown size={14}/> Member Savings</span>
                             <span>-₹{priceData.memberDiscount}</span>
                         </div>
                     )}
                     {priceData.voucherDiscount > 0 && (
                         <div className="flex justify-between items-center text-purple-500">
                             <span className="flex items-center gap-1.5"><Ticket size={14}/> Promo Applied</span>
                             <span>-₹{priceData.voucherDiscount}</span>
                         </div>
                     )}
                     <div className={`flex justify-between items-center pt-4 border-t ${dark ? 'border-slate-800' : 'border-slate-100'} text-xl font-black`}>
                         <span>Total Payable</span>
                         <span className="text-purple-600">₹{priceData.final}</span>
                     </div>
                 </div>
             </div>
          </div>

          {/* Right Column - Form */}
          <div className="xl:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[3rem] p-8 md:p-12 shadow-2xl border ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
              <h3 className="text-3xl font-black font-serif tracking-tight mb-8 flex items-center gap-3">
                  Sacred Details {priceData.isMember && <Sparkles className="text-amber-400" size={24}/>}
              </h3>

              <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Date of Visit</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                      <input 
                        type="date" min={new Date().toISOString().split("T")[0]}
                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        value={formData.bookingDate} onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Primary Devotee Name</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                      <input 
                        placeholder="Enter full name" value={formData.devoteeName} 
                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        onChange={(e) => setFormData({...formData, devoteeName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp Number (For Digital Pass)</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                      <input 
                        type="tel" maxLength="10" placeholder="10-digit number" value={formData.whatsappNumber} 
                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold tracking-widest ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Special Prayers / Wish (Optional)</label>
                    <div className="relative">
                      <Heart className="absolute left-5 top-6 text-purple-500" size={20} />
                      <textarea 
                        placeholder="Any specific prayer requests..." value={formData.specialWish} rows="2"
                        className={`w-full py-5 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold resize-none ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        onChange={(e) => setFormData({...formData, specialWish: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Promo Code</label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                          <input 
                            placeholder="Got a discount code?" value={formData.voucherCode} 
                            className={`w-full h-14 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold uppercase tracking-widest ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                            onChange={(e) => setFormData({...formData, voucherCode: e.target.value})}
                          />
                        </div>
                        <button 
                            onClick={applyVoucher}
                            className={`px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors ${dark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}`}
                        >
                            Apply
                        </button>
                    </div>
                  </div>
              </div>

              <button 
                onClick={handlePayment} 
                disabled={submitting} 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs mt-10 shadow-2xl shadow-purple-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {submitting ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><ShieldCheck size={20}/> Pay ₹{priceData.final}</>}
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}