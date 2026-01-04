/**
 * Polling endpoint for sessions (fallback when Pusher is not available)
 * Returns empty array - polling is a basic fallback, Pusher is the primary method
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json(
        { error: "restaurantId is required" },
        { status: 400 }
      );
    }

    // Return empty data - this is just a fallback
    // The real implementation would query the database
    return NextResponse.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
      message: "Polling fallback - no new data",
    });
  } catch (error) {
    console.error("[POLLING] Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
