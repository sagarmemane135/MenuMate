import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db, users, eq } from "@menumate/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_dev_key_123"
);

const COOKIE_NAME = (process.env.COOKIE_NAME || "menumate_session").trim();

export interface JWTPayload {
  userId: string;
  email: string;
  role: "super_admin" | "owner" | "staff";
  [key: string]: string | number | boolean | undefined;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getTokenFromCookie(request?: NextRequest): Promise<string | null> {
  // In API routes, use request.cookies
  if (request) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    return token || null;
  }
  
  // In Server Components, use cookies() from next/headers
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  return token?.value || null;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(request?: NextRequest): Promise<JWTPayload | null> {
  const token = await getTokenFromCookie(request);
  
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    return null;
  }

  // Verify user still exists and is approved
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user || user.status !== "approved") {
    return null;
  }

  // Return enriched payload with all user fields
  return {
    ...payload,
    id: user.id,
    userId: user.id,
    email: user.email,
    role: user.role as "super_admin" | "owner" | "staff",
    fullName: user.fullName,
    status: user.status,
    subscriptionTier: user.subscriptionTier || "free",
  };
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}


