/**
 * Script to clear all sessions and orders for a specific restaurant
 * Usage: tsx scripts/clear-restaurant-data.ts <restaurant-slug>
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables from apps/next/.env
dotenv.config({ path: path.join(__dirname, "../apps/next/.env") });

async function clearRestaurantData(restaurantSlug: string) {
  try {
    // Dynamic import to ensure DATABASE_URL is loaded first
    const { db, restaurants, tableSessions, orders, eq } = await import("@menumate/db");

    console.log(`\n🔍 Looking for restaurant with slug: "${restaurantSlug}"...`);

    // Find restaurant by slug
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, restaurantSlug))
      .limit(1);

    if (!restaurant) {
      console.error(`❌ Restaurant with slug "${restaurantSlug}" not found!`);
      process.exit(1);
    }

    console.log(`✅ Found restaurant: ${restaurant.name} (ID: ${restaurant.id})\n`);

    // Get counts before deletion (select only basic fields to avoid schema mismatch)
    const sessionsCount = await db
      .select({ id: tableSessions.id })
      .from(tableSessions)
      .where(eq(tableSessions.restaurantId, restaurant.id));

    const ordersCount = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.restaurantId, restaurant.id));

    console.log(`📊 Current data counts:`);
    console.log(`   - Sessions: ${sessionsCount.length}`);
    console.log(`   - Orders: ${ordersCount.length}\n`);

    if (sessionsCount.length === 0 && ordersCount.length === 0) {
      console.log("✅ No data to clear. Restaurant is already clean!");
      process.exit(0);
    }

    // Delete orders first (they reference sessions)
    console.log("🗑️  Deleting orders...");
    const deletedOrders = await db
      .delete(orders)
      .where(eq(orders.restaurantId, restaurant.id));

    console.log(`   ✅ Deleted ${ordersCount.length} order(s)`);

    // Delete sessions
    console.log("🗑️  Deleting sessions...");
    const deletedSessions = await db
      .delete(tableSessions)
      .where(eq(tableSessions.restaurantId, restaurant.id));

    console.log(`   ✅ Deleted ${sessionsCount.length} session(s)\n`);

    console.log("✨ Restaurant data cleared successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Restaurant: ${restaurant.name}`);
    console.log(`   - Sessions deleted: ${sessionsCount.length}`);
    console.log(`   - Orders deleted: ${ordersCount.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing restaurant data:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Get restaurant slug from command line arguments
const restaurantSlug = process.argv[2];

if (!restaurantSlug) {
  console.error("❌ Please provide a restaurant slug!");
  console.log("\nUsage: tsx scripts/clear-restaurant-data.ts <restaurant-slug>");
  console.log("Example: tsx scripts/clear-restaurant-data.ts new-appu-da-dhaba");
  process.exit(1);
}

clearRestaurantData(restaurantSlug);

