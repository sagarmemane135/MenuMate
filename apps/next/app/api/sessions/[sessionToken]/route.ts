import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, eq } from "@menumate/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;

    // Get session with all orders
    const [session] = await db
      .select()
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
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


