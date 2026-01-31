import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, restaurants, eq } from "@menumate/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;

    // Get session with restaurant (for name on bill)
    const [row] = await db
      .select({
        session: tableSessions,
        restaurantName: restaurants.name,
      })
      .from(tableSessions)
      .innerJoin(restaurants, eq(tableSessions.restaurantId, restaurants.id))
      .where(eq(tableSessions.sessionToken, sessionToken))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired." },
        { status: 404 }
      );
    }

    const session = row.session;

    // Check if session is active but older than 1 hour (inactive timeout)
    if (session.status === "active") {
      const sessionAge = Date.now() - new Date(session.startedAt).getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (sessionAge > oneHourInMs) {
        // Auto-close the inactive session
        await db
          .update(tableSessions)
          .set({
            status: "closed",
            closedAt: new Date(),
          })
          .where(eq(tableSessions.id, session.id));
        
        console.log(`[SESSION VERIFY] Auto-closed inactive session ${sessionToken} (age: ${Math.floor(sessionAge / 1000 / 60)} minutes)`);
        
        // Update session object to reflect the change
        session.status = "closed";
      }
    }

    // Get all orders for this session
    const sessionOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, session.id))
      .orderBy(orders.createdAt);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        tableNumber: session.tableNumber,
        status: session.status,
        totalAmount: session.totalAmount,
        paymentMethod: session.paymentMethod,
        paymentStatus: session.paymentStatus,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        startedAt: session.startedAt,
      },
      restaurant: {
        name: row.restaurantName,
      },
      orders: sessionOrders.map((order) => ({
        id: order.id,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        isPaid: order.isPaid,
        createdAt: order.createdAt,
        notes: order.notes,
      })),
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}


