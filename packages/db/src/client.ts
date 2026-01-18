import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Determine if we're connecting to Supabase
const isSupabase = process.env.DATABASE_URL?.includes('supabase') || 
                   process.env.DATABASE_URL?.includes('pooler.supabase.com');

// Use the connection string as-is
// postgres.js handles URL encoding automatically
const connectionString = process.env.DATABASE_URL;

// Configure SSL for Supabase connections
// Supabase pooler requires SSL but accepts self-signed certificates
const sslConfig = isSupabase 
  ? { rejectUnauthorized: false } // Supabase pooler uses self-signed certificates
  : process.env.DATABASE_URL?.includes('vercel') 
    ? 'require' 
    : false;

// Configure connection pooling for Supabase PostgreSQL
// Supabase connection pooler supports up to 200 connections
// Using pooled connection for better performance
const client = postgres(connectionString, {
  prepare: false, // Disable prepared statements for pooler compatibility (required for Supabase pooler)
  max: 15, // Reduced from 20 to avoid connection limits
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 30, // Increased timeout for Supabase connections
  ssl: sslConfig,
  max_lifetime: 60 * 30, // 30 minutes
  // Additional options for better Supabase compatibility
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
  // Connection error handling
  onnotice: () => {}, // Suppress notices
});

// Test connection on startup (non-blocking)
if (isSupabase) {
  client`SELECT 1`
    .then(() => {
      console.log("[DB] ✅ Database connection successful");
    })
    .catch((err) => {
      console.error("[DB] ❌ Database connection test failed:", err.message);
    });
}

export const db = drizzle(client, { schema });

export type Database = typeof db;


