/**
 * Grant Pro access to a user
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error("❌ Please provide an email address");
  console.log("Usage: npx tsx grant-pro-access.ts user@example.com");
  process.exit(1);
}

async function grantProAccess() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log(`🔄 Granting Pro access to: ${email}`);
    
    const result = await sql`
      UPDATE users 
      SET subscription_tier = 'pro', 
          subscription_expires_at = NOW() + INTERVAL '1 year'
      WHERE email = ${email}
      RETURNING email, subscription_tier
    `;

    if (result.length === 0) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✅ User ${email} is now Pro!`);
    console.log(`📅 Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

grantProAccess();

