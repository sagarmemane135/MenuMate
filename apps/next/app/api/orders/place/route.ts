import { NextRequest, NextResponse } from "next/server";
import { db, orders, menuItems, restaurants, eq } from "@menumate/db";
import { z } from "zod";

const placeOrderSchema = z.object({
  restaurantSlug: z.string().min(1),
  items: z.array(
    z.object({
      itemId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().min(10).max(15),
  tableNumber: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = placeOrderSchema.parse(body);

    // Get restaurant by slug
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, validatedData.restaurantSlug))
      .limit(1);

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or inactive" },
        { status: 404 }
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

      if (menuItem.restaurantId !== restaurant.id) {
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

    // Create order
    const [newOrder] = await db
      .insert(orders)
      .values({
        restaurantId: restaurant.id,
        customerName: validatedData.customerName,
        customerPhone: validatedData.customerPhone,
        tableNumber: validatedData.tableNumber || null,
        items: orderItemsData,
        totalAmount: totalAmount.toString(),
        status: "pending",
        notes: validatedData.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        order: {
          id: newOrder.id,
          orderNumber: newOrder.id.slice(0, 8).toUpperCase(),
          totalAmount: newOrder.totalAmount,
          status: newOrder.status,
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

    console.error("Order placement error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}

