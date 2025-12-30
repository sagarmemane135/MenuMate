import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, orders, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "cooking", "ready", "paid", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role === "super_admin") {
      return NextResponse.json(
        { error: "Super admins cannot update orders" },
        { status: 403 }
      );
    }

    // Get user's restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user's restaurant
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1);

    if (!order || order.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: validatedData.status })
      .where(eq(orders.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

