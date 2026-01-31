"use client";

import { useState, useEffect } from "react";
import { Button, useToast } from "@menumate/app";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Award,
  AlertCircle,
  Crown,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { ProGate } from "@/components/pro-gate";
import { DailyChart } from "@/components/analytics/daily-chart";
import { MonthlyChart } from "@/components/analytics/monthly-chart";
import { CategoryChart } from "@/components/analytics/category-chart";
import { ItemsTable } from "@/components/analytics/items-table";

interface AnalyticsPageClientProps {
  restaurantId: string;
  subscriptionTier: string;
  userName: string;
}

export function AnalyticsPageClient({
  restaurantId,
  subscriptionTier,
  userName,
}: AnalyticsPageClientProps) {
  // Load persisted view from localStorage or default to "daily"
  const [view, setView] = useState<"daily" | "monthly" | "items" | "categories">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("analytics-view");
      if (saved && ["daily", "monthly", "items", "categories"].includes(saved)) {
        return saved as "daily" | "monthly" | "items" | "categories";
      }
    }
    return "daily";
  });
  
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const { showToast } = useToast();

  const isPro = subscriptionTier === "pro" || subscriptionTier === "enterprise";

  // Persist view selection to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("analytics-view", view);
    }
  }, [view]);

  useEffect(() => {
    if (isPro) {
      loadAnalytics();
    }
  }, [isPro, view]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (view === "daily") {
        const res = await fetch(`/api/analytics/daily?restaurantId=${restaurantId}`);
        const data = await res.json();
        if (data.success) setDailyData(data.data);
      } else if (view === "monthly") {
        const res = await fetch(`/api/analytics/monthly?restaurantId=${restaurantId}`);
        const data = await res.json();
        if (data.success) setMonthlyData(data.data);
      } else if (view === "items") {
        const res = await fetch(`/api/analytics/items?restaurantId=${restaurantId}&period=30`);
        const data = await res.json();
        if (data.success) setItemsData(data.data);
      } else if (view === "categories") {
        const res = await fetch(`/api/analytics/categories?restaurantId=${restaurantId}&period=30`);
        const data = await res.json();
        if (data.success) setCategoriesData(data.data);
      }
    } catch (error) {
      showToast("Failed to load analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return <ProGate userName={userName} />;
  }

  return (
    <div className="space-y-6">
      {/* Header - same style as other admin pages */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Deep insights into your restaurant&apos;s performance
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-xl border border-primary-200">
          <Crown className="h-4 w-4 text-primary-600" />
          <span className="text-xs font-semibold text-primary-700">Pro</span>
        </div>
      </div>

      {/* View Tabs - inside card for consistency */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex gap-1 border-b border-neutral-200 px-1">
        <button
          onClick={() => setView("daily")}
          className={`px-6 py-3 font-semibold transition-all relative ${
            view === "daily"
              ? "text-primary-600 bg-primary-50"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Daily
          </div>
          {view === "daily" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setView("monthly")}
          className={`px-6 py-3 font-semibold transition-all relative ${
            view === "monthly"
              ? "text-primary-600 bg-primary-50"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly
          </div>
          {view === "monthly" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setView("items")}
          className={`px-6 py-3 font-semibold transition-all relative ${
            view === "items"
              ? "text-primary-600 bg-primary-50"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Items
          </div>
          {view === "items" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"></div>
          )}
        </button>
        <button
          onClick={() => setView("categories")}
          className={`px-6 py-3 font-semibold transition-all relative ${
            view === "categories"
              ? "text-primary-600 bg-primary-50"
              : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </div>
          {view === "categories" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"></div>
          )}
        </button>
      </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {view === "daily" && dailyData && <DailyView data={dailyData} />}
          {view === "monthly" && monthlyData && <MonthlyView data={monthlyData} />}
          {view === "items" && itemsData && <ItemsView data={itemsData} />}
          {view === "categories" && categoriesData && <CategoriesView data={categoriesData} />}
        </>
      )}
    </div>
  );
}

function DailyView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Metrics - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Revenue</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">₹{data.totalRevenue}</p>
              <p className="stat-change">Today</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Orders</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{data.totalOrders}</p>
              <p className="stat-change">Today</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Avg Order Value</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">₹{data.averageOrderValue}</p>
              <p className="stat-change">Per order</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Active Sessions</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">{data.activeSessions}</p>
              <p className="stat-change">Tables</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Chart - card with header strip */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-sm font-semibold text-neutral-900">Hourly breakdown</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Revenue by hour</p>
        </div>
        <div className="p-5">
          <DailyChart data={data.hourlyBreakdown} />
        </div>
      </div>
    </div>
  );
}

function MonthlyView({ data }: { data: any }) {
  const revenueGrowth = parseFloat(data.growth.revenue);
  const ordersGrowth = parseFloat(data.growth.orders);

  return (
    <div className="space-y-6">
      {/* Growth - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Current Month Revenue</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">₹{data.currentMonth.totalRevenue}</p>
              <p className={`stat-change flex items-center gap-1 ${revenueGrowth >= 0 ? "text-success-600" : "text-error-600"}`}>
                {revenueGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(revenueGrowth).toFixed(1)}% vs last month
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Orders</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{data.currentMonth.totalOrders}</p>
              <p className={`stat-change flex items-center gap-1 ${ordersGrowth >= 0 ? "text-success-600" : "text-error-600"}`}>
                {ordersGrowth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(ordersGrowth).toFixed(1)}% vs last month
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShoppingCart className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Peak Day</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">Day {data.peakDay.day}</p>
              <p className="stat-change">₹{data.peakDay.revenue} • {data.peakDay.orders} orders</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart - card with header strip */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-sm font-semibold text-neutral-900">Daily revenue trend</h3>
          <p className="text-xs text-neutral-500 mt-0.5">This month by day</p>
        </div>
        <div className="p-5">
          <MonthlyChart data={data.dailyBreakdown} />
        </div>
      </div>
    </div>
  );
}

function ItemsView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Menu Items</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">{data.totalItems}</p>
              <p className="stat-change">On menu</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShoppingCart className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Items Sold</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">{data.totalItemsSold}</p>
              <p className="stat-change">Last 30 days</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Never Ordered</p>
              <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{data.neverOrderedCount}</p>
              <p className="stat-change">Consider promoting</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Items table - card with header strip */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-sm font-semibold text-neutral-900">Item performance</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Top sellers, least selling, never ordered</p>
        </div>
        <div className="p-5">
          <ItemsTable data={data} />
        </div>
      </div>
    </div>
  );
}

function CategoriesView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Categories</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">{data.totalCategories}</p>
              <p className="stat-change">On menu</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <PieChart className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Active Categories</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{data.activeCategories}</p>
              <p className="stat-change">With orders</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Revenue</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">₹{data.totalRevenue}</p>
              <p className="stat-change">By category</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Chart - card with header strip */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
          <h3 className="text-sm font-semibold text-neutral-900">Category performance</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Revenue by category</p>
        </div>
        <div className="p-5">
          <CategoryChart data={data.topPerforming} />
        </div>
      </div>
    </div>
  );
}

