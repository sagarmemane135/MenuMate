/**
 * Lightweight dashboard stats for real-time updates (today's revenue, pending counter count, top selling items).
 * Used when payment is marked paid so revenue and item stats update without full page refresh.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, orders, tableSessions, restaurants, eq, and, gte } from "@menumate/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "super_admin") {
      return NextResponse.json({ todayRevenue: 0, pendingCounterCount: 0, topSellingItems: [] });
    }

    const [restaurant] = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ todayRevenue: 0, pendingCounterCount: 0, topSellingItems: [] });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [todayOrders, pendingSessions, recentOrders] = await Promise.all([
      db
        .select({ totalAmount: orders.totalAmount, isPaid: orders.isPaid })
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurant.id),
            gte(orders.createdAt, startOfDay)
          )
        ),
      db
        .select({ id: tableSessions.id })
        .from(tableSessions)
        .where(
          and(
            eq(tableSessions.restaurantId, restaurant.id),
            eq(tableSessions.paymentMethod, "counter"),
            eq(tableSessions.paymentStatus, "pending")
          )
        ),
      db
        .select({ items: orders.items, isPaid: orders.isPaid })
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurant.id),
            gte(orders.createdAt, thirtyDaysAgo)
          )
        ),
    ]);

    const todayRevenue = todayOrders
      .filter((o) => o.isPaid === true)
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    const itemMetrics = new Map<string, { name: string; quantity: number; revenue: number }>();
    recentOrders
      .filter((o) => o.isPaid === true)
      .forEach((order) => {
        const items = order.items as Array<{
          itemId: string;
          name: string;
          quantity: number;
          price: number;
        }> | null;
        if (!items) return;
        items.forEach((item) => {
          const existing = itemMetrics.get(item.itemId) ?? {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
          existing.quantity += item.quantity;
          existing.revenue += item.quantity * item.price;
          itemMetrics.set(item.itemId, existing);
        });
      });

    const topSellingItems = Array.from(itemMetrics.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      todayRevenue,
      pendingCounterCount: pendingSessions.length,
      topSellingItems,
    });
  } catch (error) {
    console.error("[dashboard-stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
