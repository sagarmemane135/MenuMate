"use client";

import { useState } from "react";
import { Card, Button, useToast } from "@menumate/app";
import { usePusherChannel } from "@/lib/pusher-client";
import { formatIndianDateTime } from "@/lib/date-utils";

interface Order {
  id: string;
  tableNumber: string | null;
  status: "pending" | "cooking" | "ready" | "served" | "paid" | "cancelled";
  totalAmount: string;
  createdAt: Date | string;
  sessionId: string | null;
  isPaid: boolean;
}

interface OrdersPageClientProps {
  initialOrders: Order[];
  restaurantId: string;
}

const statusColors = {
  pending: "bg-warning-50 text-warning-700",
  cooking: "bg-primary-50 text-primary-700",
  ready: "bg-success-50 text-success-700",
  served: "bg-neutral-100 text-neutral-700",
  paid: "bg-neutral-100 text-neutral-700",
  cancelled: "bg-error-50 text-error-700",
};

const statusOptions: Array<{ value: Order["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "cooking", label: "Cooking" },
  { value: "ready", label: "Ready" },
  { value: "served", label: "Served" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersPageClient({ initialOrders, restaurantId }: OrdersPageClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { showToast } = useToast();

  // Listen for new orders and status updates
  usePusherChannel(
    `restaurant-${restaurantId}`,
    "order:created",
    (data: unknown) => {
      const eventData = data as { 
        order: {
          id: string;
          tableNumber: string | null;
          status: string;
          totalAmount: string;
          createdAt: Date | string;
          sessionId?: string | null;
          isPaid?: boolean;
        };
        session: { id: string; tableNumber: string };
      };
      // Map to Order interface (this page doesn't need items, customerName, notes)
      const newOrder: Order = {
        id: eventData.order.id,
        tableNumber: eventData.order.tableNumber,
        status: eventData.order.status as Order["status"],
        totalAmount: eventData.order.totalAmount,
        createdAt: eventData.order.createdAt,
        sessionId: eventData.order.sessionId || null,
        isPaid: eventData.order.isPaid || false,
      };
      setOrders((prev) => [newOrder, ...prev]);
      showToast("New order received! 🎉", "info");
    }
  );

  usePusherChannel(
    `restaurant-${restaurantId}`,
    "order:status:updated",
    (data: unknown) => {
      const eventData = data as { orderId: string; status: string };
      setOrders((prev) =>
        prev.map((order) =>
          order.id === eventData.orderId
            ? { ...order, status: eventData.status as Order["status"] }
            : order
        )
      );
    }
  );

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        // Update order status in state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: result.data.order.status } : order
          )
        );
        showToast(`Order status updated to ${newStatus}`, "success");
      } else {
        const result = await response.json();
        showToast(result.error || "Failed to update order status", "error");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      showToast("An error occurred while updating the order", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
        <p className="mt-1 text-sm text-neutral-600">Track and manage all restaurant orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-card shadow-card p-12 text-center">
          <p className="text-sm text-neutral-600">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-neutral-200 rounded-card shadow-card hover:shadow-dropdown transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-neutral-600">
                        Table: <span className="font-medium text-neutral-900">{order.tableNumber}</span>
                        {order.sessionId && (
                          <span className="ml-2 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                            Session
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-500" suppressHydrationWarning>
                        {formatIndianDateTime(order.createdAt)}
                      </p>
                      {!order.isPaid && order.sessionId && (
                        <p className="text-xs text-warning-600 font-medium mt-2">
                          Pending payment (active session)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500 mb-1">Amount</p>
                      <p className="text-lg font-semibold text-neutral-900">
                        ₹{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Status
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            order.id,
                            e.target.value as Order["status"]
                          )
                        }
                        disabled={updatingOrderId === order.id}
                        className="text-sm rounded-lg border border-neutral-300 px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

