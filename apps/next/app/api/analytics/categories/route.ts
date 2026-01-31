/**
 * Category Performance Analytics API
 * Returns category-wise sales and performance metrics
 * Pro feature
 */

import { NextRequest, NextResponse } from "next/server";
import { db, orders, categories, menuItems, eq, and, gte, lte } from "@menumate/db";
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

    // Get orders, categories, and menu items
    const [periodOrders, allCategories, allMenuItems] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurantId),
            gte(orders.createdAt, startDate),
            lte(orders.createdAt, endDate)
          )
        ),
      db.select().from(categories).where(eq(categories.restaurantId, restaurantId)),
      db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId)),
    ]);

    // Create item to category mapping
    const itemToCategory = new Map<string, { categoryId: string; categoryName: string }>();
    allMenuItems.forEach((item) => {
      const category = allCategories.find((c) => c.id === item.categoryId);
      if (category) {
        itemToCategory.set(item.id, {
          categoryId: category.id,
          categoryName: category.name,
        });
      }
    });

    // Calculate category metrics
    const categoryMetrics = new Map<string, {
      categoryId: string;
      categoryName: string;
      itemsSold: number;
      revenue: number;
      ordersCount: number;
      uniqueItems: Set<string>;
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
        const categoryInfo = itemToCategory.get(item.itemId);
        if (!categoryInfo) return;

        const existing = categoryMetrics.get(categoryInfo.categoryId) || {
          categoryId: categoryInfo.categoryId,
          categoryName: categoryInfo.categoryName,
          itemsSold: 0,
          revenue: 0,
          ordersCount: 0,
          uniqueItems: new Set<string>(),
        };

        existing.itemsSold += item.quantity;
        existing.revenue += item.quantity * item.price;
        existing.ordersCount += 1;
        existing.uniqueItems.add(item.itemId);

        categoryMetrics.set(categoryInfo.categoryId, existing);
      });
    });

    // Convert to array and calculate percentages
    const categoriesArray = Array.from(categoryMetrics.values()).map((cat) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      itemsSold: cat.itemsSold,
      revenue: cat.revenue,
      ordersCount: cat.ordersCount,
      uniqueItemsSold: cat.uniqueItems.size,
    }));

    const totalRevenue = categoriesArray.reduce((sum, cat) => sum + cat.revenue, 0);
    
    const categoriesWithPercentages = categoriesArray.map((cat) => ({
      ...cat,
      revenue: cat.revenue.toFixed(2),
      revenuePercentage: ((cat.revenue / totalRevenue) * 100).toFixed(2),
      averageOrderValue: (cat.revenue / cat.ordersCount).toFixed(2),
    }));

    // Sort by revenue
    const topCategories = [...categoriesWithPercentages].sort(
      (a, b) => parseFloat(b.revenue) - parseFloat(a.revenue)
    );

    const leastPerforming = [...categoriesWithPercentages].sort(
      (a, b) => parseFloat(a.revenue) - parseFloat(b.revenue)
    );

    return NextResponse.json({
      success: true,
      data: {
        period: `${period} days`,
        totalCategories: allCategories.length,
        activeCategories: categoriesArray.length,
        totalRevenue: totalRevenue.toFixed(2),
        topPerforming: topCategories,
        leastPerforming,
        all: categoriesWithPercentages,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS] Category analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category analytics" },
      { status: 500 }
    );
  }
}

