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
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: validatedData.amount * 100, // Convert to paise
      currency: validatedData.currency,
      receipt: validatedData.receipt,
      notes: validatedData.notes,
    });

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

    console.error("Razorpay order creation error:", error);
    return internalErrorResponse("Failed to create payment order");
  }
}

