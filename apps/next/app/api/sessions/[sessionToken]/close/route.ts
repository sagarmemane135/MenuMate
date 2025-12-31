import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, eq, sql } from "@menumate/db";
import { z } from "zod";

const closeSessionSchema = z.object({
  paymentMethod: z.enum(["online", "counter", "split"]),
  paymentId: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;
    const body = await request.json();
    const { paymentMethod, paymentId } = closeSessionSchema.parse(body);

    // Get session
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

    // Calculate total from all orders
    const sessionOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, session.id));

    const totalAmount = sessionOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    // Update session
    const [updatedSession] = await db
      .update(tableSessions)
      .set({
        status: paymentMethod === "online" ? "paid" : "closed",
        totalAmount: totalAmount.toString(),
        paymentMethod,
        paymentStatus: paymentMethod === "online" ? "paid" : "pending",
        paymentId,
        closedAt: new Date(),
      })
      .where(eq(tableSessions.id, session.id))
      .returning();

    // Mark all orders as paid if online payment
    if (paymentMethod === "online") {
      await db
        .update(orders)
        .set({
          isPaid: true,
          paymentStatus: "paid",
          status: "paid",
        })
        .where(eq(orders.sessionId, session.id));
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        totalAmount: updatedSession.totalAmount,
        paymentMethod: updatedSession.paymentMethod,
        paymentStatus: updatedSession.paymentStatus,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Session close error:", error);
    return NextResponse.json(
      { error: "Failed to close session" },
      { status: 500 }
    );
  }
}


