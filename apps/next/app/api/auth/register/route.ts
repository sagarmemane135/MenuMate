import { NextRequest } from "next/server";
import { z } from "zod";
import { db, users, restaurants, eq } from "@menumate/db";
import { hashPassword, signToken } from "@/lib/auth";
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  restaurantName: z.string().min(2, "Restaurant name must be at least 2 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`register:${clientId}`, 5, 60 * 1000); // 5 attempts per minute
    
    if (!rateLimit.allowed) {
      return errorResponse(
        "Too many registration attempts. Please try again later.",
        429,
        `Rate limit exceeded. Try again after ${new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        }).format(new Date(rateLimit.resetTime))}`
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return errorResponse("User with this email already exists", 400);
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
      return errorResponse("Restaurant name is already taken", 400);
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

    // Restaurant stays inactive until MenuMate admin approves the owner
    const [newRestaurant] = await db
      .insert(restaurants)
      .values({
        ownerId: newUser.id,
        name: validatedData.restaurantName,
        slug,
        isActive: false,
      })
      .returning();

    // Sign JWT and set cookie
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Create response
    const response = createdResponse(
      {
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
      "Registration successful. A MenuMate admin will review your request. You can log in after approval."
    );

    // Set cookie in response using NextResponse.cookies (proper Next.js 15 way)
    const cookieName = (process.env.COOKIE_NAME || "menumate_session").trim();
    
    // On Vercel, always use Secure flag (HTTPS is always used)
    const isVercel = !!process.env.VERCEL;
    const isSecure = process.env.NODE_ENV === "production" || isVercel;
    
    // Use NextResponse.cookies.set() - this is the proper way in Next.js 15
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }

    console.error("Registration error:", error);
    return internalErrorResponse("Failed to process registration");
  }
}


