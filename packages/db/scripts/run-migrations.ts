/**
 * Run all SQL migrations from packages/db/migrations/ in order.
 * Use when drizzle-kit push fails or when you need to apply manual migrations.
 *
 * Usage: npx tsx packages/db/scripts/run-migrations.ts
 * Or:    npm run migrate:sql (from packages/db)
 *
 * Requires DATABASE_URL in apps/next/.env or .env
 */

import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let value = trimmed.slice(eq + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    }
  }
  return env;
}

const scriptsDir = __dirname;
const pkgDir = path.resolve(scriptsDir, "..");
const rootDir = path.resolve(pkgDir, "..", "..");
const migrationsDir = path.join(pkgDir, "migrations");

const envPaths = [
  path.join(rootDir, "apps", "next", ".env"),
  path.join(rootDir, ".env"),
  path.join(pkgDir, ".env"),
];

for (const p of envPaths) {
  const envVars = loadEnvFile(p);
  for (const [key, value] of Object.entries(envVars)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigrations() {
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Set it in apps/next/.env or .env");
    process.exit(1);
  }

  if (!fs.existsSync(migrationsDir)) {
    console.error("❌ Migrations folder not found:", migrationsDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  const client = postgres(DATABASE_URL, {
    ssl: DATABASE_URL?.includes("supabase") ? { rejectUnauthorized: false } : false,
    // Suppress NOTICE messages (e.g. "relation already exists, skipping")
    onnotice: () => {},
  });

  console.log("📂 Migrations folder:", migrationsDir);
  console.log("📄 Running", files.length, "migration(s)...\n");

  const alreadyExistsCodes = new Set(["42710", "42P07", "42P16", "42701"]);
  function isAlreadyExists(err: unknown): boolean {
    const code = (err as { code?: string })?.code;
    return !!code && alreadyExistsCodes.has(code);
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8").trim();
    if (!sql) {
      console.log("⏭️", file, "(empty, skipped)");
      continue;
    }
    try {
      await client.unsafe(sql);
      console.log("✅", file);
    } catch (err) {
      if (isAlreadyExists(err)) {
        console.log("⏭️", file, "(already applied, skipped)");
      } else {
        console.error("❌", file, "failed:", err);
        await client.end();
        process.exit(1);
      }
    }
  }

  await client.end();
  console.log("\n✅ All migrations completed.");
}

runMigrations();
