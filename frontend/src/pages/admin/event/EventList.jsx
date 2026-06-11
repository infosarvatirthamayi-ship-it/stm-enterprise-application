import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 🎯 Added useNavigate
import api from '../../../api/api'; 
import { toast, Toaster } from 'react-hot-toast';
import { 
  FaSpinner, FaChevronRight, FaChevronLeft, FaInbox, 
  FaSearch, FaTimes, FaEdit, FaTrash, FaPlus, FaEye // 🎯 Added FaEye
} from 'react-icons/fa';

export default function Events() {
  const navigate = useNavigate(); // 🎯 Initialized navigate
  const [events, setEvents] = useState([]);
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [limit] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    temple_id: "",
    name: "",
    date: "",
    price: 0,
    short_description: "",
    status: 1
  });

  useEffect(() => {
    fetchEvents();
    fetchTemples();
  }, [currentPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/events?page=${currentPage}&limit=${limit}`);
      setEvents(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error("Could not load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchTemples = async () => {
    try {
      const res = await api.get("/admin/temples"); 
      setTemples(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch temples for dropdown");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await api.delete(`/admin/events/${id}`);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (err) {
      toast.error("Failed to delete event");
    }
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setEditId(event._id);
      setFormData({
        temple_id: event.temple_id?._id || event.temple_id?.sql_id || "",
        name: event.name || "",
        date: event.date ? event.date.split('T')[0] : "",
        price: event.price || 0,
        short_description: event.short_description || "",
        status: event.status || 1
      });
    } else {
      setEditId(null);
      setFormData({ temple_id: "", name: "", date: "", price: 0, short_description: "", status: 1 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/admin/events/${editId}`, formData);
        toast.success("Event updated successfully!");
      } else {
        await api.post("/admin/events", formData);
        toast.success("Event created successfully!");
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const searchLower = searchTerm.toLowerCase();
      return (e.name || "").toLowerCase().includes(searchLower) ||
             (e.temple_id?.name || "").toLowerCase().includes(searchLower);
    });
  }, [searchTerm, events]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans">
      <Toaster />

      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
        <Link to="/admin/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Events Management</span>
      </nav>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Events</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <FaPlus /> Create Event
        </button>
      </div>

      {/* SEARCH */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search events by name or temple..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 outline-none text-sm transition-all focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
          <p className="text-slate-400 font-bold text-sm">Loading Events...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Event Name</th>
                <th className="px-8 py-5">Temple</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEvents.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-800">{e.name}</td>
                  <td className="px-8 py-5 text-slate-500 font-medium">{e.temple_id?.name || "N/A"}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{e.date ? new Date(e.date).toLocaleDateString() : "TBD"}</td>
                  <td className="px-8 py-5 font-black text-indigo-600">₹{(e.price || 0).toLocaleString()}</td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 🎯 Added the View Button Here */}
                      <button 
                        onClick={() => navigate(`/admin/event/view/${e._id}`)} 
                        title="View Event"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(e)} 
                        title="Edit Event"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(e._id)} 
                        title="Delete Event"
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <FaTrash />
                      </button>
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
            <p>No events found.</p>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">
                {editId ? "Edit Event" : "Create New Event"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><FaTimes size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Temple</label>
                <select
                  required
                  value={formData.temple_id}
                  onChange={(e) => setFormData({ ...formData, temple_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700"
                >
                  <option value="" disabled>-- Choose a Temple --</option>
                  {temples.map((t) => (
                    <option key={t._id} value={t._id || t.sql_id}>{t.name}</option> 
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Event Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-700"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-medium text-slate-700"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                  {editId ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}