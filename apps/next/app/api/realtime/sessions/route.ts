/**
 * Polling endpoint for sessions (local setup - no Pusher).
 * Returns sessions for the restaurant with order counts.
 */

import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, eq, desc } from "@menumate/db";

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

    const allSessions = await db
      .select()
      .from(tableSessions)
      .where(eq(tableSessions.restaurantId, restaurantId))
      .orderBy(desc(tableSessions.startedAt))
      .limit(100);

    const data = await Promise.all(
      allSessions.map(async (session) => {
        const sessionOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.sessionId, session.id));
        return {
          id: session.id,
          tableNumber: session.tableNumber,
          sessionToken: session.sessionToken,
          status: session.status,
          totalAmount: session.totalAmount,
          paymentMethod: session.paymentMethod,
          paymentStatus: session.paymentStatus,
          startedAt:
            session.startedAt instanceof Date
              ? session.startedAt.toISOString()
              : session.startedAt,
          closedAt:
            session.closedAt instanceof Date
              ? session.closedAt.toISOString()
              : session.closedAt,
          ordersCount: sessionOrders.length,
          customerName: session.customerName,
          customerPhone: session.customerPhone,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[REALTIME SESSIONS] Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
