/**
 * Polling endpoint for orders (local setup - no Pusher).
 * Returns orders for the restaurant so admin/kitchen can poll for updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, orders, eq } from "@menumate/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .limit(100);

    const sorted = allOrders.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const data = sorted.map((o) => ({
      id: o.id,
      tableNumber: o.tableNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      sessionId: o.sessionId,
      isPaid: o.isPaid,
      items: o.items,
      customerName: o.customerName,
      notes: o.notes,
    }));

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[REALTIME ORDERS] Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
