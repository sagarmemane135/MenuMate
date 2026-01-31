import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, eq } from "@menumate/db";
import { AnalyticsPageClient } from "./analytics-page-client";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    redirect("/login");
  }

  // Get user's restaurant
  const userRestaurants = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, String(user.id)));

  if (userRestaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-neutral-700">
          No restaurant found
        </h2>
        <p className="text-neutral-600 mt-2">
          Please contact support to set up your restaurant.
        </p>
      </div>
    );
  }

  const restaurant = userRestaurants[0];
  // Inactive restaurant: layout shows subscription-expired content
  const subscriptionTier = user.subscriptionTier ? String(user.subscriptionTier) : "free";
  const userName = user.fullName ? String(user.fullName) : "User";

  return (
    <AnalyticsPageClient
      restaurantId={restaurant.id}
      subscriptionTier={subscriptionTier}
      userName={userName}
    />
  );
}

