"use client";

import { useState, useEffect } from "react";
import { Card, Button, useToast } from "@menumate/app";
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
  const [view, setView] = useState<"daily" | "monthly" | "items" | "categories">("daily");
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [itemsData, setItemsData] = useState<any>(null);
  const [categoriesData, setCategoriesData] = useState<any>(null);
  const { showToast } = useToast();

  const isPro = subscriptionTier === "pro" || subscriptionTier === "enterprise";

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary-600" />
            Advanced Analytics
          </h1>
          <p className="text-neutral-600 mt-1">
            Deep insights into your restaurant's performance
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
          <Crown className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-semibold text-primary-700">Pro</span>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          onClick={() => setView("daily")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "daily"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Daily
          </div>
        </button>
        <button
          onClick={() => setView("monthly")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "monthly"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Monthly
          </div>
        </button>
        <button
          onClick={() => setView("items")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "items"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Items
          </div>
        </button>
        <button
          onClick={() => setView("categories")}
          className={`px-4 py-2 font-medium transition-colors ${
            view === "categories"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </div>
        </button>
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
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Total Revenue</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                ₹{data.totalRevenue}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {data.totalOrders}
              </p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                ₹{data.averageOrderValue}
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Active Sessions</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">
                {data.activeSessions}
              </p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-lg">
              <Users className="h-6 w-6 text-neutral-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Hourly Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Hourly Breakdown
        </h3>
        <DailyChart data={data.hourlyBreakdown} />
      </Card>
    </div>
  );
}

function MonthlyView({ data }: { data: any }) {
  const revenueGrowth = parseFloat(data.growth.revenue);
  const ordersGrowth = parseFloat(data.growth.orders);

  return (
    <div className="space-y-6">
      {/* Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Current Month Revenue</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            ₹{data.currentMonth.totalRevenue}
          </p>
          <div className={`flex items-center gap-1 mt-2 ${revenueGrowth >= 0 ? "text-success-600" : "text-error-600"}`}>
            {revenueGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(revenueGrowth).toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-neutral-600">Total Orders</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">
            {data.currentMonth.totalOrders}
          </p>
          <div className={`flex items-center gap-1 mt-2 ${ordersGrowth >= 0 ? "text-success-600" : "text-error-600"}`}>
            {ordersGrowth >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{Math.abs(ordersGrowth).toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-6 bg-primary-50 border-primary-200">
          <p className="text-sm text-primary-700 font-medium">Peak Day</p>
          <p className="text-2xl font-bold text-primary-900 mt-2">
            Day {data.peakDay.day}
          </p>
          <p className="text-sm text-primary-600 mt-1">
            ₹{data.peakDay.revenue} • {data.peakDay.orders} orders
          </p>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Daily Revenue Trend
        </h3>
        <MonthlyChart data={data.dailyBreakdown} />
      </Card>
    </div>
  );
}

function ItemsView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Total Menu Items</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{data.totalItems}</p>
        </Card>
        <Card className="p-6 bg-success-50 border-success-200">
          <p className="text-sm text-success-700">Items Sold</p>
          <p className="text-3xl font-bold text-success-900 mt-2">{data.totalItemsSold}</p>
        </Card>
        <Card className="p-6 bg-warning-50 border-warning-200">
          <p className="text-sm text-warning-700">Never Ordered</p>
          <p className="text-3xl font-bold text-warning-900 mt-2">{data.neverOrderedCount}</p>
        </Card>
      </div>

      <ItemsTable data={data} />
    </div>
  );
}

function CategoriesView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Total Categories</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{data.totalCategories}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-neutral-600">Active Categories</p>
          <p className="text-3xl font-bold text-neutral-900 mt-2">{data.activeCategories}</p>
        </Card>
        <Card className="p-6 bg-success-50 border-success-200">
          <p className="text-sm text-success-700">Total Revenue</p>
          <p className="text-3xl font-bold text-success-900 mt-2">₹{data.totalRevenue}</p>
        </Card>
      </div>

      {/* Category Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Category Performance
        </h3>
        <CategoryChart data={data.topPerforming} />
      </Card>
    </div>
  );
}

