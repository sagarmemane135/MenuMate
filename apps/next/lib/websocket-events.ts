/**
 * WebSocket event emitter utility
 * Supports both Pusher (for Vercel) and Socket.io (for self-hosted)
 */

import Pusher from "pusher";

interface OrderCreatedEvent {
  order: {
    id: string;
    items: unknown;
    totalAmount: string;
    status: string;
    tableNumber: string | null;
    customerName: string;
    createdAt: Date | string;
  };
  session: {
    id: string;
    tableNumber: string;
  };
}

interface OrderStatusUpdatedEvent {
  orderId: string;
  status: string;
  tableNumber?: string | null;
}

/**
 * Emit order created event to restaurant room
 */
export async function emitOrderCreated(
  restaurantId: string,
  eventData: OrderCreatedEvent
) {
  try {
    // Use Pusher for Vercel deployment
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap2",
        useTLS: true,
      });

      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "order:created",
        eventData
      );
    } else {
      // Fallback: Log event (for development or when Pusher not configured)
      console.log("WebSocket event (order:created):", {
        channel: `restaurant-${restaurantId}`,
        event: "order:created",
        data: eventData,
      });
    }
  } catch (error) {
    console.error("Failed to emit order:created event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

/**
 * Emit order status updated event
 */
export async function emitOrderStatusUpdated(
  restaurantId: string,
  sessionToken: string | null,
  eventData: OrderStatusUpdatedEvent
) {
  try {
    // Use Pusher for Vercel deployment
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap2",
        useTLS: true,
      });

      // Emit to restaurant room (for kitchen staff)
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "order:status:updated",
        eventData
      );

      // Emit to session room (for customer) if session token exists
      if (sessionToken) {
        await pusher.trigger(
          `session-${sessionToken}`,
          "order:status:updated",
          eventData
        );
      }
    } else {
      // Fallback: Log event
      console.log("WebSocket event (order:status:updated):", {
        channels: [`restaurant-${restaurantId}`, sessionToken ? `session-${sessionToken}` : null].filter(Boolean),
        event: "order:status:updated",
        data: eventData,
      });
    }
  } catch (error) {
    console.error("Failed to emit order:status:updated event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

