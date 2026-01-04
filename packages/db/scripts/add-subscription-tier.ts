/**
 * Migration script to add subscription_tier column to users table
 * Run this to add Pro user support
 */

import postgres from "postgres";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from apps/next/.env.local
dotenv.config({ path: resolve(__dirname, "../../../apps/next/.env.local") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function migrate() {
  console.log("🔄 Connecting to database...");
  const sql = postgres(DATABASE_URL);

  try {
    console.log("📝 Creating subscription_tier enum...");
    
    // Check if enum already exists
    const enumExists = await sql`
      SELECT 1 FROM pg_type WHERE typname = 'subscription_tier'
    `;

    if (enumExists.length === 0) {
      await sql`
        CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'enterprise')
      `;
      console.log("✅ Created subscription_tier enum");
    } else {
      console.log("ℹ️  subscription_tier enum already exists");
    }

    console.log("📝 Adding subscription columns to users table...");
    
    // Check if column already exists
    const columnExists = await sql`
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'subscription_tier'
    `;

    if (columnExists.length === 0) {
      await sql`
        ALTER TABLE "users" 
        ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
        ADD COLUMN "subscription_expires_at" timestamp
      `;
      console.log("✅ Added subscription columns");

      await sql`
        CREATE INDEX "users_subscription_idx" ON "users" ("subscription_tier")
      `;
      console.log("✅ Created subscription index");

      await sql`
        UPDATE "users" SET "subscription_tier" = 'free' WHERE "subscription_tier" IS NULL
      `;
      console.log("✅ Set default subscription tier for existing users");
    } else {
      console.log("ℹ️  subscription_tier column already exists");
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📊 To grant Pro access to a user, run:");
    console.log("   UPDATE users SET subscription_tier = 'pro' WHERE email = 'your-email@example.com';");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();

