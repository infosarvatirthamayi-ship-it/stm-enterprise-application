import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { FaArrowLeft, FaChevronRight, FaSpinner } from "react-icons/fa";
import OfferForm from "./OfferForm";

export default function AddOffer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dependenciesLoading, setDependenciesLoading] = useState(true);
  
  // Dependency collection matrices for descriptive UI mapping
  const [temples, setTemples] = useState([]);
  const [rituals, setRituals] = useState([]);
  const [events, setEvents] = useState([]);

  // Fetch contextual relational data records in parallel on initialization
  useEffect(() => {
    const fetchSystemDependencies = async () => {
      try {
        setDependenciesLoading(true);
        
        // Concurrent requests to fetch available services (handling fallback schemas safely)
        const [templeRes, ritualRes, eventRes] = await Promise.all([
          api.get("/admin/temples?limit=1000").catch(() => ({ data: { data: [] } })),
          api.get("/admin/ritual?limit=1000").catch(() => ({ data: { data: [] } })),
          api.get("/admin/event?limit=1000").catch(() => ({ data: { data: [] } }))
        ]);

        setTemples(templeRes.data?.data || templeRes.data?.temples || []);
        setRituals(ritualRes.data?.data || ritualRes.data?.rituals || []);
        setEvents(eventRes.data?.data || eventRes.data?.events || []);
      } catch (err) {
        toast.error("Failed to harmonize structural application dependencies.");
      } finally {
        setDependenciesLoading(false);
      }
    };

    fetchSystemDependencies();
  }, []);

  const handleSubmit = async (formData) => {
    setLoading(true);
    const payload = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "image" && !formData.image) return; 
      if (key === "discount_percentage" && formData.discount_type === "flat") return;
      if (key === "discount_amount" && formData.discount_type === "percentage") return;
      
      // Ensure values map securely without breaking structural validation
      if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });

    try {
      await api.post("/admin/offers", payload, { 
        headers: { "Content-Type": "multipart/form-data" } 
      });
      toast.success("Offer campaign initialized successfully.");
      setTimeout(() => navigate("/admin/offers"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deploy target offer structure.");
    } finally {
      setLoading(false);
    }
  };

  if (dependenciesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mb-4" />
        <p className="text-slate-500 font-bold tracking-widest text-xs uppercase animate-pulse">
          Synchronizing System Service Registries...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      
      {/* BREADCRUMB TRAIL */}
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6 max-w-4xl mx-auto">
        <Link to="/admin/offers" className="hover:text-indigo-600 transition-colors">Offers</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Create Promotion</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/80 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">System Deal Configuration</h1>
        </div>
        
        {/* Pass fetched data directly into the underlying subform architecture */}
        <OfferForm 
          onSubmit={handleSubmit} 
          loading={loading} 
          temples={temples}
          rituals={rituals}
          events={events}
        />
      </div>
    </div>
  );
}