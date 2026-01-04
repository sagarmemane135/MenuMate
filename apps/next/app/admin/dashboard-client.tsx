"use client";

import { useState, useEffect } from "react";
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

export function DashboardClient({ 
  restaurant, 
  userEmail, 
  activeSessions, 
  pendingCounterPayments = [],
  todayRevenue,
  topSellingItems
}: DashboardClientProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [restaurantData, setRestaurantData] = useState(restaurant);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const { showToast } = useToast();

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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Today's Revenue</p>
              <p className="text-3xl font-bold text-success-600 mt-2">
                ₹{todayRevenue.toFixed(0)}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                Current day earnings
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-success-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Active Sessions</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">
                {activeSessions.length}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                Tables currently dining
              </p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Pending Payments</p>
              <p className="text-3xl font-bold text-warning-600 mt-2">
                {pendingCounterPayments.length}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {pendingCounterPayments.length === 1 ? "payment" : "payments"} awaiting
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-lg">
              <CreditCard className="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Top Item</p>
              <p className="text-lg font-bold text-neutral-900 mt-2 truncate" title={topSellingItems[0]?.name || "N/A"}>
                {topSellingItems[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                {topSellingItems[0]?.quantity || 0} sold
              </p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <Award className="h-8 w-8 text-neutral-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Top Selling Items */}
      {topSellingItems.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success-600" />
              Top 3 Selling Items (Last 30 Days)
            </h2>
            <Link 
              href="/admin/analytics?view=items"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {topSellingItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? "bg-warning-100 text-warning-700" :
                    index === 1 ? "bg-neutral-200 text-neutral-700" :
                    "bg-warning-50 text-warning-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{item.name}</p>
                    <p className="text-sm text-neutral-600">
                      {item.quantity} sold • ₹{item.revenue.toFixed(0)} revenue
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-success-600">
                    ₹{(item.revenue / item.quantity).toFixed(0)}
                  </p>
                  <p className="text-xs text-neutral-500">avg price</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Restaurant Card */}
      <div className="bg-white border border-neutral-200 rounded-card shadow-card">
        {restaurantData ? (
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">{restaurantData.name}</h2>
                  <p className="text-sm text-neutral-600 font-mono bg-neutral-100 px-2.5 py-1 rounded inline-block">
                    /{restaurantData.slug}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowEditForm(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>

            {/* QR Code Section */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Menu QR Code & Link</h3>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    Table Number (for QR)
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-neutral-700 mb-2">
                    Menu URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={menuUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white"
                    />
                    <Button
                      onClick={copyMenuLink}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateQRCode}
                  disabled={isGeneratingQR}
                  className="flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  {isGeneratingQR ? "Generating..." : "Generate QR Code"}
                </Button>
                {qrCode && (
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>

              {qrCode && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200 inline-block">
                  <img src={qrCode} alt="Menu QR Code" className="w-64 h-64" />
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <a
                href={`/r/${restaurantData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Menu className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900">View Menu</span>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-primary-600" />
              </a>

              <a
                href="/admin/menu"
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Edit className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900">Edit Menu</span>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-primary-600" />
              </a>

              <a
                href="/admin/orders"
                className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900">View Orders</span>
                </div>
                <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-primary-600" />
              </a>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Restaurant Found</h3>
            <p className="text-sm text-neutral-600 mb-4">
              You don't have a restaurant set up yet. Contact support to get started.
            </p>
            <p className="text-xs text-neutral-500">Logged in as: {userEmail}</p>
          </div>
        )}
      </div>
    </div>
  );
}
