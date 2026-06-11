import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../../api/api";
import { toast, Toaster } from "react-hot-toast";
import { FaArrowLeft, FaChevronRight, FaSpinner } from "react-icons/fa";
import OfferForm from "./OfferForm";

export default function EditOffer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await api.get(`/admin/offers/${id}`);
        setInitialData(res.data.data);
      } catch (err) {
        toast.error("Failed to load offer parameters.");
        navigate("/admin/offers");
      } finally {
        setFetching(false);
      }
    };
    fetchOffer();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    const payload = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "image" && !formData.image) return; 
      if (key === "discount_percentage" && formData.discount_type === "flat") return;
      if (key === "discount_amount" && formData.discount_type === "percentage") return;
      
      if (formData[key] !== null && formData[key] !== "") {
        payload.append(key, formData[key]);
      }
    });

    try {
      await api.put(`/admin/offers/${id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Offer logic updated.");
      setTimeout(() => navigate("/admin/offers"), 1000);
    } catch (err) {
      toast.error("Failed to update offer.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-indigo-600 text-4xl mb-4" />
        <p className="text-slate-500 font-bold animate-pulse tracking-widest text-sm uppercase">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 bg-[#f8fafc] min-h-screen font-sans">
      <Toaster />
      <nav className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6 max-w-4xl mx-auto">
        <Link to="/admin/offers" className="hover:text-indigo-600 transition-colors">Offers</Link>
        <FaChevronRight size={8} />
        <span className="text-slate-600">Modify Promotion</span>
      </nav>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/80 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
            <FaArrowLeft />
          </button>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Edit Configuration</h1>
        </div>
        <OfferForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}