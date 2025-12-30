import { NextRequest, NextResponse } from "next/server";
import { db, orders, menuItems, restaurants, tableSessions, eq } from "@menumate/db";
import { z } from "zod";

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

    // Get session
    const [session] = await db
      .select()
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, validatedData.sessionToken))
      .limit(1);

    if (!session || session.status !== "active") {
      return NextResponse.json(
        { error: "Invalid or closed session" },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: `Item ${item.itemId} not available` },
          { status: 400 }
        );
      }

      if (menuItem.restaurantId !== session.restaurantId) {
        return NextResponse.json(
          { error: "Invalid menu item for this restaurant" },
          { status: 400 }
        );
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
        totalAmount,
        status: "pending",
        isPaid: false,
        paymentStatus: "pending",
        notes: validatedData.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        order: {
          id: newOrder.id,
          items: newOrder.items,
          totalAmount: newOrder.totalAmount,
          status: newOrder.status,
          isPaid: newOrder.isPaid,
          createdAt: newOrder.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

