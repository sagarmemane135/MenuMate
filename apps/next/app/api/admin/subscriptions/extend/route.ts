/**
 * Super admin only: extend subscription expiry by N months.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, users, eq } from "@menumate/db";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const months = typeof body.months === "number" ? body.months : 12;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (target.role === "super_admin") {
      return NextResponse.json({ error: "Cannot change super admin subscription" }, { status: 400 });
    }

    const from = target.subscriptionExpiresAt && new Date(target.subscriptionExpiresAt) > new Date()
      ? new Date(target.subscriptionExpiresAt)
      : new Date();
    const expiresAt = new Date(from);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await db
      .update(users)
      .set({
        subscriptionTier: target.subscriptionTier === "free" ? "pro" : target.subscriptionTier,
        subscriptionExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      data: {
        userId: target.id,
        email: target.email,
        subscriptionTier: target.subscriptionTier === "free" ? "pro" : target.subscriptionTier,
        subscriptionExpiresAt: expiresAt.toISOString(),
      },
    });
  } catch (e) {
    console.error("[admin subscriptions extend]", e);
    return NextResponse.json({ error: "Failed to extend subscription" }, { status: 500 });
  }
}
