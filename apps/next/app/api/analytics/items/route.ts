/**
 * Item Performance Analytics API
 * Returns best/worst selling items with detailed metrics
 * Pro feature
 */

import { NextRequest, NextResponse } from "next/server";
import { db, orders, menuItems, eq, and, gte, lte } from "@menumate/db";
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
    const period = searchParams.get("period") || "30"; // days

    if (!restaurantId) {
      return NextResponse.json({ error: "restaurantId required" }, { status: 400 });
    }

    // Date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get orders in period
    const periodOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );

    // Get all menu items
    const allMenuItems = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId));

    // Calculate item metrics
    const itemMetrics = new Map<string, {
      itemId: string;
      name: string;
      price: number;
      quantitySold: number;
      revenue: number;
      ordersCount: number;
    }>();

    periodOrders
      .filter((order) => order.isPaid === true)
      .forEach((order) => {
      const items = order.items as Array<{
        itemId: string;
        name: string;
        quantity: number;
        price: number;
      }>;

      items.forEach((item) => {
        const existing = itemMetrics.get(item.itemId) || {
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantitySold: 0,
          revenue: 0,
          ordersCount: 0,
        };

        existing.quantitySold += item.quantity;
        existing.revenue += item.quantity * item.price;
        existing.ordersCount += 1;

        itemMetrics.set(item.itemId, existing);
      });
    });

    // Convert to array and sort
    const itemsArray = Array.from(itemMetrics.values());
    const topSellingByQuantity = [...itemsArray]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);
    
    const topSellingByRevenue = [...itemsArray]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const leastSelling = [...itemsArray]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 10);

    // Items never ordered
    const orderedItemIds = new Set(itemsArray.map((i) => i.itemId));
    const neverOrdered = allMenuItems
      .filter((item) => !orderedItemIds.has(item.id))
      .map((item) => ({
        itemId: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantitySold: 0,
        revenue: 0,
        ordersCount: 0,
      }));

    return NextResponse.json({
      success: true,
      data: {
        period: `${period} days`,
        totalItems: allMenuItems.length,
        totalItemsSold: itemsArray.length,
        neverOrderedCount: neverOrdered.length,
        topSellingByQuantity: topSellingByQuantity.map((item) => ({
          ...item,
          revenue: item.revenue.toFixed(2),
          averagePerOrder: (item.quantitySold / item.ordersCount).toFixed(2),
        })),
        topSellingByRevenue: topSellingByRevenue.map((item) => ({
          ...item,
          revenue: item.revenue.toFixed(2),
          averagePerOrder: (item.quantitySold / item.ordersCount).toFixed(2),
        })),
        leastSelling: leastSelling.map((item) => ({
          ...item,
          revenue: item.revenue.toFixed(2),
        })),
        neverOrdered: neverOrdered.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("[ANALYTICS] Item analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch item analytics" },
      { status: 500 }
    );
  }
}

