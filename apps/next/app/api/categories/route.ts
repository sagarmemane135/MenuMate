import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, categories, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  sortOrder: z.number().int().default(0),
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
        { error: "Super admins cannot create categories" },
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
    const validatedData = createCategorySchema.parse(body);

    // Get max sort order to add new category at the end
    const existingCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurant.id));

    const maxSortOrder = existingCategories.length > 0
      ? Math.max(...existingCategories.map((c) => c.sortOrder))
      : -1;

    const [newCategory] = await db
      .insert(categories)
      .values({
        restaurantId: restaurant.id,
        name: validatedData.name,
        sortOrder: maxSortOrder + 1,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Category created successfully",
        category: newCategory,
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

    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

