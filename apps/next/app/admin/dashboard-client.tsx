"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Button, useToast } from "@menumate/app";
import { EditRestaurantForm } from "./edit-restaurant-form";
import { UtensilsCrossed, Edit, Menu, Package, ExternalLink, Download, QrCode, Share2, Users, DollarSign, TrendingUp, Award, CreditCard, Clock } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  userEmail: string;
  activeSessions: Array<{
    id: string;
    tableNumber: string;
    sessionToken: string;
    startedAt: Date;
  }>;
  pendingCounterPayments?: Array<{
    id: string;
    sessionToken: string;
    tableNumber: string;
    totalAmount: string;
    startedAt: Date;
  }>;
  todayRevenue: number;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
}

const DASHBOARD_STATS_POLL_MS = 15000;
const PAYMENT_MARKED_EVENT = "admin:payment-marked-paid";

export function DashboardClient({ 
  restaurant, 
  userEmail, 
  activeSessions, 
  pendingCounterPayments = [],
  todayRevenue: initialTodayRevenue,
  topSellingItems
}: DashboardClientProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [restaurantData, setRestaurantData] = useState(restaurant);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(initialTodayRevenue);
  const [topSellingItemsState, setTopSellingItemsState] = useState(topSellingItems);
  const { showToast } = useToast();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (typeof json.todayRevenue === "number") setTodayRevenue(json.todayRevenue);
        if (Array.isArray(json.topSellingItems)) setTopSellingItemsState(json.topSellingItems);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    const id = setInterval(fetchDashboardStats, DASHBOARD_STATS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchDashboardStats]);

  useEffect(() => {
    const handler = () => fetchDashboardStats();
    window.addEventListener(PAYMENT_MARKED_EVENT, handler);
    return () => window.removeEventListener(PAYMENT_MARKED_EVENT, handler);
  }, [fetchDashboardStats]);

  const handleRestaurantUpdated = (updated: typeof restaurant) => {
    setRestaurantData(updated);
    setShowEditForm(false);
  };

  const [menuUrl, setMenuUrl] = useState('');
  const [tableNumber, setTableNumber] = useState('1');

  // Set menu URL on client side only to avoid hydration mismatch
  useEffect(() => {
    if (restaurantData) {
      const url = tableNumber 
        ? `${window.location.origin}/r/${restaurantData.slug}?table=${tableNumber}`
        : `${window.location.origin}/r/${restaurantData.slug}`;
      setMenuUrl(url);
    }
  }, [restaurantData, tableNumber]);

  const generateQRCode = async () => {
    if (!restaurantData) return;

    setIsGeneratingQR(true);
    try {
      const QRCode = await import("qrcode");
      const url = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#1e3a8a",
          light: "#ffffff",
        },
      });
      setQrCode(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
      showToast("Failed to generate QR code", "error");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCode || !restaurantData) return;

    const link = document.createElement("a");
    link.download = `${restaurantData.slug}-qr-code.png`;
    link.href = qrCode;
    link.click();
  };

  const copyMenuLink = () => {
    navigator.clipboard.writeText(menuUrl);
    showToast("Menu link copied to clipboard!", "success");
  };

  if (showEditForm && restaurantData) {
    return (
      <div className="max-w-2xl">
        <EditRestaurantForm
          restaurant={restaurantData}
          onSuccess={handleRestaurantUpdated}
          onCancel={() => setShowEditForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - same alignment as admin dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Today&apos;s Revenue</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">₹{todayRevenue.toFixed(0)}</p>
              <p className="stat-change">Current day earnings</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Active Sessions</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{activeSessions.length}</p>
              <p className="stat-change">Tables currently dining</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Pending Payments</p>
              <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{pendingCounterPayments.length}</p>
              <p className="stat-change">{pendingCounterPayments.length === 1 ? "payment" : "payments"} awaiting</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CreditCard className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Top Item</p>
              <p className="min-h-[2.25rem] flex items-center text-lg font-semibold text-neutral-900 truncate" title={topSellingItemsState[0]?.name || "N/A"}>
                {topSellingItemsState[0]?.name || "N/A"}
              </p>
              <p className="stat-change">{topSellingItemsState[0]?.quantity || 0} sold</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Award className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-column: Top Selling Items (left) + Restaurant & QR (right) - equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left column: Top Selling Items - real-time updated when payment is marked paid */}
        {topSellingItemsState.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50/30 to-primary-50/20 shadow-sm h-full flex flex-col min-h-0">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary-100/30 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
            <div className="relative px-6 py-5 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between gap-4 mb-5 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-900">Top 5 Selling Items</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">Last 30 days • Updates when payment is marked</p>
                  </div>
                </div>
                <Link
                  href="/admin/analytics?view=items"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  View All
                  <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="space-y-2 flex-1 min-h-0">
                {topSellingItemsState.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-white/80 border border-neutral-100 hover:border-neutral-200 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? "bg-amber-100 text-amber-800"
                            : index === 1
                              ? "bg-neutral-200 text-neutral-700"
                              : index === 2
                                ? "bg-amber-50 text-amber-700"
                                : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                        <p className="text-xs text-neutral-500">
                          {item.quantity} sold · ₹{item.revenue.toFixed(0)} revenue
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-primary-600">
                        ₹{(item.revenue / item.quantity).toFixed(0)}
                      </p>
                      <p className="text-xs text-neutral-400">avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200 border-dashed bg-neutral-50/50 p-6 flex items-center justify-center min-h-[200px] h-full">
            <p className="text-sm text-neutral-500">No sales data yet. Top items will appear here.</p>
          </div>
        )}

        {/* Right column: Restaurant Card + QR + Quick Links - stretches to match left */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0 h-full">
        {restaurantData ? (
          <>
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-neutral-900 truncate">{restaurantData.name}</h2>
                  <p className="text-xs font-mono text-neutral-500 mt-0.5">/{restaurantData.slug}</p>
                </div>
              </div>
              <Button
                onClick={() => setShowEditForm(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 flex-shrink-0"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>

            <div className="p-5 flex-1 min-h-0 flex flex-col">
              {/* QR Code Section - compact */}
              <div className="mb-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Menu QR Code & Link</h3>
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Table Number (for QR)</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Menu URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={menuUrl}
                        readOnly
                        className="flex-1 min-w-0 px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white"
                      />
                      <Button onClick={copyMenuLink} variant="outline" size="sm" className="flex-shrink-0">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={generateQRCode}
                    disabled={isGeneratingQR}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {isGeneratingQR ? "Generating..." : "Generate QR Code"}
                  </Button>
                  {qrCode && (
                    <Button onClick={downloadQRCode} variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  )}
                </div>
                {qrCode && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-neutral-200 inline-block">
                    <img src={qrCode} alt="Menu QR Code" className="w-48 h-48 lg:w-56 lg:h-56" />
                  </div>
                )}
              </div>

              {/* Quick Links - enhanced pill-style actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <a
                  href={`/r/${restaurantData.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-primary-50/50 hover:border-primary-200 transition-all duration-200 group shadow-sm hover:shadow"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200/50 transition-colors">
                    <Menu className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-700 flex-1 min-w-0 whitespace-nowrap">View Menu</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 group-hover:text-primary-500 transition-colors" />
                </a>
                <a
                  href="/admin/menu"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-primary-50/50 hover:border-primary-200 transition-all duration-200 group shadow-sm hover:shadow"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200/50 transition-colors">
                    <Edit className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-700 flex-1 min-w-0 whitespace-nowrap">Edit Menu</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 group-hover:text-primary-500 transition-colors" />
                </a>
                <a
                  href="/admin/orders"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-primary-50/50 hover:border-primary-200 transition-all duration-200 group shadow-sm hover:shadow"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200/50 transition-colors">
                    <Package className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-800 group-hover:text-primary-700 flex-1 min-w-0 whitespace-nowrap">View Orders</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 group-hover:text-primary-500 transition-colors" />
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No Restaurant Found</p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              You don&apos;t have a restaurant set up yet. Contact support to get started.
            </p>
            <p className="text-xs text-neutral-500">Logged in as: {userEmail}</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
