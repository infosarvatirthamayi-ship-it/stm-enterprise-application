import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  Crown,
  MapPin,
  ScrollText,
  Clock,
  CheckCircle,
  Settings2,
  ArrowUpRight,
  Ticket,
  Gift,
  Activity,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

import api from "../../api/api";

/*
|--------------------------------------------------------------------------
| Dashboard Home
|--------------------------------------------------------------------------
*/
export default function DashboardHome() {

  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [settings, setSettings] = useState({
    ritualDiscountRate: 25,
    offerThreshold: 5000,
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD DASHBOARD
  |--------------------------------------------------------------------------
  */
  const loadDashboard = useCallback(async () => {

    try {

      setRefreshing(true);

      const response = await api.get(
        "/admin/dashboard-stats"
      );

      const dashboardData = response?.data?.data || {};

      setStats(dashboardData);

      /*
      |--------------------------------------------------------------------------
      | GLOBAL SETTINGS
      |--------------------------------------------------------------------------
      */
      setSettings({
        ritualDiscountRate:
          dashboardData?.ritualDiscountRate || 25,

        offerThreshold:
          dashboardData?.offerThreshold || 5000,
      });

    } catch (error) {

      console.error(error);

      toast.error(
        "Unable to synchronize dashboard metrics."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);
    }

  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */
  useEffect(() => {

    loadDashboard();

  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE GLOBAL SETTINGS
  |--------------------------------------------------------------------------
  */
  const handleUpdateSettings = async () => {

    try {

      await api.put(
        "/admin/settings/global-discount",
        settings
      );

      toast.success(
        "Global settings updated successfully."
      );

    } catch (error) {

      console.error(error);

      toast.error(
        "Failed to update global settings."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DASHBOARD METRICS
  |--------------------------------------------------------------------------
  */
  const metricCards = useMemo(() => {

    if (!stats) return [];

    return [
      {
        title: "Total Devotees",
        value: stats.totalUsers || 0,
        icon: Users,
        color: "bg-blue-600",
      },

      {
        title: "Sovereign Members",
        value: stats.sovereignMembers || 0,
        icon: Crown,
        color: "bg-amber-500",
      },

      {
        title: "Temple Bookings",
        value: stats.templeBookings || 0,
        icon: MapPin,
        color: "bg-emerald-600",
      },

      {
        title: "Ritual Bookings",
        value: stats.ritualBookings || 0,
        icon: ScrollText,
        color: "bg-purple-600",
      },
    ];

  }, [stats]);

  /*
  |--------------------------------------------------------------------------
  | LOADING STATE
  |--------------------------------------------------------------------------
  */
  if (loading) {

    return (
      <DashboardSkeleton />
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

        <div>

          <div className="flex items-center gap-2 mb-2">

            <Activity
              size={18}
              className="text-indigo-600"
            />

            <span className="text-xs font-black tracking-[0.3em] uppercase text-indigo-600">
              Live Operations
            </span>

          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">

            Spiritual Oversight

          </h1>

          <p className="mt-2 text-slate-500 font-medium max-w-2xl">

            Real-time operational intelligence and spiritual ecosystem monitoring dashboard.

          </p>

        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm">

            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">
              System Time
            </p>

            <p className="text-sm font-bold text-slate-700 mt-1">
              {new Date().toLocaleTimeString()}
            </p>

          </div>

          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="h-14 px-5 rounded-2xl bg-slate-900 text-white flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
          >

            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />

            <span className="font-bold text-sm">
              Refresh
            </span>

          </button>

        </div>

      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {metricCards.map((card) => (

          <MetricCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />

        ))}

      </div>

      {/* SECONDARY GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* SETTINGS */}
        <div className="xl:col-span-4 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">

          <div className="flex items-center gap-3 mb-8">

            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">

              <Settings2
                size={20}
                className="text-indigo-600"
              />

            </div>

            <div>

              <h3 className="font-black text-slate-900">
                Global Controls
              </h3>

              <p className="text-sm text-slate-500">
                Configure spiritual commerce rules.
              </p>

            </div>

          </div>

          <div className="space-y-6">

            {/* Ritual Discount */}
            <div>

              <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-500">

                Ritual Discount (%)

              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={settings.ritualDiscountRate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    ritualDiscountRate: e.target.value,
                  }))
                }
                className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold"
              />

            </div>

            {/* Offer Threshold */}
            <div>

              <label className="block mb-2 text-xs font-black uppercase tracking-widest text-slate-500">

                Offer Threshold Amount

              </label>

              <input
                type="number"
                min="0"
                value={settings.offerThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    offerThreshold: e.target.value,
                  }))
                }
                className="w-full h-14 px-5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none font-bold"
              />

            </div>

            <button
              onClick={handleUpdateSettings}
              className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >

              <ArrowUpRight size={18} />

              Update Global Settings

            </button>

          </div>

        </div>

        {/* OPERATIONS */}
        <div className="xl:col-span-8 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">

          <div className="flex items-center justify-between mb-8">

            <div>

              <h3 className="font-black text-slate-900">
                Fulfillment Operations
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Real-time ritual and spiritual service tracking.
              </p>

            </div>

            <TrendingUp
              size={22}
              className="text-emerald-500"
            />

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <StatusCard
              label="Pending Rituals"
              value={stats?.pendingRituals || 0}
              icon={Clock}
              color="amber"
            />

            <StatusCard
              label="Completed Rituals"
              value={
                (stats?.ritualBookings || 0) -
                (stats?.pendingRituals || 0)
              }
              icon={CheckCircle}
              color="emerald"
            />

            <StatusCard
              label="Active Vouchers"
              value={stats?.activeVouchers || 0}
              icon={Ticket}
              color="indigo"
            />

          </div>

          {/* OFFER ANALYTICS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            <AnalyticsCard
              title="Active Offers"
              value={stats?.activeOffers || 0}
              icon={Gift}
            />

            <AnalyticsCard
              title="Offer Redemption"
              value={`${stats?.offerRedemptionRate || 0}%`}
              icon={TrendingUp}
            />

          </div>

        </div>

      </div>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| KPI CARD
|--------------------------------------------------------------------------
*/
function MetricCard({
  title,
  value,
  icon: Icon,
  color,
}) {

  return (
    <motion.div
      whileHover={{
        y: -5,
      }}
      transition={{
        duration: 0.2,
      }}
      className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm"
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black mb-2">

            {title}

          </p>

          <h2 className="text-4xl font-black tracking-tight text-slate-900">

            {Number(value || 0).toLocaleString()}

          </h2>

        </div>

        <div className={`h-16 w-16 rounded-3xl ${color} flex items-center justify-center text-white shadow-lg`}>

          <Icon size={28} />

        </div>

      </div>

    </motion.div>
  );
}

/*
|--------------------------------------------------------------------------
| STATUS CARD
|--------------------------------------------------------------------------
*/
function StatusCard({
  label,
  value,
  icon: Icon,
  color,
}) {

  const colorClasses = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className={`p-6 rounded-[2rem] ${colorClasses[color]}`}>

      <div className="flex items-center gap-2 mb-4">

        <Icon size={18} />

        <span className="text-xs uppercase tracking-widest font-black">

          {label}

        </span>

      </div>

      <h3 className="text-4xl font-black text-slate-900">

        {value}

      </h3>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| ANALYTICS CARD
|--------------------------------------------------------------------------
*/
function AnalyticsCard({
  title,
  value,
  icon: Icon,
}) {

  return (
    <div className="border border-slate-100 rounded-[2rem] p-6 bg-slate-50">

      <div className="flex items-center justify-between mb-4">

        <p className="text-xs uppercase tracking-widest text-slate-400 font-black">

          {title}

        </p>

        <Icon
          size={18}
          className="text-indigo-600"
        />

      </div>

      <h3 className="text-3xl font-black text-slate-900">

        {value}

      </h3>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SKELETON
|--------------------------------------------------------------------------
*/
function DashboardSkeleton() {

  return (
    <div className="space-y-8 animate-pulse">

      <div className="space-y-3">

        <div className="h-10 w-72 bg-slate-200 rounded-xl" />

        <div className="h-4 w-96 bg-slate-200 rounded-lg" />

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {[...Array(4)].map((_, index) => (

          <div
            key={index}
            className="h-40 rounded-[2rem] bg-slate-200"
          />

        ))}

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        <div className="xl:col-span-4 h-[420px] rounded-[2rem] bg-slate-200" />

        <div className="xl:col-span-8 h-[420px] rounded-[2rem] bg-slate-200" />

      </div>

    </div>
  );
}

