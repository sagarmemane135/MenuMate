/**
 * Monthly Analytics API
 * Returns monthly trends, comparisons, and growth metrics
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

    if (user.subscriptionTier !== "pro" && user.subscriptionTier !== "enterprise") {
      return NextResponse.json(
        { error: "Pro subscription required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    // Current month range
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Previous month range
    const startOfPrevMonth = new Date(year, month - 2, 1);
    const endOfPrevMonth = new Date(year, month - 1, 0, 23, 59, 59, 999);

    // Get current month data
    const currentMonthOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfMonth),
          lte(orders.createdAt, endOfMonth)
        )
      );

    // Get previous month data
    const previousMonthOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfPrevMonth),
          lte(orders.createdAt, endOfPrevMonth)
        )
      );

    // Revenue only from paid orders
    const currentMonthPaid = currentMonthOrders.filter((o) => o.isPaid === true);
    const previousMonthPaid = previousMonthOrders.filter((o) => o.isPaid === true);
    const currentRevenue = currentMonthPaid.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount),
      0
    );
    const previousRevenue = previousMonthPaid.reduce(
      (sum, o) => sum + parseFloat(o.totalAmount),
      0
    );

    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const ordersGrowth =
      previousMonthOrders.length > 0
        ? ((currentMonthOrders.length - previousMonthOrders.length) /
            previousMonthOrders.length) *
          100
        : 0;

    // Daily breakdown for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBreakdown = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayStart = new Date(year, month - 1, day, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

      const dayOrders = currentMonthOrders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      return {
        day,
        date: dayStart.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0),
      };
    });

    // Peak day
    const peakDay = dailyBreakdown.reduce((max, day) =>
      day.revenue > max.revenue ? day : max
    );

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        currentMonth: {
          totalOrders: currentMonthOrders.length,
          totalRevenue: currentRevenue.toFixed(2),
          averageOrderValue: (currentRevenue / currentMonthPaid.length || 0).toFixed(2),
        },
        previousMonth: {
          totalOrders: previousMonthOrders.length,
          totalRevenue: previousRevenue.toFixed(2),
        },
        growth: {
          revenue: revenueGrowth.toFixed(2),
          orders: ordersGrowth.toFixed(2),
        },
        peakDay: {
          day: peakDay.day,
          date: peakDay.date,
          revenue: peakDay.revenue.toFixed(2),
          orders: peakDay.orders,
        },
        dailyBreakdown,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS] Monthly analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly analytics" },
      { status: 500 }
    );
  }
}

