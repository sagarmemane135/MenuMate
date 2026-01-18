import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

// Manually parse .env file since dotenv isn't working properly
function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)="?([^"]+)"?$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          env[key] = value;
        }
      }
    }
  }
  return env;
}

// Load environment variables from apps/next/.env
// __dirname is packages/db/scripts, so we need to go up 2 levels to root, then into apps/next
const envPath = path.resolve(__dirname, "../../../apps/next/.env");
const envVars = loadEnvFile(envPath);

// Set environment variables
for (const [key, value] of Object.entries(envVars)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// Also try root .env
const rootEnvPath = path.resolve(__dirname, "../../../.env");
const rootEnvVars = loadEnvFile(rootEnvPath);
for (const [key, value] of Object.entries(rootEnvVars)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

// Set DATABASE_URL if found in env file
if (envVars.DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = envVars.DATABASE_URL;
}

async function enableRLS() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    console.error("\n💡 Options:");
    console.error("   1. Set DATABASE_URL in apps/next/.env");
    console.error("   2. Or set it as an environment variable:");
    console.error("      $env:DATABASE_URL='your-connection-string'");
    console.error("   3. Or run from apps/next directory where .env exists");
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(process.env.DATABASE_URL, {
    ssl: process.env.DATABASE_URL?.includes('supabase') 
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    console.log("🔒 Enabling Row Level Security (RLS) on all tables...\n");

    // Read the migration file
    const migrationPath = path.join(__dirname, "../migrations/0006_enable_rls.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Execute the migration
    await client.unsafe(sql);

    console.log("✅ RLS enabled successfully on all tables!");
    console.log("\n📋 Tables with RLS enabled:");
    console.log("  - users");
    console.log("  - restaurants");
    console.log("  - categories");
    console.log("  - menu_items");
    console.log("  - orders");
    console.log("  - table_sessions");
    console.log("\n🔐 Policies created:");
    console.log("  - Service role can access all data (safe for direct PostgreSQL connections)");
    console.log("\n⚠️  Note: Since you're using direct PostgreSQL connections (not PostgREST API),");
    console.log("   these policies allow full access. Your application authentication");
    console.log("   (JWT tokens, API routes) provides the actual security layer.");

  } catch (error: any) {
    console.error("❌ Error enabling RLS:", error.message);
    if (error.code) {
      console.error("   Error code:", error.code);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

enableRLS();

