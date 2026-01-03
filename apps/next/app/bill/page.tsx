"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, useToast } from "@menumate/app";
import { Receipt, CreditCard, Store, Users, ArrowLeft, Loader2 } from "lucide-react";
import type { RazorpayPaymentResponse, RazorpayCheckoutOptions } from "@/lib/types/razorpay";
import { usePusherChannel } from "@/lib/pusher-client";
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
  paymentStatus: string;
  startedAt: string;
}

function BillPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const sessionToken = searchParams.get("session");

  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"online" | "counter" | null>(null);

  useEffect(() => {
    if (sessionToken) {
      fetchSessionData();
    }
  }, [sessionToken]);

  // Listen for order status updates via WebSocket
  usePusherChannel(
    sessionToken ? `session-${sessionToken}` : null,
    "order:status:updated",
    (data: unknown) => {
      const eventData = data as { orderId: string; status: string };
      setOrders((prev) =>
        prev.map((order) =>
          order.id === eventData.orderId
            ? { ...order, status: eventData.status }
            : order
        )
      );

      // Show notification
      if (eventData.status === "ready") {
        showToast("One of your orders is ready! 🎉", "success");
      }
    }
  );

  // Listen for counter payment confirmation
  usePusherChannel(
    sessionToken ? `session-${sessionToken}` : null,
    "payment:counter:received",
    (data: unknown) => {
      const eventData = data as { sessionId: string; tableNumber: string; totalAmount: string };
      showToast("Payment received! Thank you! ✅", "success");
      // Update session status
      if (session) {
        setSession({ ...session, status: "paid", paymentStatus: "paid" });
      }
      // Clear session from localStorage
      if (sessionToken) {
        localStorage.removeItem(`session_${sessionToken}`);
        const masterKey = `active_session_${sessionToken.split('_')[0]}`;
        localStorage.removeItem(masterKey);
      }
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  );

  const fetchSessionData = async () => {
    if (!sessionToken) return;

    try {
      const response = await fetch(`/api/sessions/${sessionToken}`);
      const data = await response.json();

      if (data.success) {
        setSession(data.session);
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
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
        throw new Error(data.message || data.error || "Failed to create payment");
      }

      showToast("Opening payment gateway...", "info");

      // Initialize Razorpay
      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_RzS6YyboMHsR4m",
        amount: data.data.amount,
        currency: data.data.currency,
        name: "MenuMate",
        description: `Table ${session.tableNumber} - Total Bill`,
        order_id: data.data.id,
        handler: async function (response: RazorpayPaymentResponse) {
          console.log("[BILL] Payment successful:", response);
          // Close session with online payment
          await closeSession("online", response.razorpay_payment_id);
        },
        modal: {
          ondismiss: function () {
            console.log("[BILL] Payment modal dismissed by user");
            showToast("Payment cancelled", "info");
          },
        },
        theme: {
          color: "#f97316",
        },
      };

      console.log("[BILL] Opening Razorpay with order:", data.data.id);
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      showToast(
        error instanceof Error ? error.message : "Failed to process payment",
        "error"
      );
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading your bill...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Session</h2>
          <p className="text-gray-600 mb-4">Please scan the QR code on your table to start ordering.</p>
          <Button onClick={() => router.push("/")}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Receipt className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Your Bill</h1>
                  <p className="text-orange-100">Table {session.tableNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-sm">Session</p>
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
                      <span className="text-sm font-bold text-orange-600">
                        ₹{Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div className="bg-orange-50 rounded-xl p-6">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Grand Total</span>
                <span className="text-3xl font-bold text-orange-600">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Selection */}
            {session.status === "active" && orders.length > 0 && !showPaymentSelection && (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPaymentSelection(true)}
                  className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
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
            {session.status === "active" && session.paymentStatus === "pending" && selectedPaymentMethod === "counter" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Store className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-yellow-900">Payment Request Sent</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please proceed to the counter to complete your payment. Our staff has been notified.
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BillPageContent />
    </Suspense>
  );
}

