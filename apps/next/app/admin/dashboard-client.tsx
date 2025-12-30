"use client";

import { useState, useEffect } from "react";
import { Card, Button } from "@menumate/app";
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
}

export function DashboardClient({ restaurant, userEmail, activeSessions }: DashboardClientProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [restaurantData, setRestaurantData] = useState(restaurant);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  const handleRestaurantUpdated = (updated: typeof restaurant) => {
    setRestaurantData(updated);
    setShowEditForm(false);
  };

  const [menuUrl, setMenuUrl] = useState('');

  // Set menu URL on client side only to avoid hydration mismatch
  useEffect(() => {
    if (restaurantData) {
      setMenuUrl(`${window.location.origin}/r/${restaurantData.slug}`);
    }
  }, [restaurantData]);

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
    alert("Menu link copied to clipboard!");
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
      <Card>
        {restaurantData ? (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3">
                <UtensilsCrossed className="w-10 h-10 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{restaurantData.name}</p>
                  <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block">
                    /{restaurantData.slug}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditForm(true)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-semibold text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 text-sm font-bold rounded-full ${
                  restaurantData.isActive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}
              >
                {restaurantData.isActive ? "● Active" : "● Inactive"}
              </span>
            </div>

            {menuUrl && (
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg"
              >
                View Public Menu →
              </a>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No restaurant found</p>
          </div>
        )}
      </Card>

      {/* QR Code Section */}
      {restaurantData && (
        <Card title="QR Code for Customers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-xl p-6">
              {isGeneratingQR ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Generating QR Code...</p>
                </div>
              ) : qrCode ? (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                    <img src={qrCode} alt="Restaurant QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Scan to view menu
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <QrCode className="w-16 h-16 text-gray-400" />
                  <p className="text-sm text-gray-600">No QR code generated</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-center space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Share Your Menu
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Print this QR code and place it on your tables. Customers can scan it to view your menu instantly.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={downloadQRCode}
                  disabled={!qrCode}
                  className="w-full"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download QR Code
                </Button>

                <Button
                  onClick={copyMenuLink}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Copy Menu Link
                </Button>

                <Button
                  onClick={generateQRCode}
                  variant="outline"
                  className="w-full"
                  disabled={isGeneratingQR}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Regenerate QR Code
                </Button>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium">
                  💡 <strong>Pro Tip:</strong> Print multiple QR codes and place them on each table for best results!
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions Card */}
      <Card title="Quick Actions">
        <div className="space-y-3">
          <a
            href="/admin/menu"
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all"
          >
            <Menu className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span className="font-semibold text-gray-900">Manage Menu →</span>
          </a>
          <a
            href="/admin/orders"
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all"
          >
            <Package className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-semibold text-gray-900">View Orders →</span>
          </a>
        </div>
      </Card>
    </div>
  );
}
