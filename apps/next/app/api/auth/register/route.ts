import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, users, restaurants, eq } from "@menumate/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate slug from restaurant name
    const slug = validatedData.restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const [existingRestaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .limit(1);

    if (existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant name is already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user and restaurant in a transaction
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        passwordHash,
        fullName: validatedData.fullName,
        role: "owner",
        status: "pending",
      })
      .returning();

    const [newRestaurant] = await db
      .insert(restaurants)
      .values({
        ownerId: newUser.id,
        name: validatedData.restaurantName,
        slug,
        isActive: true,
      })
      .returning();

    // Sign JWT and set cookie
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: "Registration successful. Your account is pending approval.",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          status: newUser.status,
        },
        restaurant: {
          id: newRestaurant.id,
          name: newRestaurant.name,
          slug: newRestaurant.slug,
        },
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

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


