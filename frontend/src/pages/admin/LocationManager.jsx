import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiMapPin, FiPlus, FiX, FiSearch } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../api/api';

const LocationManager = () => {
    const [activeTab, setActiveTab] = useState('countries'); // 'countries' or 'cities'
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);

    const [formData, setFormData] = useState({ name: '', code: '', phone_code: '', state_id: '', state: '' });

    // Fetch Initial Data
    useEffect(() => {
        fetchLocations('countries');
        fetchLocations('cities');
    }, []);

    const fetchLocations = async (type) => {
        try {
            const res = await api.get(`/admin/locations/${type}`);
            if (type === 'countries') setCountries(res.data.data);
            else setCities(res.data.data);
        } catch (error) {
            toast.error(`Failed to load ${type}`);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'countries' ? '/admin/locations/countries' : '/admin/locations/cities';
            const payload = activeTab === 'countries' 
                ? { name: formData.name, code: formData.code, phone_code: formData.phone_code }
                : { name: formData.name, state_id: formData.state_id, state: formData.state };

            const res = await api.post(endpoint, payload);
            
            if (res.data.success) {
                toast.success(res.data.message);
                setIsModalOpen(false);
                setFormData({ name: '', code: '', phone_code: '', state_id: '', state: '' });
                // Instantly update UI without refreshing
                if (activeTab === 'countries') setCountries([...countries, res.data.data]);
                else setCities([res.data.data, ...cities]); // Add to top of list
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    // Filter logic for the search bar
    const displayedData = activeTab === 'countries' 
        ? countries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : cities.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
            <Toaster position="top-right" />
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Location Manager</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage global countries and local cities for the STM platform.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 transition shadow-lg shadow-purple-600/30"
                >
                    <FiPlus /> Add New {activeTab === 'countries' ? 'Country' : 'City'}
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div className="flex bg-white rounded-2xl shadow-sm p-1 border border-slate-100 w-max">
                    <TabButton active={activeTab === 'countries'} onClick={() => setActiveTab('countries')} icon={<FiGlobe />} label="Countries" count={countries.length} />
                    <TabButton active={activeTab === 'cities'} onClick={() => setActiveTab('cities')} icon={<FiMapPin />} label="Cities" count={cities.length} />
                </div>

                <div className="relative w-full md:w-72">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab}...`} 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-12 pr-4 py-3 rounded-2xl font-medium focus:outline-none focus:border-purple-500 transition"
                    />
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-black text-slate-400">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Name</th>
                            {activeTab === 'countries' ? (
                                <>
                                    <th className="px-6 py-4">ISO Code</th>
                                    <th className="px-6 py-4">Phone Code</th>
                                </>
                            ) : (
                                <>
                                    <th className="px-6 py-4">State</th>
                                    <th className="px-6 py-4">Legacy SQL ID</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
                        {displayedData.map((item, i) => (
                            <tr key={item._id || i} className="hover:bg-slate-50 transition">
                                <td className="px-6 py-4 text-slate-400 font-mono text-xs">{String(item._id).slice(-6)}</td>
                                <td className="px-6 py-4">{item.name}</td>
                                {activeTab === 'countries' ? (
                                    <>
                                        <td className="px-6 py-4 text-purple-600">{item.code}</td>
                                        <td className="px-6 py-4">{item.phone_code}</td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4">{item.state || "—"}</td>
                                        <td className="px-6 py-4 text-emerald-600">{item.sql_id}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {displayedData.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-medium">No records found.</div>
                )}
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl relative w-full max-w-md overflow-hidden z-10">
                            
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="font-black text-lg text-slate-800">Add New {activeTab === 'countries' ? 'Country' : 'City'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm"><FiX /></button>
                            </div>

                            <div className="p-6 space-y-4">
                                <InputField label={`${activeTab === 'countries' ? 'Country' : 'City'} Name`} value={formData.name} onChange={(v) => setFormData({...formData, name: v})} placeholder="e.g. United Kingdom" />
                                
                                {activeTab === 'countries' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="ISO Code" value={formData.code} onChange={(v) => setFormData({...formData, code: v})} placeholder="e.g. UK" />
                                        <InputField label="Phone Code" value={formData.phone_code} onChange={(v) => setFormData({...formData, phone_code: v})} placeholder="e.g. 44" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="State Name" value={formData.state} onChange={(v) => setFormData({...formData, state: v})} placeholder="Optional" />
                                        <InputField label="State ID" type="number" value={formData.state_id} onChange={(v) => setFormData({...formData, state_id: v})} placeholder="e.g. 10" />
                                    </div>
                                )}

                                <button 
                                    onClick={handleSave} 
                                    disabled={loading} 
                                    className="w-full py-4 mt-2 bg-slate-900 text-white rounded-2xl font-black hover:bg-purple-600 transition shadow-lg disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save Record"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// UI Helpers
const TabButton = ({ active, icon, label, count, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${active ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
        {icon} {label} <span className={`text-[10px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
    </button>
);

const InputField = ({ label, value, onChange, placeholder, type = "text" }) => (
    <div className="space-y-1">
        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">{label}</label>
        <input 
            type={type} 
            placeholder={placeholder}
            className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
        />
    </div>
);

export default LocationManager;