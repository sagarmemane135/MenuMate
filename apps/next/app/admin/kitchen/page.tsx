import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, orders, eq, and, or, desc } from "@menumate/db";
import { redirect } from "next/navigation";
import { KitchenPageClient } from "./kitchen-page-client";

export default async function KitchenPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  // Get user's restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.userId))
    .limit(1);

  if (!restaurant) {
    // Show error message instead of silent redirect
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Restaurant Not Found</h2>
          <p className="text-red-600">
            You don't have a restaurant associated with your account. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Get all pending, cooking, and ready orders
  const allOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.restaurantId, restaurant.id),
        or(
          eq(orders.status, "pending"),
          eq(orders.status, "cooking"),
          eq(orders.status, "ready")
        )
      )
    )
    .orderBy(desc(orders.createdAt));

  return (
    <KitchenPageClient
      restaurantId={restaurant.id}
      initialOrders={allOrders.map((order) => ({
        id: order.id,
        items: order.items as Array<{
          itemId: string;
          name: string;
          quantity: number;
          price: number;
        }>,
        status: order.status as "pending" | "cooking" | "ready" | "paid" | "cancelled",
        tableNumber: order.tableNumber,
        totalAmount: order.totalAmount,
        customerName: order.customerName,
        notes: order.notes,
        createdAt: order.createdAt,
      }))}
    />
  );
}

