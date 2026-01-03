import { NextRequest, NextResponse } from "next/server";
import { emitCounterPaymentRequested } from "@/lib/websocket-events";

/**
 * Test endpoint to verify Pusher is working
 * Call this to manually trigger a counter payment notification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId } = body;

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    console.log("[TEST-PUSHER] 🧪 Testing Pusher with restaurant ID:", restaurantId);

    // Emit a test counter payment request
    await emitCounterPaymentRequested(restaurantId, {
      sessionId: "test-session-" + Date.now(),
      sessionToken: "test-token-" + Date.now(),
      tableNumber: "TEST-99",
      totalAmount: "999.99",
      requestedAt: new Date().toISOString(),
    });

    console.log("[TEST-PUSHER] ✅ Test event emitted");

    return NextResponse.json({
      success: true,
      message: "Test notification sent! Check admin dashboard.",
      restaurantId,
    });
  } catch (error) {
    console.error("[TEST-PUSHER] ❌ Error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification", details: String(error) },
      { status: 500 }
    );
  }
}

