import { NextRequest } from "next/server";
import { db, orders, menuItems, tableSessions, orderIdempotency, eq, lt } from "@menumate/db";
import { z } from "zod";
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
  successResponse,
} from "@/lib/api-response";

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    const idempotencyKey = request.headers.get("idempotency-key") ?? request.headers.get("Idempotency-Key") ?? null;
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Prune expired idempotency keys
    const ttlCutoff = new Date(Date.now() - IDEMPOTENCY_TTL_MS);
    await db.delete(orderIdempotency).where(lt(orderIdempotency.createdAt, ttlCutoff));

    // Return existing order if idempotency key was used recently (prevents duplicate orders)
    if (idempotencyKey && idempotencyKey.length <= 64) {
      const [existing] = await db
        .select()
        .from(orderIdempotency)
        .where(eq(orderIdempotency.idempotencyKey, idempotencyKey))
        .limit(1);
      if (existing && new Date(existing.createdAt).getTime() > ttlCutoff.getTime()) {
        const [cachedOrder] = await db.select().from(orders).where(eq(orders.id, existing.orderId)).limit(1);
        if (cachedOrder) {
          return successResponse(
            {
              id: cachedOrder.id,
              items: cachedOrder.items,
              totalAmount: cachedOrder.totalAmount,
              status: cachedOrder.status,
              isPaid: cachedOrder.isPaid,
              createdAt: cachedOrder.createdAt,
            },
            "Order created successfully"
          );
        }
      }
    }

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
        startedAt: tableSessions.startedAt,
      })
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, validatedData.sessionToken))
      .limit(1);

    if (!session) {
      return errorResponse("Session not found or expired.", 404);
    }
    if (session.status !== "active") {
      return errorResponse("Session is closed or already paid. Please create a new session to order.", 400);
    }

    // Check if session is older than 1 hour (inactive timeout)
    const sessionAge = Date.now() - new Date(session.startedAt).getTime();
    const oneHourInMs = 60 * 60 * 1000;
    
    if (sessionAge > oneHourInMs) {
      // Auto-close the inactive session
      await db
        .update(tableSessions)
        .set({
          status: "closed",
          closedAt: new Date(),
        })
        .where(eq(tableSessions.id, session.id));
      
      console.log(`[ORDER CREATE] Auto-closed inactive session ${session.sessionToken} (age: ${Math.floor(sessionAge / 1000 / 60)} minutes)`);
      return errorResponse("Session has been inactive for too long and was automatically closed. Please create a new session.", 400);
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

    if (idempotencyKey && idempotencyKey.length <= 64) {
      try {
        await db.insert(orderIdempotency).values({
          idempotencyKey: idempotencyKey,
          orderId: newOrder.id,
        });
      } catch (idemError: unknown) {
        const err = idemError as { code?: string };
        if (err?.code === "23505") {
          const [existing] = await db
            .select()
            .from(orderIdempotency)
            .where(eq(orderIdempotency.idempotencyKey, idempotencyKey))
            .limit(1);
          if (existing) {
            const [cachedOrder] = await db.select().from(orders).where(eq(orders.id, existing.orderId)).limit(1);
            if (cachedOrder) {
              return successResponse(
                {
                  id: cachedOrder.id,
                  items: cachedOrder.items,
                  totalAmount: cachedOrder.totalAmount,
                  status: cachedOrder.status,
                  isPaid: cachedOrder.isPaid,
                  createdAt: cachedOrder.createdAt,
                },
                "Order created successfully"
              );
            }
          }
        }
        throw idemError;
      }
    }

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

