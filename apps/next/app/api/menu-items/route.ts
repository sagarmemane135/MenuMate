import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, menuItems, categories, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const createMenuItemSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
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
        { error: "Super admins cannot create menu items" },
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
    const validatedData = createMenuItemSchema.parse(body);

    // Verify category belongs to user's restaurant
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

    const [newMenuItem] = await db
      .insert(menuItems)
      .values({
        categoryId: validatedData.categoryId,
        restaurantId: restaurant.id,
        name: validatedData.name,
        description: validatedData.description || null,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl || null,
        isAvailable: validatedData.isAvailable,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Menu item created successfully",
        menuItem: newMenuItem,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create menu item error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



