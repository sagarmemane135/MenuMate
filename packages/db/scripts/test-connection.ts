import "dotenv/config";
import { db } from "../src/client";
import { users } from "../src/schema";
import { sql } from "drizzle-orm";

async function testConnection() {
  console.log("🔍 Testing database connection...\n");

  // Test 1: Basic connection
  console.log("Test 1: Basic SELECT query");
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Basic connection successful:", result);
  } catch (error: any) {
    console.error("❌ Basic connection failed:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
    });
    process.exit(1);
  }

  // Test 2: Check if users table exists
  console.log("\nTest 2: Check users table");
  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'users'`
    );
    console.log("✅ Users table check:", result);
  } catch (error: any) {
    console.error("❌ Users table check failed:", {
      message: error?.message,
      code: error?.code,
    });
  }

  // Test 3: Try to query users table
  console.log("\nTest 3: Query users table");
  try {
    const userCount = await db.select().from(users).limit(1);
    console.log("✅ Users query successful. Found users:", userCount.length);
    if (userCount.length > 0) {
      console.log("   Sample user:", {
        id: userCount[0].id,
        email: userCount[0].email,
        role: userCount[0].role,
      });
    }
  } catch (error: any) {
    console.error("❌ Users query failed:", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
    });
  }

  // Test 4: Check database version
  console.log("\nTest 4: Check PostgreSQL version");
  try {
    const version = await db.execute(sql`SELECT version()`);
    console.log("✅ PostgreSQL version:", version);
  } catch (error: any) {
    console.error("❌ Version check failed:", error?.message);
  }

  // Test 5: Check connection info
  console.log("\nTest 5: Connection information");
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      console.log("   Host:", url.hostname);
      console.log("   Port:", url.port);
      console.log("   Database:", url.pathname);
      console.log("   User:", url.username);
      console.log("   Has password:", !!url.password);
      console.log("   Is pooler:", url.hostname.includes("pooler"));
    } catch (e) {
      console.log("   Could not parse connection string");
    }
  }

  console.log("\n✅ All connection tests completed!");
  process.exit(0);
}

testConnection().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

