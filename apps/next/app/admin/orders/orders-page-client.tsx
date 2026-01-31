"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, useToast } from "@menumate/app";
import { usePolling } from "@/lib/use-polling";
import { formatIndianDateTime } from "@/lib/date-utils";
import { ClipboardList, Clock, Flame, CheckCircle, DollarSign } from "lucide-react";

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
  const prevCountRef = useRef(initialOrders.length);

  const applyOrdersFromApi = useCallback((res: { data?: Order[] }) => {
    if (res.data && Array.isArray(res.data)) {
      const newCount = res.data.length;
      if (newCount > prevCountRef.current) {
        showToast("New order received! 🎉", "info");
      }
      prevCountRef.current = newCount;
      setOrders(res.data);
    }
  }, []);

  // Poll for order updates (local setup)
  usePolling<{ data: Order[] }>(
    `/api/realtime/orders?restaurantId=${restaurantId}`,
    5000,
    applyOrdersFromApi
  );

  // Refetch orders immediately when payment is marked paid (e.g. from pay-at-counter panel)
  useEffect(() => {
    const handler = async () => {
      try {
        const res = await fetch(`/api/realtime/orders?restaurantId=${restaurantId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          applyOrdersFromApi(json);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("admin:payment-marked-paid", handler);
    return () => window.removeEventListener("admin:payment-marked-paid", handler);
  }, [restaurantId, applyOrdersFromApi]);

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

  const totalRevenue = orders
    .filter((order) => order.isPaid === true)
    .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Orders</h1>
        <p className="mt-1 text-sm text-neutral-600">Real-time order tracking and management</p>
      </div>

      {/* Stats Overview - same alignment as admin dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Orders</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">{stats.total}</p>
              <p className="stat-change">All orders</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ClipboardList className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Pending</p>
              <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{stats.pending}</p>
              <p className="stat-change">Awaiting</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-warning-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Cooking</p>
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{stats.cooking}</p>
              <p className="stat-change">In kitchen</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Flame className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Ready</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">{stats.ready}</p>
              <p className="stat-change">To serve</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Total Revenue</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">₹{totalRevenue.toFixed(0)}</p>
              <p className="stat-change">From paid orders only</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5 text-success-600" />
            </div>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No orders yet</p>
            <p className="text-xs text-neutral-500 mt-1">Orders will appear here when customers place them</p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
            <h2 className="text-sm font-semibold text-neutral-900">All orders</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Update status from the dropdown</p>
          </div>
          <div className="w-full overflow-x-auto -mx-1">
            <table className="table-professional w-full">
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

