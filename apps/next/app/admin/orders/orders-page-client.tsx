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

  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    cooking: orders.filter(o => o.status === 'cooking').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
  };

  const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
        <p className="mt-1 text-sm text-neutral-600">Real-time order tracking and management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-neutral-600 font-medium mb-1">Total Orders</div>
          <div className="text-2xl font-semibold text-neutral-900">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-warning-600 font-medium mb-1">Pending</div>
          <div className="text-2xl font-semibold text-warning-600">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-primary-600 font-medium mb-1">Cooking</div>
          <div className="text-2xl font-semibold text-primary-600">{stats.cooking}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-success-600 font-medium mb-1">Ready</div>
          <div className="text-2xl font-semibold text-success-600">{stats.ready}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-neutral-600 font-medium mb-1">Total Revenue</div>
          <div className="text-2xl font-semibold text-neutral-900">₹{totalRevenue.toFixed(0)}</div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-card shadow-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-900 mb-1">No orders yet</p>
          <p className="text-xs text-neutral-500">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-professional">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Table</th>
                  <th>Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-neutral-900">#{order.id.slice(0, 8)}</span>
                        {order.sessionId && (
                          <span className="text-2xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                            Session
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-neutral-900">Table {order.tableNumber}</span>
                    </td>
                    <td>
                      <span className="text-sm text-neutral-600" suppressHydrationWarning>
                        {formatIndianDateTime(order.createdAt)}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-neutral-900">₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status]
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {!order.isPaid && order.sessionId && (
                        <div className="text-2xs text-warning-600 font-medium mt-1">
                          Payment pending
                        </div>
                      )}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(
                            order.id,
                            e.target.value as Order["status"]
                          )
                        }
                        disabled={updatingOrderId === order.id}
                        className="text-sm rounded-lg border border-neutral-300 px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none bg-white"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

