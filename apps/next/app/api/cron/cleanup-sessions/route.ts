import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, eq, and, sql } from "@menumate/db";

/**
 * Cron job to automatically close inactive sessions
 * Sessions that have been active for more than 1 hour without any orders will be closed
 * 
 * This should be called periodically (e.g., every 15 minutes) by a cron service like Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron job (optional: add authorization header check)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find sessions that are:
    // 1. Active
    // 2. Started more than 1 hour ago
    // 3. Have no orders or last order was more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    console.log("[CRON] Checking for inactive sessions older than:", oneHourAgo);

    // Get all active sessions that started more than 1 hour ago
    const inactiveSessions = await db
      .select({
        id: tableSessions.id,
        sessionToken: tableSessions.sessionToken,
        tableNumber: tableSessions.tableNumber,
        startedAt: tableSessions.startedAt,
        restaurantId: tableSessions.restaurantId,
      })
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.status, "active"),
          sql`${tableSessions.startedAt} < ${oneHourAgo}`
        )
      );

    console.log(`[CRON] Found ${inactiveSessions.length} potentially inactive sessions`);

    if (inactiveSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No inactive sessions to close",
        closedCount: 0,
      });
    }

    // For each session, check if it has recent orders
    const { orders } = await import("@menumate/db");
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
        console.log(`[CRON] Session ${session.sessionToken} (Table ${session.tableNumber}) has no orders, marking for closure`);
        sessionsToClose.push(session.id);
      } else {
        const lastOrderDate = new Date(sessionOrders[0].createdAt);
        if (lastOrderDate < oneHourAgo) {
          console.log(`[CRON] Session ${session.sessionToken} (Table ${session.tableNumber}) last order was at ${lastOrderDate}, marking for closure`);
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

    console.log(`[CRON] Closed ${sessionsToClose.length} inactive sessions`);

    return NextResponse.json({
      success: true,
      message: `Closed ${sessionsToClose.length} inactive sessions`,
      closedCount: sessionsToClose.length,
    });
  } catch (error) {
    console.error("[CRON] Error cleaning up sessions:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup sessions",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

