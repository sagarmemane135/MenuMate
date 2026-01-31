/**
 * Super admin only: revoke Pro — set user to free and clear expiry.
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

    await db
      .update(users)
      .set({
        subscriptionTier: "free",
        subscriptionExpiresAt: null,
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      data: { userId: target.id, email: target.email, subscriptionTier: "free" },
    });
  } catch (e) {
    console.error("[admin subscriptions revoke]", e);
    return NextResponse.json({ error: "Failed to revoke subscription" }, { status: 500 });
  }
}
