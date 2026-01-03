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
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error("[SESSION CREATE API] DATABASE_URL not set");
      return NextResponse.json(
        { error: "Database configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { restaurantSlug, tableNumber } = createSessionSchema.parse(body);

    // Get restaurant by slug
    const { restaurants } = await import("@menumate/db");
    
    let restaurant;
    try {
      [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.slug, restaurantSlug))
        .limit(1);
    } catch (dbError) {
      console.error("[SESSION CREATE API] Database query error:", dbError);
      if (dbError instanceof Error) {
        console.error("[SESSION CREATE API] DB Error details:", {
          message: dbError.message,
          name: dbError.name,
        });
      }
      return NextResponse.json(
        { error: "Database connection failed. Please try again." },
        { status: 503 }
      );
    }

    if (!restaurant) {
      console.error("[SESSION CREATE API] Restaurant not found for slug:", restaurantSlug);
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active session for this table
    let existingSession;
    try {
      [existingSession] = await db
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
    } catch (dbError) {
      console.error("[SESSION CREATE API] Error checking existing session:", dbError);
      // Continue to create new session if check fails
      existingSession = null;
    }

    if (existingSession) {
      // Check if the existing session is older than 1 hour (inactive timeout)
      const sessionAge = Date.now() - new Date(existingSession.startedAt).getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (sessionAge > oneHourInMs) {
        // Auto-close the inactive session and create a new one
        await db
          .update(tableSessions)
          .set({
            status: "closed",
            closedAt: new Date(),
          })
          .where(eq(tableSessions.id, existingSession.id));
        
        console.log(`[SESSION CREATE API] Auto-closed inactive session ${existingSession.sessionToken} (age: ${Math.floor(sessionAge / 1000 / 60)} minutes)`);
        // Continue to create a new session below
        existingSession = null;
      } else {
        // Return existing active session
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
    }

    // Create new session
    const sessionToken = crypto.randomBytes(32).toString("hex");
    
    try {
      const [newSession] = await db
        .insert(tableSessions)
        .values({
          restaurantId: restaurant.id,
          tableNumber,
          sessionToken,
          status: "active",
        })
        .returning();

      if (!newSession) {
        console.error("[SESSION CREATE API] Insert returned no session");
        return NextResponse.json(
          { error: "Failed to create session - no data returned" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        session: {
          id: newSession.id,
          sessionToken: newSession.sessionToken,
          tableNumber: newSession.tableNumber,
          status: newSession.status,
        },
      }, { status: 201 });
    } catch (dbError) {
      console.error("[SESSION CREATE API] Database insert error:", dbError);
      if (dbError instanceof Error) {
        console.error("[SESSION CREATE API] DB Error message:", dbError.message);
        console.error("[SESSION CREATE API] DB Error stack:", dbError.stack);
        
        // Check for specific database errors
        if (dbError.message.includes("duplicate") || dbError.message.includes("unique")) {
          // Session token collision - try again with new token
          try {
            const retryToken = crypto.randomBytes(32).toString("hex");
            const [retrySession] = await db
              .insert(tableSessions)
              .values({
                restaurantId: restaurant.id,
                tableNumber,
                sessionToken: retryToken,
                status: "active",
              })
              .returning();

            if (retrySession) {
              return NextResponse.json({
                success: true,
                session: {
                  id: retrySession.id,
                  sessionToken: retrySession.sessionToken,
                  tableNumber: retrySession.tableNumber,
                  status: retrySession.status,
                },
              }, { status: 201 });
            }
          } catch (retryError) {
            console.error("[SESSION CREATE API] Retry also failed:", retryError);
          }
        }
      }
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[SESSION CREATE API] Validation error:", error.errors);
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    // Log detailed error information
    console.error("[SESSION CREATE API] Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[SESSION CREATE API] Error message:", error.message);
      console.error("[SESSION CREATE API] Error stack:", error.stack);
    }

    // Check for database connection errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("DATABASE_URL") || errorMessage.includes("connection")) {
      console.error("[SESSION CREATE API] Database connection error detected");
      return NextResponse.json(
        { error: "Database connection failed. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { 
        error: "Failed to create session",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}


