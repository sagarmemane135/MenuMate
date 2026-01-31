import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, orders, restaurants, eq } from "@menumate/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role === "super_admin") {
      return NextResponse.json(
        { error: "Super admins cannot mark payments" },
        { status: 403 }
      );
    }

    // Get user's restaurant
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

    if (session.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: "Session does not belong to your restaurant" },
        { status: 403 }
      );
    }

    if (session.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Payment already marked as paid" },
        { status: 400 }
      );
    }

    // Update session to mark as paid
    const [updatedSession] = await db
      .update(tableSessions)
      .set({
        status: "paid",
        paymentStatus: "paid",
        closedAt: new Date(),
      })
      .where(eq(tableSessions.id, session.id))
      .returning();

    // Mark all orders in session as paid
    await db
      .update(orders)
      .set({
        isPaid: true,
        paymentStatus: "paid",
        status: "paid",
      })
      .where(eq(orders.sessionId, session.id));

    return NextResponse.json({
      success: true,
      message: "Payment marked as received",
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        paymentStatus: updatedSession.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Mark payment as paid error:", error);
    return NextResponse.json(
      { error: "Failed to mark payment as paid" },
      { status: 500 }
    );
  }
}

