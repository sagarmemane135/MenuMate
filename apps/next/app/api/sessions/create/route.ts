import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, eq, and } from "@menumate/db";
import { z } from "zod";
import crypto from "crypto";

const createSessionSchema = z.object({
  restaurantSlug: z.string(),
  tableNumber: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantSlug, tableNumber } = createSessionSchema.parse(body);

    // Get restaurant by slug
    const { restaurants } = await import("@menumate/db");
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, restaurantSlug))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active session for this table
    const [existingSession] = await db
      .select()
      .from(tableSessions)
      .where(
        and(
          eq(tableSessions.restaurantId, restaurant.id),
          eq(tableSessions.tableNumber, tableNumber),
          eq(tableSessions.status, "active")
        )
      )
      .limit(1);

    if (existingSession) {
      // Return existing session
      return NextResponse.json({
        success: true,
        session: {
          id: existingSession.id,
          sessionToken: existingSession.sessionToken,
          tableNumber: existingSession.tableNumber,
          status: existingSession.status,
        },
      });
    }

    // Create new session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    
    const [newSession] = await db
      .insert(tableSessions)
      .values({
        restaurantId: restaurant.id,
        tableNumber,
        sessionToken,
        status: "active",
      })
      .returning();

    return NextResponse.json({
      success: true,
      session: {
        id: newSession.id,
        sessionToken: newSession.sessionToken,
        tableNumber: newSession.tableNumber,
        status: newSession.status,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}


