"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, useToast } from "@menumate/app";
import { Button, Input } from "@menumate/app";
import { ShoppingCart, User, Phone, Hash, FileText, ArrowLeft, CheckCircle2, CreditCard } from "lucide-react";
import type { RazorpayCheckoutOptions, RazorpayPaymentResponse } from "@/lib/types/razorpay";

export default function CheckoutWithPayment() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { showToast } = useToast();
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

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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

  const handlePayment = async (orderId: string, orderAmount: number) => {
    try {
      // Create Razorpay order
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(orderAmount),
          currency: "INR",
          receipt: orderId,
          notes: {
            restaurantSlug,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment order");
      }

      // Initialize Razorpay checkout
      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RxnlojQNZtfZj0",
        amount: data.order.amount,
        currency: data.order.currency,
        name: "MenuMate",
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        image: "/logo.png",
        order_id: data.order.id,
        handler: async function (response: RazorpayPaymentResponse) {
          // Payment successful - verify on backend
          try {
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: orderId,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok) {
              setOrderNumber(orderId.slice(0, 8).toUpperCase());
              setOrderPlaced(true);
              clearCart();
            } else {
              throw new Error(verifyData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            showToast("Payment verification failed. Please contact support.", "error");
          }
        },
        prefill: {
          name: formData.customerName,
          contact: formData.customerPhone,
        },
        notes: {
          restaurant_slug: restaurantSlug || "",
          table_number: formData.tableNumber || "N/A",
        },
        theme: {
          color: "#f97316",
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            showToast("Payment cancelled. Your order was not placed.", "warning");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to initialize payment",
        "error"
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First create the order
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

      // Order created successfully - now initiate payment
      await handlePayment(data.order.id, data.order.totalAmount);
    } catch (error) {
      console.error("Order error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to place order",
        "error"
      );
      setIsLoading(false);
    }
  };

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br neutral-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-pulse" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">Your order has been confirmed</p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Order Number</p>
            <p className="text-3xl font-bold text-primary-700">{orderNumber}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Your order is being prepared. Thank you for your payment!
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
    <div className="min-h-screen bg-gradient-to-br neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-700 transition-colors"
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
          <div className="bg-gradient-to-r primary-600 p-6">
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
                  <span className="text-xl font-bold text-primary-700">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>{isLoading ? "Processing..." : `Pay ₹${totalPrice.toFixed(2)}`}</span>
              </Button>

              <p className="text-xs text-center text-gray-500">
                Secure payment powered by Razorpay
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

