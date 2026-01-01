import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, tableSessions, orders, eq, desc, and } from "@menumate/db";
import { SessionsPageClient } from "./sessions-page-client";

export default async function SessionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  // Get user's restaurant
  const { restaurants } = await import("@menumate/db");
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.userId))
    .limit(1);

  if (!restaurant) {
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-semibold">
            No restaurant found for your account
          </p>
        </div>
      </div>
    );
  }

  // Fetch all sessions for this restaurant
  const allSessions = await db
    .select()
    .from(tableSessions)
    .where(eq(tableSessions.restaurantId, restaurant.id))
    .orderBy(desc(tableSessions.startedAt));

  // Also fetch pending counter payments
  const pendingCounterPayments = await db
    .select()
    .from(tableSessions)
    .where(
      and(
        eq(tableSessions.restaurantId, restaurant.id),
        eq(tableSessions.paymentMethod, "counter"),
        eq(tableSessions.paymentStatus, "pending")
      )
    );

  // Fetch orders count for each session
  const sessionsWithOrders = await Promise.all(
    allSessions.map(async (session) => {
      const sessionOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.sessionId, session.id));

      return {
        ...session,
        ordersCount: sessionOrders.length,
      };
    })
  );

  return <SessionsPageClient initialSessions={sessionsWithOrders} restaurantId={restaurant.id} pendingCounterPayments={pendingCounterPayments} />;
}

