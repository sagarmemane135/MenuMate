"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, useToast } from "@menumate/app";
import { Receipt, CreditCard, Store, ArrowLeft, Loader2 } from "lucide-react";
import type { RazorpayPaymentResponse, RazorpayCheckoutOptions } from "@/lib/types/razorpay";
import { formatIndianTime } from "@/lib/date-utils";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  isPaid: boolean;
  createdAt: string;
  notes: string | null;
}

interface Session {
  id: string;
  tableNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: string;
  startedAt: string;
}

interface RestaurantInfo {
  name: string;
}

function BillPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const sessionToken = searchParams.get("session");

  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"online" | "counter" | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionToken) {
      fetchSessionData();
    }
  }, [sessionToken]);

  // Poll session for updates (local setup) - order status and payment confirmation
  useEffect(() => {
    if (!sessionToken) return;
    const interval = setInterval(() => {
      fetch(`/api/sessions/${sessionToken}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.session) {
            setSession(data.session);
            setOrders(data.orders || []);
            if (data.restaurant) setRestaurant(data.restaurant);
            if (data.session.status === "paid") {
              showToast("Payment received! Thank you! ✅", "success");
              if (sessionToken) {
                localStorage.removeItem(`session_${sessionToken}`);
                const masterKey = `active_session_${sessionToken.split("_")[0]}`;
                localStorage.removeItem(masterKey);
              }
              setTimeout(() => router.push("/"), 2000);
            }
          }
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionToken, router, showToast]);

  const fetchSessionData = async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`/api/sessions/${sessionToken}`);
      const data = await response.json();

      if (response.status === 404) {
        setSession(null);
        setOrders([]);
        setSessionError(data.error || "Session not found or expired.");
        return;
      }
      setSessionError(null);
      if (data.success) {
        setSession(data.session);
        setOrders(data.orders ?? []);
        setRestaurant(data.restaurant ?? null);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      setSession(null);
      setSessionError("Session not found or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayOnline = async () => {
    if (!sessionToken || !session) return;

    setIsProcessingPayment(true);
    try {
      // Create Razorpay order for total amount
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: session.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data.message || data.error || "Failed to create payment";
        if (response.status >= 500 || /gateway|configured|unavailable/i.test(errMsg)) {
          throw new Error("Online payment is temporarily unavailable. Please use Pay at counter.");
        }
        throw new Error(errMsg);
      }

      showToast("Opening payment gateway...", "info");

      // Initialize Razorpay
      // Clean the key to remove any whitespace/newlines from environment variables
      const razorpayKey = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RzS6YyboMHsR4m")
        .trim()
        .replace(/[\r\n\t]/g, '');
      
      const options: RazorpayCheckoutOptions = {
        key: razorpayKey,
        amount: data.data.amount,
        currency: data.data.currency,
        name: "MenuMate",
        description: `Table ${session.tableNumber} - Total Bill`,
        order_id: data.data.id,
        handler: async function (response: RazorpayPaymentResponse) {
          // Verify payment on server before closing session (reliability + security)
          try {
            const verifyRes = await fetch(`/api/sessions/${sessionToken}/verify-online-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              showToast("Payment successful! Thank you!", "success");
              if (sessionToken) {
                localStorage.removeItem(`session_${sessionToken}`);
                const masterKey = `active_session_${sessionToken.split("_")[0]}`;
                localStorage.removeItem(masterKey);
              }
              setTimeout(() => router.push("/"), 2000);
            } else {
              showToast(verifyData.error || "Payment verification failed. Please contact support.", "error");
            }
          } catch (err) {
            console.error("Verify payment error:", err);
            showToast("Payment verification failed. Please contact support.", "error");
          }
        },
        modal: {
          ondismiss: function () {
            showToast("Payment cancelled", "info");
          },
        },
        theme: {
          color: "#f97316",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      const message = error instanceof Error ? error.message : "Failed to process payment";
      if (message.toLowerCase().includes("gateway") || message.toLowerCase().includes("configured") || message.toLowerCase().includes("unavailable")) {
        showToast("Online payment is temporarily unavailable. Please use Pay at counter.", "error");
      } else {
        showToast(message, "error");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePayAtCounter = async () => {
    if (!sessionToken || !session) return;

    setIsProcessingPayment(true);
    try {
      // Request counter payment - this will notify admin
      const response = await fetch(`/api/sessions/${sessionToken}/request-counter-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request counter payment");
      }

      if (data.success) {
        showToast("Payment request sent! Please proceed to the counter.", "success");
        // Don't close session yet - wait for admin to mark as paid
        // Session will remain active until admin confirms payment
      }
    } catch (error) {
      console.error("Counter payment request error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to request counter payment",
        "error"
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const closeSession = async (paymentMethod: string, paymentId?: string) => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`/api/sessions/${sessionToken}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          paymentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          paymentMethod === "online"
            ? "Payment successful! Thank you!"
            : "Please pay at the counter. Thank you!",
          "success"
        );
        
        // Clear session from localStorage
        if (sessionToken) {
          localStorage.removeItem(`session_${sessionToken}`);
        }
        
        // Redirect back to menu after showing success message
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to close session:", error);
      showToast("Failed to process. Please try again.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your bill...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {sessionError || "No Active Session"}
          </h2>
          <p className="text-gray-600 mb-4">
            {sessionError ? "The link may have expired or the session was closed." : "Please scan the QR code on your table to start ordering."}
          </p>
          <Button onClick={() => router.push("/")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 transition-colors"
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
          <div className="bg-primary-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Receipt className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Your Bill</h1>
                  <p className="text-primary-100">Table {session.tableNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-primary-100 text-sm">Session</p>
                <p className="text-white font-mono text-xs">{session.id.slice(0, 8)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Orders */}
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div key={order.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Order #{index + 1}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatIndianTime(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : order.status === "ready"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "cooking"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(order.items as OrderItem[]).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.name} x {item.quantity}
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Note: {order.notes}
                      </p>
                    )}

                    <div className="border-t border-gray-300 mt-3 pt-2 flex justify-between">
                      <span className="text-sm font-semibold text-gray-900">Subtotal</span>
                      <span className="text-sm font-bold text-neutral-900">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="bg-primary-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Grand Total</span>
                <span className="text-3xl font-bold text-primary-700">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Selection */}
            {session.status === "active" && orders.length > 0 && !showPaymentSelection && (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPaymentSelection(true)}
                  className="w-full h-14 text-lg bg-primary-600 hover:bg-primary-700"
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  Choose Payment Method
                </Button>
                <p className="text-xs text-center text-gray-500">
                  Select your preferred payment method
                </p>
              </div>
            )}

            {/* Payment Method Selection */}
            {session.status === "active" && orders.length > 0 && showPaymentSelection && !selectedPaymentMethod && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
                <Button
                  onClick={() => {
                    setSelectedPaymentMethod("online");
                    handlePayOnline();
                  }}
                  disabled={isProcessingPayment}
                  className="w-full h-14 text-lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isProcessingPayment ? "Processing..." : "Pay Online"}
                </Button>

                <Button
                  onClick={() => {
                    setSelectedPaymentMethod("counter");
                    handlePayAtCounter();
                  }}
                  disabled={isProcessingPayment}
                  variant="outline"
                  className="w-full h-14 text-lg"
                >
                  <Store className="w-5 h-5 mr-2" />
                  {isProcessingPayment ? "Processing..." : "Pay at Counter"}
                </Button>

                <Button
                  onClick={() => {
                    setShowPaymentSelection(false);
                    setSelectedPaymentMethod(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Secure payment powered by Razorpay
                </p>
              </div>
            )}

            {/* Payment Status Messages */}
            {session.status === "active" &&
              session.paymentStatus === "pending" &&
              selectedPaymentMethod === "counter" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Store className="w-6 h-6 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900">Payment Request Sent</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please proceed to the counter to complete your payment. Our staff has been
                        notified.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {session.status !== "active" && (
              <div className="text-center py-4">
                <p className="text-green-600 font-semibold">
                  ✅ Session Closed - Thank you!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Load Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </div>
  );
}

export default function BillPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BillPageContent />
    </Suspense>
  );
}

