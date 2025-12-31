// IMPORTANT: Load environment variables BEFORE importing database
// The database client checks for DATABASE_URL at module load time
// ES module imports are hoisted, so we must use dynamic imports
import { config } from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";

// Load environment variables from apps/next/.env
// Script runs from root, so path is relative to root
const envPath = resolve(process.cwd(), "apps/next/.env");
console.log(`🔍 Loading env from: ${envPath}`);
const result = config({ path: envPath });

if (result.error) {
  console.error(`❌ Error loading .env file: ${result.error.message}`);
  process.exit(1);
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in environment variables");
  console.error(`   Checked path: ${envPath}`);
  console.error(`   Current working directory: ${process.cwd()}`);
  process.exit(1);
}

console.log(`✅ DATABASE_URL loaded: ${process.env.DATABASE_URL.substring(0, 50)}...`);

// Use dynamic import to load database AFTER env is set
// This prevents the database client from checking DATABASE_URL before it's loaded

async function createSuperAdmin() {
  // Dynamically import database AFTER environment variables are loaded
  const { db, users, eq } = await import("@menumate/db");

  const email = process.argv[2] || "admin@menumate.com";
  const password = process.argv[3] || "admin123";
  const fullName = process.argv[4] || "Super Admin";

  console.log("\n🔐 Creating Super Admin User...");
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Name: ${fullName}`);
  console.log(`🔑 Password: ${password}\n`);

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      if (existingUser.role === "super_admin") {
        console.log("✅ User with this email already exists and is a super admin!");
        console.log(`   User ID: ${existingUser.id}`);
        console.log(`   Role: ${existingUser.role}`);
        console.log(`   Status: ${existingUser.status}`);
        process.exit(0);
      } else {
        console.log("⚠️  User with this email already exists. Updating to super admin...");
        const [updatedUser] = await db
          .update(users)
          .set({
            role: "super_admin",
            status: "approved",
            passwordHash: await bcrypt.hash(password, 10), // Update password too
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        
        console.log("\n✅ User updated to super admin successfully!");
        console.log(`\n📋 Updated User Details:`);
        console.log(`   ID: ${updatedUser.id}`);
        console.log(`   Email: ${updatedUser.email}`);
        console.log(`   Name: ${updatedUser.fullName}`);
        console.log(`   Role: ${updatedUser.role}`);
        console.log(`   Status: ${updatedUser.status}`);
        console.log(`\n🎉 You can now login with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}\n`);
        process.exit(0);
      }
    }

    // Hash password
    console.log("🔒 Hashing password...");
    const passwordHash = await bcrypt.hash(password, 10);

    // Create super admin user
    console.log("👤 Creating user in database...");
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName,
        role: "super_admin",
        status: "approved", // Auto-approve super admin
      })
      .returning();

    console.log("\n✅ Super Admin created successfully!");
    console.log(`\n📋 User Details:`);
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.fullName}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Status: ${newUser.status}`);
    console.log(`\n🎉 You can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin();

