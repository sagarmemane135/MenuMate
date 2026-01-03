import { NextRequest } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api-response";

const createOrderSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("INR"),
  receipt: z.string(),
  notes: z.object({
    restaurantSlug: z.string(),
    customerName: z.string(),
    customerPhone: z.string(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[PAYMENT] Razorpay credentials not configured");
      return errorResponse(
        "Payment gateway not configured. Please contact support.",
        500
      );
    }

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    console.log("[PAYMENT] Creating Razorpay order for amount:", validatedData.amount);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: validatedData.amount * 100, // Convert to paise
      currency: validatedData.currency,
      receipt: validatedData.receipt,
      notes: validatedData.notes,
    });

    console.log("[PAYMENT] Razorpay order created:", razorpayOrder.id);

    return successResponse({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse(error.errors);
    }

    console.error("[PAYMENT] Razorpay order creation error:", error);
    console.error("[PAYMENT] Error details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("[PAYMENT] Error message:", error.message);
      console.error("[PAYMENT] Error stack:", error.stack);
    }
    // Check if it's a Razorpay error with statusCode
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const razorpayError = error as { statusCode: number; error?: { code?: string; description?: string } };
      console.error("[PAYMENT] Razorpay API Error - Status:", razorpayError.statusCode);
      console.error("[PAYMENT] Razorpay API Error - Details:", JSON.stringify(razorpayError.error, null, 2));
      
      return errorResponse(
        `Payment gateway error: ${razorpayError.error?.description || 'Authentication failed'}`,
        400
      );
    }
    return internalErrorResponse("Failed to create payment order");
  }
}

