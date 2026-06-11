import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api/api';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaSpinner, FaUser, FaCalendarAlt, FaRupeeSign, FaPhone, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function EventBookingView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/admin/event-bookings/${id}`);
        setBooking(res.data.data);
      } catch (err) {
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><FaSpinner className="animate-spin text-indigo-600 text-3xl" /></div>;
  if (!booking) return <div className="p-8 text-center text-slate-500">Booking not found.</div>;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-bold uppercase text-xs tracking-widest">
        <FaArrowLeft /> Back to Bookings
      </button>

      <div className="max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Booking Details</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">ID: {booking._id}</p>
          </div>
          <span className={`px-4 py-2 text-xs font-black rounded-lg flex items-center gap-2 ${booking.booking_status === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {booking.booking_status === 2 ? <><FaCheckCircle /> CONFIRMED</> : <><FaClock /> PENDING</>}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* LEFT COLUMN: Devotee Info */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Devotee Name</label>
              <div className="flex items-center gap-3 text-slate-700 font-bold text-lg"><FaUser className="text-indigo-600" /> {booking.devotees_name}</div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Contact</label>
              <div className="flex items-center gap-3 text-slate-700 font-bold"><FaPhone className="text-indigo-600" /> {booking.whatsapp_number}</div>
            </div>
          </div>

          {/* RIGHT COLUMN: Event Info */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Event Name</label>
              <div className="flex items-center gap-3 text-slate-700 font-bold">{booking.event_id?.name || "N/A"}</div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Paid Amount</label>
              <div className="flex items-center gap-3 text-indigo-600 font-black text-2xl"><FaRupeeSign /> {(booking.paid_amount || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}