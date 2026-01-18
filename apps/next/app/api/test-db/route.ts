import { NextResponse } from "next/server";
import { db } from "@menumate/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Basic connection
    try {
      const basicTest = await db.execute(sql`SELECT 1 as test, NOW() as current_time`);
      results.tests.push({
        name: "Basic Connection",
        status: "success",
        data: basicTest,
      });
    } catch (error: any) {
      results.tests.push({
        name: "Basic Connection",
        status: "failed",
        error: {
          message: error?.message,
          code: error?.code,
          detail: error?.detail,
          hint: error?.hint,
        },
      });
    }

    // Test 2: Check PostgreSQL version
    try {
      const version = await db.execute(sql`SELECT version()`);
      results.tests.push({
        name: "PostgreSQL Version",
        status: "success",
        data: version,
      });
    } catch (error: any) {
      results.tests.push({
        name: "PostgreSQL Version",
        status: "failed",
        error: error?.message,
      });
    }

    // Test 3: Check users table
    try {
      const { users } = await import("@menumate/db");
      const userCount = await db.select().from(users).limit(5);
      results.tests.push({
        name: "Users Table Query",
        status: "success",
        data: {
          count: userCount.length,
          users: userCount.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
          })),
        },
      });
    } catch (error: any) {
      results.tests.push({
        name: "Users Table Query",
        status: "failed",
        error: {
          message: error?.message,
          code: error?.code,
          detail: error?.detail,
        },
      });
    }

    // Connection string info (sanitized)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const url = new URL(dbUrl);
        results.connectionInfo = {
          host: url.hostname,
          port: url.port,
          database: url.pathname,
          user: url.username,
          hasPassword: !!url.password,
          isPooler: url.hostname.includes("pooler"),
          isSupabase: url.hostname.includes("supabase"),
        };
      } catch (e) {
        results.connectionInfo = { error: "Could not parse connection string" };
      }
    } else {
      results.connectionInfo = { error: "DATABASE_URL not set" };
    }

    const allPassed = results.tests.every((t: any) => t.status === "success");
    return NextResponse.json(results, {
      status: allPassed ? 200 : 500,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error?.message,
        code: error?.code,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

