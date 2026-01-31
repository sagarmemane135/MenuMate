/**
 * Verify Razorpay payment and close session (server-side).
 * Ensures payment actually succeeded before marking session/orders as paid.
 */

import { NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { db, tableSessions, orders, eq } from "@menumate/db";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionToken: string }> }
) {
  try {
    const { sessionToken } = await params;
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      bodySchema.parse(body);

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!isValid) {
      return errorResponse("Invalid payment signature", 400);
    }

    const [session] = await db
      .select()
      .from(tableSessions)
      .where(eq(tableSessions.sessionToken, sessionToken))
      .limit(1);

    if (!session) {
      return notFoundResponse("Session not found or expired.");
    }

    if (session.status !== "active") {
      return errorResponse(
        "Session is already closed or paid",
        400
      );
    }

    const sessionOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.sessionId, session.id));

    const totalAmount = sessionOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    await db
      .update(tableSessions)
      .set({
        status: "paid",
        totalAmount: totalAmount.toString(),
        paymentMethod: "online",
        paymentStatus: "paid",
        paymentId: razorpay_payment_id,
        closedAt: new Date(),
      })
      .where(eq(tableSessions.id, session.id));

    await db
      .update(orders)
      .set({
        isPaid: true,
        paymentStatus: "paid",
        status: "paid",
        paymentId: razorpay_payment_id,
      })
      .where(eq(orders.sessionId, session.id));

    return successResponse(
      {
        status: "paid",
        paymentId: razorpay_payment_id,
      },
      "Payment verified and session closed"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }
    console.error("[verify-online-payment]", error);
    return internalErrorResponse("Failed to verify payment");
  }
}
