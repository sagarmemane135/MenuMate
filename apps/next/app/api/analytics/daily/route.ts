/**
 * Daily Analytics API
 * Returns daily sales, orders, and revenue data
 * Pro feature
 */

import { NextRequest, NextResponse } from "next/server";
import { db, orders, tableSessions, eq, and, gte, lte } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has pro access
    if (user.subscriptionTier !== "pro" && user.subscriptionTier !== "enterprise") {
      return NextResponse.json(
        { 
          error: "Pro subscription required",
          message: "Upgrade to Pro to access advanced analytics"
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    // Get start and end of the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get daily orders
    const dailyOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfDay),
          lte(orders.createdAt, endOfDay)
        )
      );

    // Get daily sessions
    const dailySessions = await db
      .select()
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.restaurantId, restaurantId),
          gte(tableSessions.startedAt, startOfDay),
          lte(tableSessions.startedAt, endOfDay)
        )
      );

    // Revenue only from paid orders (payment successful or marked paid)
    const paidOrdersList = dailyOrders.filter((o) => o.isPaid === true);
    const totalOrders = dailyOrders.length;
    const totalRevenue = paidOrdersList.reduce(
      (sum, order) => sum + parseFloat(order.totalAmount),
      0
    );
    const paidOrders = paidOrdersList.length;
    const pendingOrders = dailyOrders.filter((o) => !o.isPaid).length;
    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    // Active sessions
    const activeSessions = dailySessions.filter((s) => s.status === "active").length;
    const completedSessions = dailySessions.filter(
      (s) => s.status === "closed" || s.status === "paid"
    ).length;

    // Hourly breakdown (revenue from paid orders only)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourOrders = dailyOrders.filter((order) => {
        const orderHour = new Date(order.createdAt).getHours();
        return orderHour === hour;
      });
      const hourPaidOrders = hourOrders.filter((o) => o.isPaid === true);
      return {
        hour,
        orders: hourOrders.length,
        revenue: hourPaidOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        date,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        paidOrders,
        pendingOrders,
        averageOrderValue: averageOrderValue.toFixed(2),
        activeSessions,
        completedSessions,
        totalSessions: dailySessions.length,
        hourlyBreakdown: hourlyData,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS] Daily analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily analytics" },
      { status: 500 }
    );
  }
}

