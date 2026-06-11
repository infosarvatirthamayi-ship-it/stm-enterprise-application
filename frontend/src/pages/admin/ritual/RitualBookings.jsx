import React, { useState, useEffect } from 'react';
import { ritualBookingService } from '../../../services/ritualBookingService';
import { Eye, Search, X, ChevronLeft, ChevronRight, Calendar, User, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RitualBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bStatus, setBStatus] = useState("all");
  const [pStatus, setPStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await ritualBookingService.getAllRitualBookings();
      
      // 🛡️ CRITICAL FIX: Extract the array correctly
      // If res.data is an object, look for a likely key like 'data', 'bookings', or 'rituals'
      const data = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.data || res.data?.bookings || res.data?.rituals || []);
        
      setBookings(data);
      setFiltered(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setBookings([]);
      setFiltered([]);
    }
  };

  useEffect(() => {
    // 🛡️ Guard against non-array state
    if (!Array.isArray(bookings)) {
      setFiltered([]);
      return;
    }

    const result = bookings.filter((item) => {
      const matchesSearch = 
        (item.devotees_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (item.booking_id?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesBStatus = bStatus === "all" || item.booking_status?.toString() === bStatus;
      const matchesPStatus = pStatus === "all" || item.payment_status?.toString() === pStatus;

      return matchesSearch && matchesBStatus && matchesPStatus;
    });

    setFiltered(result);
    setCurrentPage(1);
  }, [searchTerm, bStatus, pStatus, bookings]);

  const handleClear = () => {
    setSearchTerm("");
    setBStatus("all");
    setPStatus("all");
    setCurrentPage(1);
  };

  // 🛡️ Safe Pagination Logic
  const safeFiltered = Array.isArray(filtered) ? filtered : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeFiltered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(safeFiltered.length / itemsPerPage));

  const getStatusBadge = (status, type) => {
    const configs = {
      booking: {
        "1": { label: "PENDING", class: "bg-yellow-100 text-yellow-700" },
        "2": { label: "CONFIRMED", class: "bg-blue-100 text-blue-700" },
        "3": { label: "CANCELLED", class: "bg-red-100 text-red-700" },
      },
      payment: {
        "1": { label: "PENDING", class: "bg-yellow-100 text-yellow-700" },
        "2": { label: "PAID", class: "bg-green-100 text-green-700" },
        "3": { label: "FAILED", class: "bg-red-100 text-red-700" },
      }
    };
    const config = configs[type][status?.toString()] || { label: "UNKNOWN", class: "bg-gray-100 text-gray-600" };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Ritual Bookings</h1>
            <p className="text-sm text-gray-500">Manage and monitor ritual appointments</p>
          </div>
          <div className="bg-blue-600 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-4 text-white">
            <ClipboardList size={24} />
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold">{safeFiltered.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-3 items-center">
          <input 
            className="flex-grow pl-4 py-2 bg-gray-50 border rounded-lg text-sm outline-none" 
            placeholder="Search by name or ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <select value={bStatus} onChange={(e) => setBStatus(e.target.value)} className="bg-gray-50 p-2 rounded-lg text-sm border">
            <option value="all">Booking Status</option>
            <option value="1">Pending</option>
            <option value="2">Confirmed</option>
            <option value="3">Cancelled</option>
          </select>
          <button onClick={handleClear} className="text-red-500 text-sm font-medium p-2"><X size={18} /></button>
        </div>

        {/* Desktop View Table */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-bold">
              <tr>
                <th className="p-4">Devotee & ID</th>
                <th className="p-4">Ritual</th>
                <th className="p-4">Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {currentItems.length > 0 ? currentItems.map((item) => (
                <tr key={item._id} className="hover:bg-blue-50/40">
                  <td className="p-4 font-semibold">{item.devotees_name || 'N/A'}<div className="text-xs text-gray-400">{item.booking_id}</div></td>
                  <td className="p-4">{item.ritual_id?.name || 'N/A'}</td>
                  <td className="p-4">{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</td>
                  <td className="p-4 font-bold">₹{item.paid_amount?.toLocaleString() || 0}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                        {getStatusBadge(item.payment_status, 'payment')}
                        {getStatusBadge(item.booking_status, 'booking')}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => navigate(`/admin/ritual-bookings/${item._id}`)} className="text-blue-600">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="p-10 text-center text-gray-500">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="md:hidden space-y-4">
          {currentItems.map((item) => (
            <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100" onClick={() => navigate(`/admin/ritual-bookings/${item._id}`)}>
              <div className="flex justify-between mb-4">
                <h3 className="font-bold text-gray-900">{item.devotees_name}</h3>
                <p className="font-black">₹{item.paid_amount || 0}</p>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {getStatusBadge(item.payment_status, 'payment')} 
                    {getStatusBadge(item.booking_status, 'booking')}
                </div>
                <Eye size={18} className="text-blue-600" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-xl border">
          <p className="text-sm">Showing {safeFiltered.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, safeFiltered.length)} of {safeFiltered.length}</p>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30"><ChevronLeft size={18} /></button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RitualBookings;