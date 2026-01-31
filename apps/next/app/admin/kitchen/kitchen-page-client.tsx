"use client";

import { useEffect, useState, useRef } from "react";
import { Button, useToast } from "@menumate/app";
import { usePolling } from "@/lib/use-polling";
import { Bell, Clock, CheckCircle, ChefHat } from "lucide-react";
import { getTimeAgo } from "@/lib/date-utils";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: "pending" | "cooking" | "ready" | "served" | "paid" | "cancelled";
  tableNumber: string | null;
  totalAmount: string;
  customerName: string;
  notes: string | null;
  createdAt: Date | string;
}

interface KitchenPageClientProps {
  restaurantId: string;
  initialOrders: Order[];
}

export function KitchenPageClient({
  restaurantId,
  initialOrders,
}: KitchenPageClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { showToast } = useToast();
  const prevCountRef = useRef(initialOrders.length);

  // Poll for orders (local setup) - kitchen refreshes more often
  usePolling<{ data: Order[] }>(
    `/api/realtime/orders?restaurantId=${restaurantId}`,
    3000,
    (res) => {
      if (res.data && Array.isArray(res.data)) {
        const newCount = res.data.length;
        if (newCount > prevCountRef.current) {
          playNotificationSound();
          showToast("New order received!", "info");
        }
        prevCountRef.current = newCount;
        setOrders(res.data as Order[]);
      }
    }
  );

  const playNotificationSound = () => {
    // Try to play notification sound
    try {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: Use browser notification API
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("New Order!", {
            body: "A new order has been placed",
            icon: "/icon-192x192.png",
          });
        }
      });
    } catch (error) {
      console.error("Failed to play notification sound:", error);
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const updateStatus = async (orderId: string, status: Order["status"]) => {
    setUpdatingOrderId(orderId);
    
    // Store current order state for error recovery
    const currentOrder = orders.find((o) => o.id === orderId);
    const previousStatus = currentOrder?.status;
    
    // Optimistically update the UI immediately
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        showToast(`Order marked as ${status}`, "success");
        // WebSocket will also update it, but we've already updated optimistically
      } else {
        const result = await response.json();
        // Revert optimistic update on error
        if (previousStatus) {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: previousStatus } : order
            )
          );
        }
        showToast(result.error || "Failed to update order", "error");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      // Revert optimistic update on error
      if (previousStatus) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: previousStatus } : order
          )
        );
      }
      showToast("An error occurred", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const cookingOrders = orders.filter((o) => o.status === "cooking");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const servedOrders = orders.filter((o) => o.status === "served");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Kitchen Display System</h1>
        <p className="mt-1 text-sm text-neutral-600">Real-time order management</p>
      </div>

      {/* Stats - same alignment as admin dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Pending</p>
              <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{pendingOrders.length}</p>
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
              <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">{cookingOrders.length}</p>
              <p className="stat-change">In kitchen</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ChefHat className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="stat-label stat-label-fixed-height mb-1">Ready</p>
              <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">{readyOrders.length}</p>
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
              <p className="stat-label stat-label-fixed-height mb-1">Served</p>
              <p className="stat-value min-h-[2.25rem] flex items-center">{servedOrders.length}</p>
              <p className="stat-change">Done</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-5 h-5 text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200 bg-warning-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Pending</h2>
            <span className="bg-warning-100 text-warning-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {pendingOrders.length}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto flex-1">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={(status) => updateStatus(order.id, status)}
                  isUpdating={updatingOrderId === order.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Cooking Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200 bg-primary-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Cooking</h2>
            <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {cookingOrders.length}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto flex-1">
            {cookingOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                  <ChefHat className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">No orders cooking</p>
              </div>
            ) : (
              cookingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={(status) => updateStatus(order.id, status)}
                  isUpdating={updatingOrderId === order.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Ready Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200 bg-success-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Ready</h2>
            <span className="bg-success-100 text-success-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {readyOrders.length}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto flex-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">No orders ready</p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={(status) => updateStatus(order.id, status)}
                  isUpdating={updatingOrderId === order.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Served Orders */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Served</h2>
            <span className="bg-neutral-200 text-neutral-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
              {servedOrders.length}
            </span>
          </div>
          <div className="p-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto flex-1">
            {servedOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">No orders served</p>
              </div>
            ) : (
              servedOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onUpdateStatus,
  isUpdating = false,
}: {
  order: Order;
  onUpdateStatus?: (status: Order["status"]) => void;
  isUpdating?: boolean;
}) {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const timeAgo = getTimeAgo(order.createdAt);

  const statusBorderColors: Record<Order["status"], string> = {
    pending: "border-l-warning-400",
    cooking: "border-l-primary-400",
    ready: "border-l-success-400",
    served: "border-l-neutral-400",
    paid: "border-l-neutral-400",
    cancelled: "border-l-error-400",
  };

  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-3 border-l-4 ${statusBorderColors[order.status]} shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-sm text-neutral-900">Table {order.tableNumber || "N/A"}</div>
          <div className="text-xs text-neutral-600">{order.customerName}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-sm text-neutral-900">₹{Number(order.totalAmount).toFixed(2)}</div>
          <div className="text-2xs text-neutral-500">{timeAgo}</div>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-xs font-medium mb-1.5 text-neutral-600">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </div>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-xs text-neutral-600">
              <span className="font-medium">{item.quantity}×</span> {item.name}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="mb-2 text-xs text-warning-700 bg-warning-50 border border-warning-200 p-2 rounded-lg">
          <strong>Note:</strong> {order.notes}
        </div>
      )}

      {onUpdateStatus && (
        <div className="flex gap-2">
          {order.status === "pending" && (
            <Button
              onClick={() => onUpdateStatus("cooking")}
              disabled={isUpdating}
              className="flex-1 !bg-primary-600 hover:!bg-primary-700 text-white font-medium"
            >
              {isUpdating ? "..." : "Start Cooking"}
            </Button>
          )}
          {order.status === "cooking" && (
            <Button
              onClick={() => onUpdateStatus("ready")}
              disabled={isUpdating}
              className="flex-1 !bg-success-600 hover:!bg-success-700 text-white font-medium"
            >
              {isUpdating ? "..." : "Mark Ready"}
            </Button>
          )}
          {order.status === "ready" && (
            <Button
              onClick={() => onUpdateStatus("served")}
              disabled={isUpdating}
              className="flex-1 !bg-neutral-600 hover:!bg-neutral-700 text-white font-medium"
            >
              {isUpdating ? "..." : "Mark Served"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

