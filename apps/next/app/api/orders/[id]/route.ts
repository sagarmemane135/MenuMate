import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { z } from "zod";
import { db, orders, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const updateOrderSchema = z.object({
  status: z.enum(["pending", "cooking", "ready", "paid", "cancelled"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    if (user.role === "super_admin") {
      return errorResponse("Super admins cannot update orders", 403);
    }

    // Get user's restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    if (!restaurant) {
      return notFoundResponse("Restaurant not found");
    }

    // Verify order belongs to user's restaurant
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order || order.restaurantId !== restaurant.id) {
      return notFoundResponse("Order not found");
    }

    const body = await request.json();
    const validatedData = updateOrderSchema.parse(body);

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: validatedData.status })
      .where(eq(orders.id, id))
      .returning();

    return successResponse(
      { order: updatedOrder },
      "Order status updated successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }

    console.error("Update order error:", error);
    return internalErrorResponse("Failed to update order");
  }
}

