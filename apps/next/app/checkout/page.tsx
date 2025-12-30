"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@menumate/app";
import { Button, Input } from "@menumate/app";
import { ShoppingCart, User, Phone, Hash, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: "",
    notes: "",
  });

  const [restaurantSlug, setRestaurantSlug] = useState("");

  // Get restaurant slug on mount
  useEffect(() => {
    const slug = localStorage.getItem("current_restaurant_slug") || "";
    setRestaurantSlug(slug);
    setIsInitialized(true);
  }, []);

  // Redirect if cart is empty (after initialization)
  useEffect(() => {
    if (isInitialized && items.length === 0 && !orderPlaced) {
      router.push(`/r/${restaurantSlug}`);
    }
  }, [items, orderPlaced, router, isInitialized, restaurantSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/orders/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          items: items.map((item) => ({
            itemId: item.id,
            quantity: item.quantity,
          })),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          tableNumber: formData.tableNumber || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      // Order placed successfully
      setOrderNumber(data.order.orderNumber);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      console.error("Order error:", error);
      alert(error instanceof Error ? error.message : "Failed to place order");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-600 mb-6">Your order has been received</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Order Number</p>
            <p className="text-3xl font-bold text-orange-600">{orderNumber}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your order is being prepared. We'll notify the staff shortly!
            </p>
            <Button
              onClick={() => router.push(`/r/${restaurantSlug}`)}
              className="w-full"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Menu</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Title */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-white" />
              <h1 className="text-2xl font-bold text-white">Checkout</h1>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Details Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Your Name *
                </label>
                <Input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number *
                </label>
                <Input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Table Number (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.tableNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, tableNumber: e.target.value })
                  }
                  placeholder="e.g., Table 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special requests?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base"
              >
                {isLoading ? "Placing Order..." : `Place Order - ₹${totalPrice.toFixed(2)}`}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

