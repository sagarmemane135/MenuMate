/**
 * Returns pending "Pay at counter" sessions for the logged-in owner's restaurant.
 * Used by the admin banner to show notifications until marked paid or dismissed.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, tableSessions, restaurants, eq, and } from "@menumate/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "super_admin") {
      return NextResponse.json({ data: [] });
    }

    const [restaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ data: [] });
    }

    const pending = await db
      .select({
        id: tableSessions.id,
        sessionToken: tableSessions.sessionToken,
        tableNumber: tableSessions.tableNumber,
        totalAmount: tableSessions.totalAmount,
        startedAt: tableSessions.startedAt,
        paymentMethod: tableSessions.paymentMethod,
      })
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.restaurantId, restaurant.id),
          eq(tableSessions.paymentMethod, "counter"),
          eq(tableSessions.paymentStatus, "pending")
        )
      );

    const data = pending.map((p) => ({
      id: p.id,
      sessionToken: p.sessionToken,
      tableNumber: p.tableNumber,
      totalAmount: p.totalAmount,
      startedAt: p.startedAt instanceof Date ? p.startedAt.toISOString() : p.startedAt,
      paymentMethod: p.paymentMethod ?? "counter",
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[pending-counter-payments]", error);
    return NextResponse.json(
      { error: "Failed to fetch pending payments" },
      { status: 500 }
    );
  }
}
