/**
 * Create an admin (owner) account for local development.
 * Creates one user (role: owner, status: approved) and one restaurant.
 *
 * Usage (from repo root or packages/db):
 *   DATABASE_URL="postgresql://admin:admin123@localhost:5432/mydb" npx tsx packages/db/scripts/create-admin.ts
 * Or: cd packages/db && npm run create-admin
 * (Set DATABASE_URL in apps/next/.env or export it)
 *
 * Optional env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, RESTAURANT_NAME
 * Defaults: admin@local.dev / Admin@123 / Local Admin / My Restaurant
 */

import path from "path";
import { readFileSync, existsSync } from "fs";

// Load DATABASE_URL from .env files before importing db (client reads it at load time)
if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.join(process.cwd(), "apps/next/.env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", "..", "apps", "next", ".env"), // cwd = packages/db
    path.join(__dirname, "..", "..", "..", "apps", "next", ".env"),
  ];
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\s#]+)/);
        if (match) {
          process.env.DATABASE_URL = match[1].trim();
          break;
        }
      }
      if (process.env.DATABASE_URL) break;
    }
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@local.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Local Admin";
const RESTAURANT_NAME = process.env.RESTAURANT_NAME || "My Restaurant";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Set it or ensure apps/next/.env exists with DATABASE_URL.");
    process.exit(1);
  }

  const bcryptMod = await import("bcryptjs");
  const bcrypt = bcryptMod.default ?? bcryptMod;
  const { db, users, restaurants, eq } = await import("../src/index");

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);
    if (existing) {
      console.log(`✅ Admin user already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const slug = RESTAURANT_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-restaurant";

    const [newUser] = await db
      .insert(users)
      .values({
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: ADMIN_NAME,
        role: "owner",
        status: "approved",
      })
      .returning();

    const [newRestaurant] = await db
      .insert(restaurants)
      .values({
        ownerId: newUser!.id,
        name: RESTAURANT_NAME,
        slug,
        isActive: true,
      })
      .returning();

    console.log("✅ Admin account created for local DB");
    console.log("   Email:", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);
    console.log("   Restaurant:", newRestaurant!.name, `(slug: ${newRestaurant!.slug})`);
    console.log("\n   Log in at /login and open /admin");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

main();
