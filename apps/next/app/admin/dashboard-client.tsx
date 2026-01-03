"use client";

import { useState, useEffect } from "react";
import { Card, Button, useToast } from "@menumate/app";
import { EditRestaurantForm } from "./edit-restaurant-form";
import { UtensilsCrossed, Edit, Menu, Package, ExternalLink, Download, QrCode, Share2, Users } from "lucide-react";

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
}

export function DashboardClient({ restaurant, userEmail, activeSessions, pendingCounterPayments = [] }: DashboardClientProps) {
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

  // Generate QR code when menuUrl is ready
  useEffect(() => {
    if (menuUrl && !qrCode) {
      generateQRCode();
    }
  }, [menuUrl]);

  const generateQRCode = async () => {
    if (!restaurantData) return;
    
    setIsGeneratingQR(true);
    try {
      const response = await fetch("/api/qr-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: menuUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
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
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
                className="btn-secondary"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium text-neutral-600">Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  restaurantData.isActive 
                    ? "bg-success-50 text-success-700" 
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {restaurantData.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {menuUrl && (
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                View Public Menu
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-12 p-6">
            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600">No restaurant found</p>
          </div>
        )}
      </div>

      {/* QR Code Section */}
      {restaurantData && (
        <div className="bg-white border border-neutral-200 rounded-card shadow-card">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-base font-semibold text-neutral-900">QR Code for Customers</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code Display */}
              <div className="flex flex-col items-center justify-center bg-neutral-50 border border-neutral-200 rounded-lg p-6">
                {isGeneratingQR ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-neutral-600">Generating QR Code...</p>
                  </div>
                ) : qrCode ? (
                  <>
                    <div className="bg-white p-4 rounded-lg shadow-soft mb-4">
                      <img src={qrCode} alt="Restaurant QR Code" className="w-48 h-48" />
                    </div>
                    <p className="text-xs text-neutral-600 text-center">
                      Scan to view menu
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-neutral-500" />
                    </div>
                    <p className="text-sm text-neutral-600">No QR code generated</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-center space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">
                    Share Your Menu
                  </h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    Print this QR code and place it on your tables. Customers can scan it to view your menu instantly.
                  </p>
                  <div className="mb-4">
                    <label className="text-xs font-medium text-neutral-700 mb-1.5 block">
                      Table Number (for QR code URL)
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => {
                        setTableNumber(e.target.value);
                        setQrCode(null);
                      }}
                      placeholder="e.g., 1, 2, 3..."
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                    />
                    <p className="text-xs text-neutral-500 mt-1.5">
                      The QR code will include this table number in the URL
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={downloadQRCode}
                    disabled={!qrCode}
                    className="w-full btn-primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>

                  <Button
                    onClick={copyMenuLink}
                    variant="outline"
                    className="w-full btn-secondary"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Menu Link
                  </Button>

                  <Button
                    onClick={generateQRCode}
                    variant="outline"
                    className="w-full btn-secondary"
                    disabled={isGeneratingQR}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Regenerate QR Code
                  </Button>
                </div>

                <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <p className="text-xs text-primary-900">
                    <strong>Tip:</strong> Print multiple QR codes and place them on each table for best results.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Card */}
      <div className="bg-white border border-neutral-200 rounded-card shadow-card">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="/admin/menu"
              className="flex items-center space-x-3 p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Menu className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-neutral-900">Manage Menu</span>
            </a>
            <a
              href="/admin/orders"
              className="flex items-center space-x-3 p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-neutral-900">View Orders</span>
            </a>
            <a
              href="/admin/sessions"
              className="flex items-center space-x-3 p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-neutral-900">Table Sessions</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
