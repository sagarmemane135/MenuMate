import { NextRequest } from "next/server";
import { z } from "zod";
import { db, users, eq } from "@menumate/db";
import { verifyPassword, signToken } from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(`login:${clientId}`, 10, 60 * 1000); // 10 attempts per minute
    
    if (!rateLimit.allowed) {
      return errorResponse(
        "Too many login attempts. Please try again later.",
        429,
        `Rate limit exceeded. Try again after ${new Date(rateLimit.resetTime).toLocaleTimeString()}`
      );
    }

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check status - if pending, return 403
    if (user.status === "pending") {
      return errorResponse(
        "Account Under Review",
        403,
        "Your account is pending approval. Please wait for admin approval."
      );
    }

    if (user.status === "rejected") {
      return errorResponse(
        "Account Rejected",
        403,
        "Your account has been rejected. Please contact support."
      );
    }

    // Sign JWT and set cookie
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Create response
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          status: user.status,
        },
      },
      "Login successful"
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

    console.error("Login error:", error);
    return internalErrorResponse("Failed to process login");
  }
}


