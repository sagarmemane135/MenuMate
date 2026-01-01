/**
 * WebSocket event emitter utility
 * Supports both Pusher (for Vercel) and Socket.io (for self-hosted)
 */

import Pusher from "pusher";

interface OrderCreatedEvent {
  order: {
    id: string;
    items: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: string;
    status: string;
    tableNumber: string | null;
    customerName: string;
    createdAt: Date | string;
    notes?: string | null;
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
      console.log("[WEBSOCKET] Emitting to restaurant room:", `restaurant-${restaurantId}`);
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "order:status:updated",
        eventData
      );

      // Emit to session room (for customer) if session token exists
      if (sessionToken) {
        const sessionChannel = `session-${sessionToken}`;
        console.log("[WEBSOCKET] Emitting to session channel:", sessionChannel);
        await pusher.trigger(
          sessionChannel,
          "order:status:updated",
          eventData
        );
        console.log("[WEBSOCKET] Event emitted to session channel successfully");
      } else {
        console.log("[WEBSOCKET] No sessionToken provided, skipping customer notification");
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

/**
 * Emit counter payment requested event to restaurant room (for admin)
 */
export async function emitCounterPaymentRequested(
  restaurantId: string,
  eventData: {
    sessionId: string;
    sessionToken: string;
    tableNumber: string;
    totalAmount: string;
    requestedAt: string;
  }
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

      // Emit to restaurant room (for admin)
      console.log("[WEBSOCKET] Emitting counter payment request to restaurant:", `restaurant-${restaurantId}`);
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "payment:counter:requested",
        eventData
      );
      console.log("[WEBSOCKET] Counter payment request event emitted successfully");
    } else {
      // Fallback: Log event
      console.log("WebSocket event (payment:counter:requested):", {
        channel: `restaurant-${restaurantId}`,
        event: "payment:counter:requested",
        data: eventData,
      });
    }
  } catch (error) {
    console.error("Failed to emit payment:counter:requested event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

/**
 * Emit counter payment received event (when admin marks as paid)
 */
export async function emitCounterPaymentReceived(
  restaurantId: string,
  sessionToken: string,
  eventData: {
    sessionId: string;
    tableNumber: string;
    totalAmount: string;
    paidAt: string;
  }
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

      // Emit to restaurant room (for admin confirmation)
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "payment:counter:received",
        eventData
      );

      // Emit to session room (for customer notification)
      await pusher.trigger(
        `session-${sessionToken}`,
        "payment:counter:received",
        eventData
      );

      console.log("[WEBSOCKET] Counter payment received event emitted successfully");
    } else {
      // Fallback: Log event
      console.log("WebSocket event (payment:counter:received):", {
        channels: [`restaurant-${restaurantId}`, `session-${sessionToken}`],
        event: "payment:counter:received",
        data: eventData,
      });
    }
  } catch (error) {
    console.error("Failed to emit payment:counter:received event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

