import { NextRequest } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay";
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
    console.log("[PAYMENT] Create order request received");
    
    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("[PAYMENT] Razorpay credentials not configured");
      return errorResponse(
        "Payment gateway not configured. Please contact support.",
        500
      );
    }

    const body = await request.json();
    console.log("[PAYMENT] Request body:", JSON.stringify(body, null, 2));
    
    const validatedData = createOrderSchema.parse(body);
    console.log("[PAYMENT] Validated data:", JSON.stringify(validatedData, null, 2));

    // Get a fresh Razorpay instance with current credentials
    const razorpay = getRazorpayInstance();
    console.log("[PAYMENT] Razorpay instance created");
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: validatedData.amount * 100, // Convert to paise
      currency: validatedData.currency,
      receipt: validatedData.receipt,
      notes: validatedData.notes,
    });
    
    console.log("[PAYMENT] Razorpay order created successfully:", razorpayOrder.id);

    return successResponse({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[PAYMENT] Validation error:", JSON.stringify(error.errors, null, 2));
      return validationErrorResponse(error.errors);
    }

    console.error("[PAYMENT] Razorpay order creation error:", error);
    console.error("[PAYMENT] Error type:", typeof error);
    console.error("[PAYMENT] Error details:", JSON.stringify(error, null, 2));
    
    // Check if it's a Razorpay error with statusCode
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      const razorpayError = error as { statusCode: number; error?: { code?: string; description?: string } };
      console.error("[PAYMENT] Razorpay API error - Status:", razorpayError.statusCode);
      console.error("[PAYMENT] Razorpay API error - Description:", razorpayError.error?.description);
      return errorResponse(
        `Payment gateway error: ${razorpayError.error?.description || 'Authentication failed'}`,
        400
      );
    }
    return internalErrorResponse("Failed to create payment order");
  }
}

