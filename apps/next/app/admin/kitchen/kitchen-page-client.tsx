"use client";

import { useEffect, useState, useRef } from "react";
import { Button, useToast } from "@menumate/app";
import { usePusherChannel } from "@/lib/pusher-client";
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
  
  // Keep reference to current orders for error recovery
  const ordersRef = useRef<Order[]>(initialOrders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  // Debug: Log initial orders
  useEffect(() => {
    console.log("[KDS] Initial orders loaded:", initialOrders.length, initialOrders);
    console.log("[KDS] Restaurant ID:", restaurantId);
    console.log("[KDS] Listening on channel:", `restaurant-${restaurantId}`);
  }, []);

  // Listen for new orders
  usePusherChannel(
    `restaurant-${restaurantId}`,
    "order:created",
    (data: unknown) => {
      console.log("[KDS] Received order:created event:", data);
      const eventData = data as { order: Order; session: { id: string; tableNumber: string } };
      
      // Ensure order data matches Order interface
      const newOrder: Order = {
        id: eventData.order.id,
        items: eventData.order.items,
        status: eventData.order.status,
        tableNumber: eventData.order.tableNumber,
        totalAmount: eventData.order.totalAmount,
        customerName: eventData.order.customerName,
        notes: eventData.order.notes || null,
        createdAt: eventData.order.createdAt,
      };
      
      console.log("[KDS] Adding new order to state:", newOrder);
      setOrders((prev) => {
        // Check if order already exists to prevent duplicates
        const exists = prev.find((o) => o.id === newOrder.id);
        if (exists) {
          console.log("[KDS] Order already exists, skipping:", newOrder.id);
          return prev;
        }
        console.log("[KDS] Adding order, new count:", prev.length + 1);
        return [newOrder, ...prev];
      });
      playNotificationSound();
      showToast(`New order from Table ${eventData.session.tableNumber}!`, "info");
    }
  );

  // Listen for status updates
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3 text-neutral-900">
            <ChefHat className="w-7 h-7 text-primary-600" />
            Kitchen Display System
          </h1>
          <p className="text-sm text-neutral-600 mt-1">Real-time order management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="stat-card">
            <div className="text-xs text-neutral-600 font-medium">Active Orders</div>
            <div className="text-2xl font-semibold text-neutral-900 mt-1">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Orders */}
        <div className="bg-white border border-neutral-200 rounded-card shadow-card">
          <div className="px-4 py-3 border-b border-neutral-200 bg-warning-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning-600" />
                <h2 className="text-base font-semibold text-neutral-900">Pending</h2>
              </div>
              <span className="bg-warning-100 text-warning-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {pendingOrders.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No pending orders</p>
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
        <div className="bg-white border border-neutral-200 rounded-card shadow-card">
          <div className="px-4 py-3 border-b border-neutral-200 bg-primary-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary-600" />
                <h2 className="text-base font-semibold text-neutral-900">Cooking</h2>
              </div>
              <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {cookingOrders.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {cookingOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No orders cooking</p>
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
        <div className="bg-white border border-neutral-200 rounded-card shadow-card">
          <div className="px-4 py-3 border-b border-neutral-200 bg-success-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success-600" />
                <h2 className="text-base font-semibold text-neutral-900">Ready</h2>
              </div>
              <span className="bg-success-100 text-success-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {readyOrders.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {readyOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No orders ready</p>
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
        <div className="bg-white border border-neutral-200 rounded-card shadow-card">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-neutral-600" />
                <h2 className="text-base font-semibold text-neutral-900">Served</h2>
              </div>
              <span className="bg-neutral-200 text-neutral-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {servedOrders.length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            {servedOrders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">No orders served</p>
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
    <div className={`bg-white rounded-lg p-3 border-l-4 ${statusBorderColors[order.status]} shadow-soft hover:shadow-card transition-shadow`}>
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
        <div className="text-xs font-medium mb-1.5 text-neutral-700">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </div>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-xs text-neutral-600">
              <span className="font-medium">{item.quantity}x</span> {item.name}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="mb-2 text-xs text-warning-700 bg-warning-50 border border-warning-200 p-2 rounded">
          <strong>Note:</strong> {order.notes}
        </div>
      )}

      {onUpdateStatus && (
        <div className="flex gap-2">
          {order.status === "pending" && (
            <Button
              onClick={() => onUpdateStatus("cooking")}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? "..." : "Start Cooking"}
            </Button>
          )}
          {order.status === "cooking" && (
            <Button
              onClick={() => onUpdateStatus("ready")}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isUpdating ? "..." : "Mark Ready"}
            </Button>
          )}
          {order.status === "ready" && (
            <Button
              onClick={() => onUpdateStatus("served")}
              disabled={isUpdating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isUpdating ? "..." : "Mark Served"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

