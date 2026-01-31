import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const connectionString = process.env.DATABASE_URL;

// Local Postgres: no SSL, standard connection
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: false,
  max_lifetime: 60 * 30,
  transform: {
    undefined: null,
  },
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
