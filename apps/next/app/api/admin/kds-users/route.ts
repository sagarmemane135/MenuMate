import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { db, users, restaurantStaff, eq, desc } from "@menumate/db";
import { getCurrentUser, getRestaurantForAdminUser, hashPassword } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";

const createSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const changePasswordSchema = z.object({
  id: z.string().uuid(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
});

function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) result += chars[bytes[i]! % chars.length];
  return result;
}

/** Name to local part: "John Doe" → "john.doe" (lowercase, spaces to dots, a-z and dots only). */
function nameToLocalPart(fullName: string): string {
  const local = fullName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
  return local || "kds";
}

/** Domain from restaurant slug: "test-restro" → "testrestro.com". */
function slugToDomain(restaurantSlug: string): string {
  const domain = restaurantSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase().replace(/-/g, "") || "restaurant";
  return `${domain}.com`;
}

/** Generate KDS email: john.doe@testrestro.com (from name + restaurant slug). Uniqueness: if taken, use local.2, local.3, etc. */
function generateKdsEmail(restaurantSlug: string, fullName: string, suffix = ""): string {
  const local = nameToLocalPart(fullName) + (suffix ? `.${suffix}` : "");
  const domain = slugToDomain(restaurantSlug);
  return `${local}@${domain}`;
}

/** GET: List KDS users (staff) for the owner's restaurant. Owner only. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    if (user.role !== "owner") {
      return errorResponse("Only restaurant owners can list KDS users", 403);
    }

    const restaurant = await getRestaurantForAdminUser(user);
    if (!restaurant) {
      return notFoundResponse("Restaurant not found");
    }

    const staffRows = await db
      .select({
        id: restaurantStaff.id,
        userId: restaurantStaff.userId,
        createdAt: restaurantStaff.createdAt,
        email: users.email,
        fullName: users.fullName,
      })
      .from(restaurantStaff)
      .innerJoin(users, eq(restaurantStaff.userId, users.id))
      .where(eq(restaurantStaff.restaurantId, restaurant.id))
      .orderBy(desc(restaurantStaff.createdAt));

    return successResponse({
      staff: staffRows.map((r) => ({
        id: r.id,
        userId: r.userId,
        email: r.email,
        fullName: r.fullName,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("KDS users list error:", error);
    return internalErrorResponse("Failed to list KDS users");
  }
}

/** POST: Create a KDS user (staff) for the owner's restaurant. Owner only. Name only; email and password are auto-generated from restaurant. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    if (user.role !== "owner") {
      return errorResponse("Only restaurant owners can add KDS users", 403);
    }

    const restaurant = await getRestaurantForAdminUser(user);
    if (!restaurant) {
      return notFoundResponse("Restaurant not found");
    }

    const body = await request.json();
    const validatedData = createSchema.parse(body);

    // Generate email: john.doe@testrestro.com (name + restaurant slug). If taken, use john.doe.2@, etc.
    let email: string;
    for (let attempts = 0; attempts < 20; attempts++) {
      const suffix = attempts === 0 ? "" : String(attempts + 1);
      email = generateKdsEmail(restaurant.slug, validatedData.fullName, suffix);
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (!existing) break;
    }

    const generatedPassword =
      validatedData.password && validatedData.password.trim().length >= 6
        ? validatedData.password.trim()
        : generateRandomPassword(12);
    const passwordHash = await hashPassword(generatedPassword);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName: validatedData.fullName.trim(),
        role: "staff",
        status: "approved",
      })
      .returning();

    const [newStaff] = await db
      .insert(restaurantStaff)
      .values({
        restaurantId: restaurant.id,
        userId: newUser.id,
      })
      .returning();

    return successResponse(
      {
        staff: {
          id: newStaff.id,
          userId: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          createdAt: newStaff.createdAt,
        },
        generatedEmail: newUser.email,
        generatedPassword,
      },
      "KDS user created. Share the login credentials with your staff."
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    console.error("KDS user create error:", error);
    return internalErrorResponse("Failed to create KDS user");
  }
}

/** PATCH: Change a KDS user's password. Owner only. Body: { id: restaurant_staff.id, newPassword?: string }. If newPassword omitted, generate random. Returns new password so owner can copy/share. */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    if (user.role !== "owner") {
      return errorResponse("Only restaurant owners can change KDS passwords", 403);
    }

    const restaurant = await getRestaurantForAdminUser(user);
    if (!restaurant) {
      return notFoundResponse("Restaurant not found");
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    const [row] = await db
      .select()
      .from(restaurantStaff)
      .where(eq(restaurantStaff.id, validatedData.id))
      .limit(1);

    if (!row || row.restaurantId !== restaurant.id) {
      return notFoundResponse("KDS user not found");
    }

    const newPassword =
      validatedData.newPassword && validatedData.newPassword.length >= 6
        ? validatedData.newPassword
        : generateRandomPassword(12);
    const passwordHash = await hashPassword(newPassword);

    await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId));

    return successResponse(
      { generatedPassword: newPassword },
      "Password updated. Share the new password with your staff."
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    console.error("KDS change password error:", error);
    return internalErrorResponse("Failed to change password");
  }
}

/** DELETE: Remove a KDS user. Owner only. Query: id = restaurant_staff.id */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }
    if (user.role !== "owner") {
      return errorResponse("Only restaurant owners can remove KDS users", 403);
    }

    const restaurant = await getRestaurantForAdminUser(user);
    if (!restaurant) {
      return notFoundResponse("Restaurant not found");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return errorResponse("Missing id query parameter", 400);
    }

    const [row] = await db
      .select()
      .from(restaurantStaff)
      .where(eq(restaurantStaff.id, id))
      .limit(1);

    if (!row || row.restaurantId !== restaurant.id) {
      return notFoundResponse("KDS user not found");
    }

    await db.delete(restaurantStaff).where(eq(restaurantStaff.id, id));

    return successResponse({ removed: true }, "KDS user removed");
  } catch (error) {
    console.error("KDS user delete error:", error);
    return internalErrorResponse("Failed to remove KDS user");
  }
}
