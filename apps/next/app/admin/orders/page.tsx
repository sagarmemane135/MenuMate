import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, orders, eq } from "@menumate/db";
import { redirect } from "next/navigation";
import { OrdersPageClient } from "./orders-page-client";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  // Get restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.userId))
    .limit(1);

  if (!restaurant) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-600">No restaurant found</p>
      </div>
    );
  }

  // Get orders
  const allOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.restaurantId, restaurant.id))
    .limit(50);

  // Sort by created date (newest first)
  const sortedOrders = allOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return <OrdersPageClient initialOrders={sortedOrders} restaurantId={restaurant.id} />;
}


