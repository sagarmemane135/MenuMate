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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-slate-900">
            <ChefHat className="w-10 h-10 text-orange-500" />
            Kitchen Display System
          </h1>
          <p className="text-slate-600 font-medium">Real-time order management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right bg-white rounded-lg px-4 py-2 shadow-md">
            <div className="text-sm text-slate-600 font-medium">Total Orders</div>
            <div className="text-2xl font-bold text-orange-600">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl p-4 shadow-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-semibold text-slate-900">Pending</h2>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No pending orders</p>
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
        <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-blue-500" />
            <h2 className="text-2xl font-semibold text-slate-900">Cooking</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              {cookingOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {cookingOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders cooking</p>
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
        <div className="bg-white rounded-xl p-4 shadow-lg border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-2xl font-semibold text-slate-900">Ready</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {readyOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders ready</p>
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
        <div className="bg-white rounded-xl p-4 shadow-lg border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-purple-500" />
            <h2 className="text-2xl font-semibold text-slate-900">Served</h2>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
              {servedOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {servedOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders served</p>
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
    pending: "border-yellow-400",
    cooking: "border-blue-400",
    ready: "border-green-400",
    served: "border-purple-400",
    paid: "border-gray-400",
    cancelled: "border-red-400",
  };

  return (
    <div className={`bg-gradient-to-br from-white to-slate-50 rounded-lg p-4 border-l-4 ${statusBorderColors[order.status]} shadow-md`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-lg text-slate-900">Table {order.tableNumber || "N/A"}</div>
          <div className="text-sm text-slate-600">{order.customerName}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg text-orange-600">₹{Number(order.totalAmount).toFixed(2)}</div>
          <div className="text-xs text-slate-500">{timeAgo}m ago</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-semibold mb-1 text-slate-700">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </div>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-sm text-slate-600">
              {item.quantity}x {item.name}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="mb-3 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">
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

