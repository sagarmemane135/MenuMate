import { NextRequest, NextResponse } from "next/server";
import { db, tableSessions, eq, and } from "@menumate/db";
import { z } from "zod";
import crypto from "crypto";

const createSessionSchema = z.object({
  restaurantSlug: z.string(),
  tableNumber: z.string(),
});

export async function POST(request: NextRequest) {
  console.log("[SESSION CREATE API] Request received");
  try {
    const body = await request.json();
    console.log("[SESSION CREATE API] Request body:", JSON.stringify(body));
    
    const { restaurantSlug, tableNumber } = createSessionSchema.parse(body);
    console.log("[SESSION CREATE API] Parsed data - restaurantSlug:", restaurantSlug, "tableNumber:", tableNumber);

    // Get restaurant by slug
    const { restaurants } = await import("@menumate/db");
    console.log("[SESSION CREATE API] Querying restaurant with slug:", restaurantSlug);
    
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, restaurantSlug))
      .limit(1);

    console.log("[SESSION CREATE API] Restaurant found:", restaurant ? `ID: ${restaurant.id}, Name: ${restaurant.name}` : "NOT FOUND");

    if (!restaurant) {
      console.error("[SESSION CREATE API] Restaurant not found for slug:", restaurantSlug);
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active session for this table
    console.log("[SESSION CREATE API] Checking for existing session - restaurantId:", restaurant.id, "tableNumber:", tableNumber);
    
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
      console.log("[SESSION CREATE API] Existing session found:", existingSession.id, "token:", existingSession.sessionToken?.substring(0, 8) + "...");
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
    console.log("[SESSION CREATE API] No existing session found, creating new one");
    const sessionToken = crypto.randomBytes(32).toString("hex");
    console.log("[SESSION CREATE API] Generated session token:", sessionToken.substring(0, 8) + "...");
    
    const [newSession] = await db
      .insert(tableSessions)
      .values({
        restaurantId: restaurant.id,
        tableNumber,
        sessionToken,
        status: "active",
      })
      .returning();

    console.log("[SESSION CREATE API] New session created successfully:", {
      id: newSession.id,
      tableNumber: newSession.tableNumber,
      status: newSession.status,
      tokenPreview: newSession.sessionToken?.substring(0, 8) + "..."
    });

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
      console.error("[SESSION CREATE API] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[SESSION CREATE API] Unexpected error:", error);
    console.error("[SESSION CREATE API] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}


