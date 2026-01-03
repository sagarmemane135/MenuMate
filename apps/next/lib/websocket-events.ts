/**
 * WebSocket event emitter utility
 * Supports both Pusher (for Vercel) and Socket.io (for self-hosted)
 */

import Pusher from "pusher";

/**
 * Get a Pusher instance with trimmed credentials
 * This ensures no whitespace issues with environment variables
 */
function getPusherInstance(): Pusher | null {
  if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
    return new Pusher({
      appId: process.env.PUSHER_APP_ID.trim(),
      key: process.env.PUSHER_KEY.trim(),
      secret: process.env.PUSHER_SECRET.trim(),
      cluster: (process.env.PUSHER_CLUSTER || "ap2").trim(),
      useTLS: true,
    });
  }
  return null;
}

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
    const pusher = getPusherInstance();
    if (pusher) {

      console.log("[WS] Triggering order:created on channel:", `restaurant-${restaurantId}`);
      console.log("[WS] Event data:", JSON.stringify(eventData, null, 2));
      
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "order:created",
        eventData
      );
      
      console.log("[WS] ✅ Order:created event triggered successfully");
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
    const pusher = getPusherInstance();
    if (pusher) {

      // Emit to restaurant room (for kitchen staff)
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "order:status:updated",
        eventData
      );

      // Emit to session room (for customer) if session token exists
      if (sessionToken) {
        const sessionChannel = `session-${sessionToken}`;
        await pusher.trigger(
          sessionChannel,
          "order:status:updated",
          eventData
        );
      }
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
    const pusher = getPusherInstance();
    if (pusher) {

      // Emit to restaurant room (for admin)
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "payment:counter:requested",
        eventData
      );
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
    const pusher = getPusherInstance();
    if (pusher) {

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
    }
  } catch (error) {
    console.error("Failed to emit payment:counter:received event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

/**
 * Emit session updated event (when session total or orders change)
 */
export async function emitSessionUpdated(
  restaurantId: string,
  sessionToken: string,
  eventData: {
    sessionId: string;
    tableNumber: string;
    totalAmount: string;
    ordersCount: number;
  }
) {
  try {
    // Use Pusher for Vercel deployment
    const pusher = getPusherInstance();
    if (pusher) {

      // Emit to restaurant room (for admin/sessions page)
      console.log("[WS] Triggering session:updated on channel:", `restaurant-${restaurantId}`);
      console.log("[WS] Session update data:", JSON.stringify(eventData, null, 2));
      
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "session:updated",
        eventData
      );
      
      console.log("[WS] ✅ Session:updated event triggered successfully");

      // Emit to session room (for customer)
      await pusher.trigger(
        `session-${sessionToken}`,
        "session:updated",
        eventData
      );
    }
  } catch (error) {
    console.error("[WS] Failed to emit session:updated event:", error);
  }
}

/**
 * Emit session closed/paid event (when session is closed or paid)
 */
export async function emitSessionClosed(
  restaurantId: string,
  sessionToken: string,
  eventData: {
    sessionId: string;
    tableNumber: string;
    status: "closed" | "paid";
    totalAmount: string;
    paymentMethod?: string;
  }
) {
  try {
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap2",
        useTLS: true,
      });

      console.log("[WS] Triggering session:closed on channel:", `restaurant-${restaurantId}`);
      await pusher.trigger(
        `restaurant-${restaurantId}`,
        "session:closed",
        eventData
      );

      console.log("[WS] Triggering session:closed on channel:", `session-${sessionToken}`);
      await pusher.trigger(
        `session-${sessionToken}`,
        "session:closed",
        eventData
      );
    }
  } catch (error) {
    console.error("Failed to emit session:updated event:", error);
    // Don't fail the request if WebSocket emission fails
  }
}

