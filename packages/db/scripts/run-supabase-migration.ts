#!/usr/bin/env tsx
/**
 * Run database migration for Supabase
 * This script reads DATABASE_URL from apps/next/.env and runs the migration
 */

import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as dotenv from "dotenv";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from apps/next directory
const envPath = path.join(__dirname, "../../../apps/next/.env");
dotenv.config({ path: envPath });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error("Please check apps/next/.env file");
    process.exit(1);
  }

  console.log("🔗 Connecting to Supabase database...");
  const sql = postgres(databaseUrl, {
    ssl: "require",
  });

  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, "add-customer-columns.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📝 Running migration: add-customer-columns.sql");
    console.log("SQL:", migrationSQL);

    // Execute the migration
    await sql.unsafe(migrationSQL);

    console.log("✅ Migration completed successfully!");
    console.log("✅ Added customer_name and customer_phone columns to table_sessions");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      // If columns already exist, that's okay
      if (error.message.includes("already exists") || error.message.includes("duplicate") || error.message.includes("column") && error.message.includes("already")) {
        console.log("ℹ️  Columns may already exist. This is okay.");
        process.exit(0);
      }
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

