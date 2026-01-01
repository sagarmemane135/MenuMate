import { NextRequest } from "next/server";
import { db, orders, menuItems, restaurants, tableSessions, eq } from "@menumate/db";
import { z } from "zod";
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { emitOrderCreated } from "@/lib/websocket-events";

const createOrderSchema = z.object({
  sessionToken: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(15),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Get session with customer details
    const [session] = await db
      .select({
        id: tableSessions.id,
        restaurantId: tableSessions.restaurantId,
        tableNumber: tableSessions.tableNumber,
        status: tableSessions.status,
        sessionToken: tableSessions.sessionToken,
        customerName: tableSessions.customerName,
        customerPhone: tableSessions.customerPhone,
      })
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, validatedData.sessionToken))
      .limit(1);

    if (!session || session.status !== "active") {
      return errorResponse("Invalid or closed session", 400);
    }

    // Validate menu items and calculate total
    let totalAmount = 0;
    const orderItemsData: Array<{
      itemId: string;
      name: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of validatedData.items) {
      const [menuItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, item.itemId))
        .limit(1);

      if (!menuItem || !menuItem.isAvailable) {
        return errorResponse(`Item ${item.itemId} not available`, 400);
      }

      if (menuItem.restaurantId !== session.restaurantId) {
        return errorResponse("Invalid menu item for this restaurant", 400);
      }

      const itemTotal = Number(menuItem.price) * item.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        itemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: Number(menuItem.price),
      });
    }

    // Update session with customer details if not already set
    if (!session.customerName || !session.customerPhone) {
      await db
        .update(tableSessions)
        .set({
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
        })
        .where(eq(tableSessions.id, session.id));
    }

    // Create order (NOT paid yet)
    const [newOrder] = await db
      .insert(orders)
      .values({
        restaurantId: session.restaurantId,
        sessionId: session.id,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        tableNumber: session.tableNumber,
        items: orderItemsData,
        totalAmount: totalAmount.toString(),
        status: "pending",
        isPaid: false,
        paymentStatus: "pending",
        notes: validatedData.notes || null,
      })
      .returning();

    // Update session totalAmount immediately (even if not paid)
    const sessionOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, session.id));

    const sessionTotal = sessionOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    await db
      .update(tableSessions)
      .set({
        totalAmount: sessionTotal.toString(),
      })
      .where(eq(tableSessions.id, session.id));

    // Emit WebSocket event to restaurant room (for kitchen staff)
    const orderData = {
      id: newOrder.id,
      items: newOrder.items as Array<{
        itemId: string;
        name: string;
        quantity: number;
        price: number;
      }>,
      totalAmount: newOrder.totalAmount,
      status: newOrder.status as "pending" | "cooking" | "ready" | "served" | "paid" | "cancelled",
      tableNumber: session.tableNumber,
      customerName: validatedData.customerName,
      notes: newOrder.notes || null,
      createdAt: newOrder.createdAt instanceof Date ? newOrder.createdAt.toISOString() : newOrder.createdAt,
    };
    
    console.log("[API] Emitting order:created event for restaurant:", session.restaurantId);
    console.log("[API] Order data:", orderData);
    
    await emitOrderCreated(session.restaurantId, {
      order: orderData,
      session: {
        id: session.id,
        tableNumber: session.tableNumber,
      },
    });

    // Also emit to session channel for customer
    const { emitOrderStatusUpdated, emitSessionUpdated } = await import("@/lib/websocket-events");
    await emitOrderStatusUpdated(
      session.restaurantId,
      session.sessionToken,
      {
        orderId: newOrder.id,
        status: newOrder.status,
        tableNumber: session.tableNumber,
      }
    );

    // Emit session updated event (for sessions page and customer)
    await emitSessionUpdated(
      session.restaurantId,
      session.sessionToken,
      {
        sessionId: session.id,
        tableNumber: session.tableNumber,
        totalAmount: sessionTotal.toString(),
        ordersCount: sessionOrders.length,
      }
    );

    return createdResponse(
      {
        id: newOrder.id,
        items: newOrder.items,
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        isPaid: newOrder.isPaid,
        createdAt: newOrder.createdAt,
      },
      "Order created successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }

    console.error("Order creation error:", error);
    return internalErrorResponse("Failed to create order");
  }
}

