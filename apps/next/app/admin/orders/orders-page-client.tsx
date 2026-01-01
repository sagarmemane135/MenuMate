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
  pending: "bg-yellow-100 text-yellow-800",
  cooking: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  served: "bg-purple-100 text-purple-800",
  paid: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
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
      const eventData = data as { order: Order; session: { id: string; tableNumber: string } };
      setOrders((prev) => [eventData.order, ...prev]);
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
    <div className="px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="mt-2 text-gray-600">Manage and track restaurant orders</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <p className="text-gray-600 text-center py-8">No orders yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        statusColors[order.status]
                      }`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Table: {order.tableNumber}
                    {order.sessionId && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Session
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600" suppressHydrationWarning>
                    Created: {formatIndianDateTime(order.createdAt)}
                  </p>
                  {!order.isPaid && order.sessionId && (
                    <p className="text-xs text-orange-600 font-semibold mt-1">
                      ⏳ Pending payment (part of active session)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ₹{parseFloat(order.totalAmount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
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
                      className="text-sm rounded-md border border-gray-300 px-2 py-1"
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

