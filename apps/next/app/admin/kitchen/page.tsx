import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, orders, eq, and, or, desc } from "@menumate/db";
import { redirect } from "next/navigation";
import { KitchenPageClient } from "./kitchen-page-client";

export default async function KitchenPage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    if (user.role === "super_admin") {
      redirect("/admin");
    }

    // Get user's restaurant
    let restaurant = null;
    try {
      const [restaurantData] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.ownerId, user.userId))
        .limit(1);
      restaurant = restaurantData;
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      return (
        <div className="px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Restaurant</h2>
            <p className="text-red-600">
              An error occurred while loading restaurant data. Please try again.
            </p>
          </div>
        </div>
      );
    }

    if (!restaurant) {
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

    // Get all pending, cooking, ready, and served orders
    let allOrders: Array<{
      id: string;
      items: unknown;
      status: string;
      tableNumber: string | null;
      totalAmount: string;
      customerName: string;
      notes: string | null;
      createdAt: Date | string;
    }> = [];
    try {
      allOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurant.id),
            or(
              eq(orders.status, "pending"),
              eq(orders.status, "cooking"),
              eq(orders.status, "ready"),
              eq(orders.status, "served")
            )
          )
        )
        .orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error fetching orders:", error);
      allOrders = [];
    }

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
          status: order.status as "pending" | "cooking" | "ready" | "served" | "paid" | "cancelled",
          tableNumber: order.tableNumber,
          totalAmount: order.totalAmount,
          customerName: order.customerName,
          notes: order.notes,
          createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
        }))}
      />
    );
  } catch (error) {
    console.error("KitchenPage error:", error);
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Kitchen Display</h2>
          <p className="text-red-600">
            An error occurred while loading the kitchen display. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}

