/**
 * Super admin only: grant Pro (or enterprise) to a user by email.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, users, restaurants, eq } from "@menumate/db";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const months = typeof body.months === "number" ? body.months : 12;
    const tier = body.tier === "enterprise" ? "enterprise" : "pro";

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "super_admin") {
      return NextResponse.json({ error: "Cannot change super admin subscription" }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await db
      .update(users)
      .set({
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt,
      })
      .where(eq(users.id, target.id));

    if (target.role === "owner") {
      await db
        .update(restaurants)
        .set({ isActive: true })
        .where(eq(restaurants.ownerId, target.id));
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: target.id,
        email: target.email,
        subscriptionTier: tier,
        subscriptionExpiresAt: expiresAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[admin subscriptions grant]", e);
    return NextResponse.json({ error: "Failed to grant subscription" }, { status: 500 });
  }
}
