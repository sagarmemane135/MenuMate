#!/usr/bin/env tsx
/**
 * Run database migration script
 * This script applies the customer columns migration to the database
 * 
 * Usage:
 *   cd packages/db && npm run migrate:customer-columns
 * 
 * Make sure DATABASE_URL is set in your environment
 */

import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error("Please set DATABASE_URL before running the migration");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  const sql = postgres(databaseUrl, {
    ssl: databaseUrl.includes("supabase") || databaseUrl.includes("vercel") ? "require" : false,
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
      if (error.message.includes("already exists") || error.message.includes("duplicate")) {
        console.log("ℹ️  Columns may already exist. This is okay.");
      }
    }
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

