import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { getFullImageUrl } from "../../../utils/config";
import { Loader2, ChevronLeft, MapPin } from "lucide-react";

export default function TempleBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [temple, setTemple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bookingDate: "",
    devoteeName: "",
    whatsappNumber: "",
    specialWish: ""
  });

  const isAuthorizedMember = useMemo(() => Number(user?.status) === 1 && user?.membership === "active", [user]);

  const { finalPrice, discountLabel, isFree } = useMemo(() => {
    if (!temple) return { finalPrice: "0.00", discountLabel: "", isFree: true };
    const basePrice = Number(temple.visit_price || 0);
    if (temple.is_free_today || basePrice === 0) return { finalPrice: "0.00", discountLabel: "Free Entry Granted", isFree: true };
    return { finalPrice: basePrice.toFixed(2), discountLabel: "", isFree: false };
  }, [temple]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/user/login"); return; }
    if (!id || id === "undefined") { navigate("/user/temples"); return; }

    const fetchTemple = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/temples/${id}`);
        const templeData = res.data?.data || res.data?.temple;
        if (!templeData) throw new Error();
        setTemple(templeData);
        setFormData(prev => ({ 
          ...prev, 
          devoteeName: user.name || "", 
          whatsappNumber: user.mobile_number || "" 
        }));
      } catch (err) {
        toast.error("Temple details not found");
        navigate("/user/temples");
      } finally {
        setLoading(false);
      }
    };
    fetchTemple();
  }, [id, authLoading, user, navigate]);

  const handlePayment = async () => {
    if (!formData.bookingDate) return toast.error("Please select a visit date");
    if (!formData.whatsappNumber?.match(/^[0-9]{10}$/)) return toast.error("Enter a valid 10-digit number");
    
    const templeId = temple?.sql_id || temple?.id || temple?._id;
    if (!templeId) return toast.error("System Error: Missing Temple ID");

    setSubmitting(true);
    try {
      // 🎯 STRICT PAYLOAD: Matches backend requirements
      const payload = {
        templeId: templeId,
        date: formData.bookingDate,
        whatsAppNumber: formData.whatsappNumber, // Must match what controller expects
        devoteeName: formData.devoteeName,
        wish: formData.specialWish || ""
      };

      const res = await api.post("/user/temple/booking", payload);
      const { data } = res.data;
      
      if (isFree || Number(finalPrice) === 0) {
          toast.success("Darshan Booked!");
          return navigate("/user/temple/booking-details");
      }

      const options = {
        key: data.payment.razorpay_public_key,
        amount: Math.round(Number(finalPrice) * 100),
        order_id: data.payment.razorpay_order_id,
        name: "Sarvatirthamayi",
        description: `Darshan: ${temple?.name}`,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/user/temple/verify-payment", response);
            if (verifyRes.data.success) {
              toast.success("Payment Successful!");
              navigate("/user/temple/booking-details");
            }
          } catch (error) { toast.error("Payment verification failed."); }
        },
        theme: { color: "#4F46E5" }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50 text-slate-900 font-sans">
      <Toaster />
      <main className="max-w-6xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="mb-8 font-bold text-xs uppercase flex items-center gap-2 text-slate-500">
           <ChevronLeft size={16} /> Back
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-xl overflow-hidden">
             <img src={getFullImageUrl(temple?.image)} alt={temple?.name} className="w-full h-48 object-cover" />
             <div className="p-8">
                <h2 className="text-2xl font-black">{temple?.name}</h2>
                <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
                    <span className="font-black text-slate-800">Total Payable</span>
                    <span className="text-3xl font-black text-indigo-600">{isFree ? "FREE" : `₹${finalPrice}`}</span>
                </div>
             </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200">
              <h3 className="text-2xl font-black mb-8">Booking Details</h3>
              <div className="space-y-5">
                  <input type="date" className="w-full h-14 pl-4 bg-slate-50 rounded-xl" onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}/>
                  <input placeholder="Primary Devotee" value={formData.devoteeName} className="w-full h-14 pl-4 bg-slate-50 rounded-xl" onChange={(e) => setFormData({...formData, devoteeName: e.target.value})}/>
                  <input placeholder="WhatsApp Number" value={formData.whatsappNumber} className="w-full h-14 pl-4 bg-slate-50 rounded-xl" onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}/>
                  <textarea placeholder="Special Wishes" className="w-full py-4 pl-4 h-32 bg-slate-50 rounded-xl" onChange={(e) => setFormData({...formData, specialWish: e.target.value})}/>
              </div>
              <button onClick={handlePayment} disabled={submitting} className="w-full bg-indigo-600 text-white h-16 rounded-2xl font-black mt-8">
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : <span>{isFree ? "Confirm Free Booking" : `Pay ₹${finalPrice}`}</span>}
              </button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}