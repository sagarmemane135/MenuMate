"use client";

import { useEffect, useState } from "react";
import { Button, useToast } from "@menumate/app";
import { usePusherChannel } from "@/lib/pusher-client";
import { Bell, Clock, CheckCircle, ChefHat } from "lucide-react";

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: "pending" | "cooking" | "ready" | "paid" | "cancelled";
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

  // Listen for new orders
  usePusherChannel(
    `restaurant-${restaurantId}`,
    "order:created",
    (data: unknown) => {
      const eventData = data as { order: Order; session: { id: string; tableNumber: string } };
      setOrders((prev) => [eventData.order, ...prev]);
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
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        showToast(`Order marked as ${status}`, "success");
      } else {
        const result = await response.json();
        showToast(result.error || "Failed to update order", "error");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      showToast("An error occurred", "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const cookingOrders = orders.filter((o) => o.status === "cooking");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <ChefHat className="w-10 h-10" />
            Kitchen Display System
          </h1>
          <p className="text-gray-400">Real-time order management</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Orders</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h2 className="text-2xl font-semibold">Pending</h2>
            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
              {pendingOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending orders</p>
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
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl font-semibold">Cooking</h2>
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm font-bold">
              {cookingOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {cookingOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders cooking</p>
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
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h2 className="text-2xl font-semibold">Ready</h2>
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-sm font-bold">
              {readyOrders.length}
            </span>
          </div>
          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto">
            {readyOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No orders ready</p>
            ) : (
              readyOrders.map((order) => (
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
  const createdAt = new Date(order.createdAt);
  const timeAgo = Math.floor((Date.now() - createdAt.getTime()) / 1000 / 60);

  return (
    <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-400">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-lg">Table {order.tableNumber || "N/A"}</div>
          <div className="text-sm text-gray-400">{order.customerName}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">₹{Number(order.totalAmount).toFixed(2)}</div>
          <div className="text-xs text-gray-400">{timeAgo}m ago</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-sm font-semibold mb-1">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </div>
        <div className="space-y-1">
          {order.items.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-300">
              {item.quantity}x {item.name}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div className="mb-3 text-sm text-yellow-300 bg-yellow-900/20 p-2 rounded">
          <strong>Note:</strong> {order.notes}
        </div>
      )}

      {onUpdateStatus && (
        <div className="flex gap-2">
          {order.status === "pending" && (
            <Button
              onClick={() => onUpdateStatus("cooking")}
              disabled={isUpdating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? "..." : "Start Cooking"}
            </Button>
          )}
          {order.status === "cooking" && (
            <Button
              onClick={() => onUpdateStatus("ready")}
              disabled={isUpdating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "..." : "Mark Ready"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

