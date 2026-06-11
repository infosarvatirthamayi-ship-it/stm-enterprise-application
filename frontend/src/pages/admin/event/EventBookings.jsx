import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api/api';
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaSpinner, FaChevronRight, FaChevronLeft, FaInbox, 
  FaSearch, FaTimes, FaEye, FaTrash 
} from 'react-icons/fa';

export default function EventBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0); 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [limit] = useState(10);

  useEffect(() => {
    fetchBookings();
    fetchBookingCount();
  }, [currentPage]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/event-bookings?page=${currentPage}&limit=${limit}`);
      setBookings(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error("Could not load event bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingCount = async () => {
    try {
        const res = await api.get("/admin/event-bookings/count");
        setTotalCount(res.data.count || 0);
    } catch (err) {
        console.error("Failed to fetch count");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await api.delete(`/admin/event-bookings/${id}`);
      toast.success("Booking deleted successfully");
      fetchBookings();
      fetchBookingCount(); 
    } catch (err) {
      toast.error("Failed to delete booking");
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (b.devotees_name || "").toLowerCase().includes(searchLower) ||
        (b.event_id?.name || "").toLowerCase().includes(searchLower) ||
        (b.temple_id?.name || "").toLowerCase().includes(searchLower);
      
      const statusText = b.booking_status === 2 ? "Confirmed" : "Pending";
      const matchesStatus = statusFilter === "All" || statusText === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, bookings]);

  const getPaginationGroup = () => {
    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pages = [1];
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans">
      <Toaster />

      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Event Bookings</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Event Bookings</h1>
          <div className="flex gap-2 mt-2">
            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                Page {currentPage} of {totalPages}
            </span>
            <span className="text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                Total Bookings: {totalCount}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by devotee, event, or temple..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none text-sm transition-all focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
            className="px-6 py-3 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold text-slate-600 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option>All</option>
            <option>Pending</option>
            <option>Confirmed</option>
        </select>
        <button onClick={() => { setSearchTerm(""); setStatusFilter("All"); }} className="px-4 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
            <FaTimes />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
          <p className="text-slate-400 font-bold text-sm">Loading Bookings...</p>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Devotee</th>
                <th className="px-8 py-5">Temple</th>
                <th className="px-8 py-5">Event</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-800">{b.devotees_name || "Unknown"}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{b.temple_id?.name || "N/A"}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{b.event_id?.name || "N/A"}</td>
                  <td className="px-8 py-5 font-black text-indigo-600">₹{(b.paid_amount || 0).toLocaleString()}</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg ${b.booking_status === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {b.booking_status === 2 ? 'CONFIRMED' : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/admin/event-booking/view/${b._id}`)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><FaEye /></button>
                      <button onClick={() => handleDelete(b._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"><FaTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 border text-center text-slate-400">
            <FaInbox size={40} className="mx-auto mb-4 opacity-50" />
            <p>No bookings found.</p>
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className="mt-8 flex justify-center items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev-1, 1))} className="w-10 h-10 border bg-white rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"><FaChevronLeft className="mx-auto"/></button>
            {getPaginationGroup().map((p, i) => (
                <button key={i} onClick={() => typeof p === 'number' && setCurrentPage(p)} className={`w-10 h-10 rounded-xl font-bold text-xs ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev+1, totalPages))} className="w-10 h-10 border bg-white rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"><FaChevronRight className="mx-auto"/></button>
        </div>
      )}
    </div>
  );
}