"use client";

import { useState, useEffect } from "react";
import { Store, X, CheckCircle } from "lucide-react";
import { usePusherChannel } from "@/lib/pusher-client";
import { Button, useToast } from "@menumate/app";

interface CounterPaymentRequest {
  sessionId: string;
  sessionToken: string;
  tableNumber: string;
  totalAmount: string;
  requestedAt: string;
}

interface CounterPaymentNotificationsProps {
  restaurantId: string | null;
}

export function CounterPaymentNotifications({ restaurantId }: CounterPaymentNotificationsProps) {
  const [pendingPayments, setPendingPayments] = useState<CounterPaymentRequest[]>([]);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { showToast } = useToast();
  const [showTestButton, setShowTestButton] = useState(false);

  // Don't render if no restaurant ID
  if (!restaurantId) {
    return null;
  }

  // Test function to manually trigger a notification
  const testPusherConnection = async () => {
    try {
      console.log("[TEST] 🧪 Sending test notification...");
      const response = await fetch("/api/test-pusher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });
      
      const data = await response.json();
      if (data.success) {
        showToast("Test notification sent! Check console and notifications.", "info");
      } else {
        showToast("Test failed: " + data.error, "error");
      }
    } catch (error) {
      console.error("[TEST] ❌ Error:", error);
      showToast("Test error: " + String(error), "error");
    }
  };

  // Load pending payments from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`pending-counter-payments-${restaurantId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPendingPayments(parsed);
      } catch (error) {
        console.error("Failed to parse stored payments:", error);
      }
    }

    // Enable test button with Ctrl+Alt+P (P for Pusher test)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "p") {
        setShowTestButton((prev) => !prev);
        console.log("[TEST] Test button toggled", !showTestButton);
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [restaurantId]);

  // Save pending payments to localStorage whenever they change
  useEffect(() => {
    if (pendingPayments.length > 0) {
      localStorage.setItem(
        `pending-counter-payments-${restaurantId}`,
        JSON.stringify(pendingPayments)
      );
    } else {
      localStorage.removeItem(`pending-counter-payments-${restaurantId}`);
    }
  }, [pendingPayments, restaurantId]);

  // Listen for new counter payment requests
  useEffect(() => {
    console.log("[COUNTER PAYMENT] 🔌 Subscribing to channel: restaurant-" + restaurantId);
    console.log("[COUNTER PAYMENT] 📡 Listening for event: payment:counter:requested");
  }, [restaurantId]);

  usePusherChannel(
    `restaurant-${restaurantId}`,
    "payment:counter:requested",
    (data: unknown) => {
      const eventData = data as CounterPaymentRequest;
      
      console.log("[COUNTER PAYMENT] 🎉 New request received:", eventData);
      
      // Add to pending list if not already present
      setPendingPayments((prev) => {
        const exists = prev.find((p) => p.sessionId === eventData.sessionId);
        if (exists) {
          console.log("[COUNTER PAYMENT] ⚠️ Payment request already exists, ignoring");
          return prev;
        }
        
        console.log("[COUNTER PAYMENT] ✅ Adding to pending list");
        
        // Play notification sound
        playNotificationSound();
        
        return [...prev, eventData];
      });
    }
  );

  // Listen for payment confirmations
  usePusherChannel(
    `restaurant-${restaurantId}`,
    "payment:counter:received",
    (data: unknown) => {
      const eventData = data as { sessionId: string };
      
      console.log("[COUNTER PAYMENT] Payment received confirmation:", eventData);
      
      // Remove from pending list
      setPendingPayments((prev) =>
        prev.filter((p) => p.sessionId !== eventData.sessionId)
      );
    }
  );

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Fallback: Use browser notification API
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Counter Payment Request", {
            body: "A customer is waiting to pay at the counter",
            icon: "/icon-192x192.png",
          });
        }
      });
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  };

  const handleMarkPaid = async (payment: CounterPaymentRequest) => {
    setProcessingPayment(payment.sessionId);
    
    try {
      const response = await fetch(`/api/sessions/${payment.sessionToken}/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "counter" }),
      });

      if (response.ok) {
        // Remove from list
        setPendingPayments((prev) =>
          prev.filter((p) => p.sessionId !== payment.sessionId)
        );
        showToast("Payment marked as received!", "success");
      } else {
        const result = await response.json();
        showToast(result.error || "Failed to mark payment as paid", "error");
      }
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      showToast("An error occurred while marking payment as paid", "error");
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleDismiss = (sessionId: string) => {
    if (confirm("Are you sure you want to dismiss this notification? The payment will still be pending.")) {
      setPendingPayments((prev) =>
        prev.filter((p) => p.sessionId !== sessionId)
      );
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2">
      {/* Test Button - Hidden by default, show with Ctrl+Alt+P */}
      {showTestButton && (
        <div className="bg-primary-50 border border-primary-300 rounded-lg p-3 mb-2">
          <p className="text-xs text-primary-700 mb-2">
            Pusher Test Mode <span className="text-primary-500">(Ctrl+Alt+P to hide)</span>
          </p>
          <Button
            onClick={testPusherConnection}
            size="sm"
            className="w-full"
          >
            🧪 Send Test Notification
          </Button>
        </div>
      )}
      
      {pendingPayments.length === 0 && !showTestButton ? null : (
        <>
      {pendingPayments.map((payment) => (
        <div
          key={payment.sessionId}
          className="bg-warning-50 border-2 border-warning-500 rounded-xl shadow-2xl p-4 animate-pulse-subtle"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning-600 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-warning-900">
                  Table {payment.tableNumber}
                </h3>
                <p className="text-sm text-warning-700">
                  Waiting to pay at counter
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(payment.sessionId)}
              className="text-warning-600 hover:text-warning-800 p-1"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-neutral-600">Amount:</span>
              <span className="text-2xl font-bold text-warning-700">
                ₹{Number(payment.totalAmount).toFixed(2)}
              </span>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Requested: {new Date(payment.requestedAt).toLocaleTimeString()}
            </div>
          </div>

          <Button
            onClick={() => handleMarkPaid(payment)}
            disabled={processingPayment === payment.sessionId}
            className="w-full bg-success-600 hover:bg-success-700 text-white"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {processingPayment === payment.sessionId ? "Processing..." : "Mark as Paid"}
          </Button>
        </div>
      ))}
      </>
      )}
    </div>
  );
}

