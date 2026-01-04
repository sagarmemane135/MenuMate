/**
 * WebSocket event emitter utility
 * Silently uses Pusher if configured, otherwise events are skipped (client uses polling fallback)
 */

import Pusher from "pusher";

/**
 * Get Pusher instance with trimmed credentials
 * Returns null if Pusher is not configured (polling fallback will be used on client)
 */
function getPusherInstance(): Pusher | null {
  if (
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET
  ) {
    return new Pusher({
      appId: process.env.PUSHER_APP_ID.trim(),
      key: process.env.PUSHER_KEY.trim(),
      secret: process.env.PUSHER_SECRET.trim(),
      cluster: (process.env.PUSHER_CLUSTER || "ap2").trim(),
      useTLS: true,
    });
  }

  // Silently return null - client will use polling fallback
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
 * Emit an order:created event
 */
export async function emitOrderCreated(restaurantId: string, eventData: OrderCreatedEvent) {
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
    await pusher.trigger(`restaurant-${restaurantId}`, "order:created", eventData);
    console.log(`[PUSHER] ✅ Emitted order:created to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit order:created:", error);
  }
}

/**
 * Emit an order:status:updated event
 */
export async function emitOrderStatusUpdated(
  restaurantId: string,
  sessionToken: string | null,
  eventData: OrderStatusUpdatedEvent
) {
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
    // Emit to restaurant room (for kitchen staff)
    await pusher.trigger(`restaurant-${restaurantId}`, "order:status:updated", eventData);

    // Emit to session room (for customer) if session token exists
    if (sessionToken) {
      await pusher.trigger(`session-${sessionToken}`, "order:status:updated", eventData);
    }
    
    console.log(`[PUSHER] ✅ Emitted order:status:updated to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit order:status:updated:", error);
  }
}

/**
 * Emit a payment:counter:requested event
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
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
    await pusher.trigger(
      `restaurant-${restaurantId}`,
      "payment:counter:requested",
      eventData
    );
    console.log(`[PUSHER] ✅ Emitted payment:counter:requested to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit payment:counter:requested:", error);
  }
}

/**
 * Emit a payment:counter:received event
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
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
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
    
    console.log(`[PUSHER] ✅ Emitted payment:counter:received to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit payment:counter:received:", error);
  }
}

/**
 * Emit a session:updated event
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
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
    // Emit to restaurant room (for admin/sessions page)
    await pusher.trigger(`restaurant-${restaurantId}`, "session:updated", eventData);

    // Emit to session room (for customer)
    await pusher.trigger(`session-${sessionToken}`, "session:updated", eventData);
    
    console.log(`[PUSHER] ✅ Emitted session:updated to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit session:updated:", error);
  }
}

/**
 * Emit a session:closed event
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
  const pusher = getPusherInstance();
  if (!pusher) {
    return;
  }

  try {
    await pusher.trigger(`restaurant-${restaurantId}`, "session:closed", eventData);
    await pusher.trigger(`session-${sessionToken}`, "session:closed", eventData);
    
    console.log(`[PUSHER] ✅ Emitted session:closed to restaurant-${restaurantId}`);
  } catch (error) {
    console.error("[PUSHER] ❌ Failed to emit session:closed:", error);
  }
}
