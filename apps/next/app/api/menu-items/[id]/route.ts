import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, menuItems, categories, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const updateMenuItemSchema = z.object({
  name: z.string().min(1, "Item name is required").optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().optional(),
  categoryId: z.string().uuid("Invalid category ID").optional(),
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
        { error: "Super admins cannot update menu items" },
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

    // Verify menu item belongs to user's restaurant
    const [menuItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, params.id))
      .limit(1);

    if (!menuItem || menuItem.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateMenuItemSchema.parse(body);

    // If categoryId is being updated, verify it belongs to restaurant
    if (validatedData.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, validatedData.categoryId))
        .limit(1);

      if (!category || category.restaurantId !== restaurant.id) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl || null;
    if (validatedData.isAvailable !== undefined) updateData.isAvailable = validatedData.isAvailable;
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;

    const [updatedItem] = await db
      .update(menuItems)
      .set(updateData)
      .where(eq(menuItems.id, params.id))
      .returning();

    return NextResponse.json({
      message: "Menu item updated successfully",
      menuItem: updatedItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update menu item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: "Super admins cannot delete menu items" },
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

    // Verify menu item belongs to user's restaurant
    const [menuItem] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, params.id))
      .limit(1);

    if (!menuItem || menuItem.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    await db
      .delete(menuItems)
      .where(eq(menuItems.id, params.id));

    return NextResponse.json({
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

