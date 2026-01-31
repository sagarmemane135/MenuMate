import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const updateRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
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
        { error: "Super admins cannot update restaurants this way" },
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

    const body = await request.json();
    const validatedData = updateRestaurantSchema.parse(body);

    // If slug is being updated, check for uniqueness
    if (validatedData.slug && validatedData.slug !== restaurant.slug) {
      const [existing] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.slug, validatedData.slug))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: "Slug already taken" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set(updateData)
      .where(eq(restaurants.id, restaurant.id))
      .returning();

    return NextResponse.json({
      message: "Restaurant updated successfully",
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update restaurant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




