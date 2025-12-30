import { db, users, eq } from "../src";
import bcrypt from "bcryptjs";

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || "admin@menumate.com";
  const password = process.env.SUPER_ADMIN_PASSWORD || "admin123";
  const fullName = process.env.SUPER_ADMIN_NAME || "Super Admin";

  try {
    // Check if super admin already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      console.log(`User with email ${email} already exists.`);
      if (existing.role === "super_admin") {
        console.log("This user is already a super admin.");
        return;
      } else {
        console.log("Updating user to super admin...");
        await db
          .update(users)
          .set({ 
            role: "super_admin",
            status: "approved"
          })
          .where(eq(users.id, existing.id));
        console.log("✓ User updated to super admin successfully!");
        return;
      }
    }

    // Create new super admin
    const passwordHash = await bcrypt.hash(password, 10);
    
    const [newAdmin] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        fullName,
        role: "super_admin",
        status: "approved",
      })
      .returning();

    console.log("✓ Super admin created successfully!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Full Name: ${fullName}`);
    console.log("\nYou can now login at http://localhost:3000/login");
  } catch (error) {
    console.error("Error creating super admin:", error);
    process.exit(1);
  }
}

createSuperAdmin()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

