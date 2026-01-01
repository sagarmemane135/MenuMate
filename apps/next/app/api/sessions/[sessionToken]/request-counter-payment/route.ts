import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, restaurants, eq } from "@menumate/db";
import { emitCounterPaymentRequested } from "@/lib/websocket-events";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;

    // Get session with restaurant info
    const [session] = await db
      .select({
        id: tableSessions.id,
        restaurantId: tableSessions.restaurantId,
        tableNumber: tableSessions.tableNumber,
        status: tableSessions.status,
        totalAmount: tableSessions.totalAmount,
      })
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session is not active" },
        { status: 400 }
      );
    }

    // Update session to request counter payment
    const [updatedSession] = await db
      .update(tableSessions)
      .set({
        paymentMethod: "counter",
        paymentStatus: "pending",
      })
      .where(eq(tableSessions.id, session.id))
      .returning();

    // Emit WebSocket event to notify admin
    await emitCounterPaymentRequested(session.restaurantId, {
      sessionId: session.id,
      sessionToken: sessionToken,
      tableNumber: session.tableNumber,
      totalAmount: session.totalAmount,
      requestedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Counter payment requested. Admin has been notified.",
      session: {
        id: updatedSession.id,
        paymentStatus: updatedSession.paymentStatus,
        paymentMethod: updatedSession.paymentMethod,
      },
    });
  } catch (error) {
    console.error("Counter payment request error:", error);
    return NextResponse.json(
      { error: "Failed to request counter payment" },
      { status: 500 }
    );
  }
}

