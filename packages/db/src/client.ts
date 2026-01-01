import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure connection pooling for Supabase PostgreSQL
// Supabase connection pooler supports up to 200 connections
// Using pooled connection for better performance
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 20, // Maximum connections in the pool (Supabase allows more)
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('vercel') ? 'require' : false, // SSL for Supabase/Vercel
  max_lifetime: 60 * 30, // 30 minutes
});

export const db = drizzle(client, { schema });

export type Database = typeof db;


