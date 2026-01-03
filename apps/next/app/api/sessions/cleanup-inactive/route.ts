import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, eq, and, sql } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * API endpoint to cleanup inactive sessions for a restaurant
 * Called when admin opens the sessions page
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role === "super_admin") {
      return NextResponse.json(
        { error: "Super admins cannot manage sessions" },
        { status: 403 }
      );
    }

    // Get user's restaurant
    const { restaurants } = await import("@menumate/db");
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Find sessions that are:
    // 1. Active
    // 2. Belong to this restaurant
    // 3. Started more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    console.log("[CLEANUP] Checking for inactive sessions older than:", oneHourAgo);

    // Get all active sessions for this restaurant that started more than 1 hour ago
    const inactiveSessions = await db
      .select({
        id: tableSessions.id,
        sessionToken: tableSessions.sessionToken,
        tableNumber: tableSessions.tableNumber,
        startedAt: tableSessions.startedAt,
      })
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.restaurantId, restaurant.id),
          eq(tableSessions.status, "active"),
          sql`${tableSessions.startedAt} < ${oneHourAgo}`
        )
      );

    console.log(`[CLEANUP] Found ${inactiveSessions.length} potentially inactive sessions`);

    if (inactiveSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No inactive sessions to close",
        closedCount: 0,
      });
    }

    // For each session, check if it has recent orders
    const sessionsToClose: string[] = [];

    for (const session of inactiveSessions) {
      // Check if session has any orders
      const sessionOrders = await db
        .select({
          id: orders.id,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(eq(orders.sessionId, session.id))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(1);

      // If no orders, or last order was more than 1 hour ago, mark for closure
      if (sessionOrders.length === 0) {
        console.log(`[CLEANUP] Session ${session.sessionToken} (Table ${session.tableNumber}) has no orders, marking for closure`);
        sessionsToClose.push(session.id);
      } else {
        const lastOrderDate = new Date(sessionOrders[0].createdAt);
        if (lastOrderDate < oneHourAgo) {
          console.log(`[CLEANUP] Session ${session.sessionToken} (Table ${session.tableNumber}) last order was at ${lastOrderDate}, marking for closure`);
          sessionsToClose.push(session.id);
        }
      }
    }

    if (sessionsToClose.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All active sessions have recent orders",
        closedCount: 0,
      });
    }

    // Close the inactive sessions
    await db
      .update(tableSessions)
      .set({
        status: "closed",
        closedAt: new Date(),
      })
      .where(sql`${tableSessions.id} IN (${sql.join(sessionsToClose.map(id => sql`${id}`), sql`, `)})`);

    console.log(`[CLEANUP] Closed ${sessionsToClose.length} inactive sessions`);

    return NextResponse.json({
      success: true,
      message: `Closed ${sessionsToClose.length} inactive sessions`,
      closedCount: sessionsToClose.length,
    });
  } catch (error) {
    console.error("[CLEANUP] Error cleaning up sessions:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup sessions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

