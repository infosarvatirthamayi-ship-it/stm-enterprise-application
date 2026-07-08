// src/pages/user/Temples/TempleBooking.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../../context/UserAuthContext"; 
import { useTheme } from "../../../context/ThemeContext";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { getFullImageUrl } from "../../../utils/config";
import { Loader2, ChevronLeft, Calendar, User, Phone, Edit3, ShieldCheck, Ticket, Crown } from "lucide-react";

export default function TempleBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode: dark } = useTheme();
  const { user, authenticated, loading: authLoading } = useUserAuth();

  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    bookingDate: "", devoteeName: "", whatsappNumber: "", specialWish: "", voucherCode: ""
  });

  useEffect(() => {
    if (!authLoading && !authenticated) {
      toast("Please login to secure your booking.", { icon: "🔒" });
      navigate("/user/login", { state: { from: `/user/book-temple/${id}` } }); 
    }
  }, [authLoading, authenticated, navigate, id]);

  useEffect(() => {
    if (authLoading || !authenticated) return;
    if (!id || id === "undefined") return navigate("/user/temples");

    const fetchTemple = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/web/temples/${id}`);
        const templeData = res.data?.data || res.data?.temple;
        if (!templeData) throw new Error("Not found");
        
        setTemple(templeData);
        setFormData(prev => ({ 
          ...prev, 
          devoteeName: user?.first_name || user?.name || "", 
          whatsappNumber: user?.mobile_number?.replace(/\D/g, '').slice(-10) || "" 
        }));
      } catch (err) {
        toast.error("Temple details could not be verified.");
        navigate("/user/temples");
      } finally {
        setLoading(false);
      }
    };
    fetchTemple();
  }, [id, authLoading, authenticated, user, navigate]);

  const handlePayment = async () => {
    if (!formData.bookingDate) return toast.error("Please select a sacred visit date.");
    const selectedDate = new Date(formData.bookingDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) return toast.error("Booking date cannot be in the past.");
    if (!formData.devoteeName.trim()) return toast.error("Primary devotee name is required.");
    if (!formData.whatsappNumber.match(/^[0-9]{10}$/)) return toast.error("Please enter a valid 10-digit WhatsApp number.");
    
    const templeId = temple?._id || temple?.id || temple?.sql_id;
    if (!templeId) return toast.error("System Error: Unidentified Temple.");

    setSubmitting(true);
    const loadingToast = toast.loading("Securing your digital pass...");

    try {
      const payload = {
        date: formData.bookingDate,
        devotees_name: formData.devoteeName.trim(),
        whatsapp_number: formData.whatsappNumber,
        wish: formData.specialWish.trim() || "",
        voucher_code: formData.voucherCode.trim() || null
      };

      const res = await api.post(`/web/temples/${templeId}/book`, payload);
      const { requires_payment, booking, payment_gateway_data } = res.data.data;

      if (requires_payment === false) {
          toast.success("Darshan Secured! Pass activated.", { id: loadingToast });
          return navigate("/user/my-temple-bookings"); 
      }

      toast.dismiss(loadingToast);
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || payment_gateway_data.razorpay_public_key, // 🎯 FIX: import.meta.env
        amount: payment_gateway_data.amount,
        currency: payment_gateway_data.currency,
        order_id: payment_gateway_data.id,
        name: "Sarvatirthamayi",
        description: `Digital Pass: ${temple?.name}`,
        handler: async (response) => {
          const verifyToast = toast.loading("Verifying cryptographic signature...");
          try {
            const verifyRes = await api.post("/web/temples/verify-booking", {
                ...response, booking_id: booking.booking_id
            });
            if (verifyRes.data.success) {
              toast.success("Payment Confirmed! Pass activated.", { id: verifyToast });
              navigate("/user/my-temple-bookings");
            } else throw new Error("Verification failed.");
          } catch (error) { toast.error(error.message, { id: verifyToast }); }
        },
        prefill: { name: formData.devoteeName, contact: formData.whatsappNumber, email: user?.email || "" },
        theme: { color: "#9333ea" },
        modal: { ondismiss: () => setSubmitting(false) }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error("Transaction declined."); setSubmitting(false); });
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || "Secure gateway connection failed.", { id: loadingToast });
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center dark:bg-[#0a0a1a]"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

  return (
    <div className={`min-h-screen pt-28 pb-20 font-sans transition-colors duration-500 ${dark ? 'bg-[#0a0a1a] text-slate-200' : 'bg-[#f8fafc] text-slate-900'}`}>
      <Toaster position="top-center" />
      <main className="max-w-6xl mx-auto px-6">
        
        <button onClick={() => navigate(-1)} className="mb-10 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors">
           <div className={`p-2 rounded-lg shadow-sm border ${dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}><ChevronLeft size={14} /></div> 
           Return to Details
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          
          {/* LEFT: Temple Summary */}
          <div className="xl:col-span-5 h-fit bg-slate-950 rounded-[2.5rem] shadow-xl overflow-hidden sticky top-28 border border-slate-800">
             <div className="relative h-56">
                <img src={getFullImageUrl(temple?.image)} alt={temple?.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                   <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1.5 flex items-center gap-1.5"><ShieldCheck size={14}/> Verified Location</p>
                   <h2 className="text-2xl font-serif font-black leading-tight">{temple?.name}</h2>
                </div>
             </div>
             
             <div className="p-8 text-white">
                <div className="mb-6">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Standard Price</p>
                  <span className="text-3xl font-black font-serif">
                    {temple?.is_free_today || temple?.visit_price === 0 ? <span className="text-emerald-400">Free Entry</span> : `₹${temple?.visit_price}`}
                  </span>
                </div>

                {/* 🎯 THE STM CLUB UPSELL BANNER */}
                {temple?.visit_price > 0 && (
                  <div className="bg-gradient-to-br from-amber-500/20 to-purple-500/10 border border-amber-500/30 p-5 rounded-2xl">
                    <h4 className="flex items-center gap-2 font-black text-amber-400 text-sm mb-2"><Crown size={16} /> STM Club Members</h4>
                    <p className="text-xs text-slate-300 font-medium mb-4 leading-relaxed">Join the club to get up to 5 free sacred visits, and 25% off all future bookings.</p>
                    <button onClick={() => navigate('/user/stm-club')} className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                      Upgrade to Club
                    </button>
                  </div>
                )}
             </div>
          </div>

          {/* RIGHT: Booking Form */}
          <div className="xl:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[3rem] p-8 md:p-12 shadow-2xl border ${dark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-100'}`}>
              <h3 className="text-3xl font-black font-serif tracking-tight mb-8">Sacred Details</h3>

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
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">WhatsApp Number (For Pass)</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                      <input 
                        type="tel" maxLength="10" placeholder="10-digit number" value={formData.whatsappNumber} 
                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold tracking-widest ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>

                  {/* 🎟️ VOUCHER CODE INPUT */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Promo / Voucher Code</label>
                    <div className="relative">
                      <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" size={20} />
                      <input 
                        placeholder="Got a discount code?" value={formData.voucherCode} 
                        className={`w-full h-16 pl-14 pr-6 border-2 rounded-2xl outline-none focus:border-purple-500 transition-all font-bold uppercase tracking-widest ${dark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700'}`} 
                        onChange={(e) => setFormData({...formData, voucherCode: e.target.value})}
                      />
                    </div>
                  </div>

              </div>

              <button onClick={handlePayment} disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-20 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs mt-10 shadow-2xl shadow-purple-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                {submitting ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><ShieldCheck size={20}/> Secure My Booking</>}
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}