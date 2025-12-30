import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure connection pooling to prevent "too many clients" error
// max: maximum number of connections in the pool
// idle_timeout: close idle connections after this many seconds
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10, // Maximum 10 connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
});

export const db = drizzle(client, { schema });

export type Database = typeof db;


