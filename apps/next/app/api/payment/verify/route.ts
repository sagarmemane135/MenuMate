import { NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { db, orders, eq } from "@menumate/db";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  internalErrorResponse,
} from "@/lib/api-response";

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  order_id: z.string(), // Our internal order ID
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      validatedData.razorpay_order_id,
      validatedData.razorpay_payment_id,
      validatedData.razorpay_signature
    );

    if (!isValid) {
      return errorResponse("Invalid payment signature", 400);
    }

    // Update order status to paid
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "paid",
        paymentId: validatedData.razorpay_payment_id,
        paymentStatus: "paid",
      })
      .where(eq(orders.id, validatedData.order_id))
      .returning();

    if (!updatedOrder) {
      return notFoundResponse("Order not found");
    }

    return successResponse(
      {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
      },
      "Payment verified successfully"
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }

    console.error("Payment verification error:", error);
    return internalErrorResponse("Failed to verify payment");
  }
}

