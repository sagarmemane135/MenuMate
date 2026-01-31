import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, eq } from "@menumate/db";
import { redirect } from "next/navigation";
import { SubscriptionExpiredContent } from "./subscription-expired-content";

export default async function SubscriptionExpiredPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.userId))
    .limit(1);

  if (restaurant?.isActive) {
    redirect("/admin");
  }

  return <SubscriptionExpiredContent />;
}
