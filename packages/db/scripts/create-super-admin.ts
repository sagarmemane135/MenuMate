/**
 * Create the MenuMate platform admin (super_admin) account.
 * This user can log in and approve/reject restaurant owner signups at /admin/super.
 *
 * Usage:
 *   npm run create-super-admin --workspace=@menumate/db
 * Or: cd packages/db && npm run create-super-admin
 *
 * Optional env: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME
 * Defaults: menumate@local.dev / MenuMate@123 / MenuMate Admin
 */

import path from "path";
import { readFileSync, existsSync } from "fs";

if (!process.env.DATABASE_URL) {
  const envPaths = [
    path.join(process.cwd(), "apps/next/.env"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", "..", "apps", "next", ".env"),
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

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "menumate@local.dev";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "MenuMate@123";
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "MenuMate Admin";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Set it or ensure apps/next/.env exists with DATABASE_URL.");
    process.exit(1);
  }

  const bcryptMod = await import("bcryptjs");
  const bcrypt = bcryptMod.default ?? bcryptMod;
  const { db, users, eq } = await import("../src/index");

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, SUPER_ADMIN_EMAIL)).limit(1);
    if (existing) {
      console.log(`✅ MenuMate admin (super_admin) already exists: ${SUPER_ADMIN_EMAIL}`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    await db
      .insert(users)
      .values({
        email: SUPER_ADMIN_EMAIL,
        passwordHash,
        fullName: SUPER_ADMIN_NAME,
        role: "super_admin",
        status: "approved",
      })
      .returning();

    console.log("✅ MenuMate platform admin (super_admin) created");
    console.log("   Email:", SUPER_ADMIN_EMAIL);
    console.log("   Password:", SUPER_ADMIN_PASSWORD);
    console.log("\n   Log in at /login → go to /admin → User Approvals to approve restaurant signups.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating super admin:", err);
    process.exit(1);
  }
}

main();
