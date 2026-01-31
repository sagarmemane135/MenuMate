/**
 * Super admin only: list users (excluding super_admin) with subscription tier and expiry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, users, restaurants, eq, not, desc, inArray } from "@menumate/db";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier"); // free | pro | enterprise
    const search = searchParams.get("search")?.trim() || "";

    let allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        status: users.status,
        subscriptionTier: users.subscriptionTier,
        subscriptionExpiresAt: users.subscriptionExpiresAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(not(eq(users.role, "super_admin")))
      .orderBy(desc(users.createdAt));

    if (tier && ["free", "pro", "enterprise"].includes(tier)) {
      allUsers = allUsers.filter((u) => u.subscriptionTier === tier);
    }
    if (search) {
      const q = search.toLowerCase();
      allUsers = allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.fullName && u.fullName.toLowerCase().includes(q))
      );
    }

    const ownerIds = allUsers.filter((u) => u.role === "owner").map((u) => u.id);
    const restaurantList =
      ownerIds.length > 0
        ? await db
            .select({ ownerId: restaurants.ownerId, name: restaurants.name })
            .from(restaurants)
            .where(inArray(restaurants.ownerId, ownerIds))
        : [];
    const restaurantByOwner = Object.fromEntries(
      restaurantList.map((r) => [r.ownerId, r.name])
    );

    const list = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      status: u.status,
      subscriptionTier: u.subscriptionTier,
      subscriptionExpiresAt: u.subscriptionExpiresAt
        ? new Date(u.subscriptionExpiresAt).toISOString()
        : null,
      createdAt: new Date(u.createdAt).toISOString(),
      restaurantName: u.role === "owner" ? restaurantByOwner[u.id] ?? null : null,
    }));

    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error("[admin subscriptions users GET]", e);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
