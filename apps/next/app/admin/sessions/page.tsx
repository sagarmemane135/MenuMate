import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, tableSessions, orders, eq, desc, and } from "@menumate/db";
import { SessionsPageClient } from "./sessions-page-client";

export default async function SessionsPage() {
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
      const { restaurants } = await import("@menumate/db");
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-semibold">
              Error loading restaurant data. Please try again.
            </p>
          </div>
        </div>
      );
    }

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
    let allSessions: Array<{
      id: string;
      restaurantId: string;
      tableNumber: string;
      sessionToken: string;
      status: string;
      totalAmount: string;
      paymentMethod: string | null;
      paymentStatus: string | null;
      paymentId: string | null;
      customerName: string | null;
      customerPhone: string | null;
      startedAt: Date | string;
      closedAt: Date | string | null;
    }> = [];
    try {
      allSessions = await db
        .select()
        .from(tableSessions)
        .where(eq(tableSessions.restaurantId, restaurant.id))
        .orderBy(desc(tableSessions.startedAt));
    } catch (error) {
      console.error("Error fetching sessions:", error);
      allSessions = [];
    }

    // Also fetch pending counter payments
    let pendingCounterPayments: typeof allSessions = [];
    try {
      pendingCounterPayments = await db
        .select()
        .from(tableSessions)
        .where(
          and(
            eq(tableSessions.restaurantId, restaurant.id),
            eq(tableSessions.paymentMethod, "counter"),
            eq(tableSessions.paymentStatus, "pending")
          )
        );
    } catch (error) {
      console.error("Error fetching pending counter payments:", error);
      pendingCounterPayments = [];
    }

    // Fetch orders count for each session
    let sessionsWithOrders: Array<typeof allSessions[0] & { ordersCount: number }> = [];
    try {
      sessionsWithOrders = await Promise.all(
        allSessions.map(async (session) => {
          try {
            const sessionOrders = await db
              .select()
              .from(orders)
              .where(eq(orders.sessionId, session.id));

            return {
              ...session,
              startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
              closedAt: session.closedAt instanceof Date ? session.closedAt.toISOString() : session.closedAt,
              ordersCount: sessionOrders.length,
            };
          } catch (error) {
            console.error(`Error fetching orders for session ${session.id}:`, error);
            return {
              ...session,
              startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
              closedAt: session.closedAt instanceof Date ? session.closedAt.toISOString() : session.closedAt,
              ordersCount: 0,
            };
          }
        })
      );
    } catch (error) {
      console.error("Error processing sessions:", error);
      sessionsWithOrders = allSessions.map((session) => ({
        ...session,
        startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
        closedAt: session.closedAt instanceof Date ? session.closedAt.toISOString() : session.closedAt,
        ordersCount: 0,
      }));
    }

    // Serialize pendingCounterPayments dates
    const serializedPendingPayments = pendingCounterPayments.map((payment) => ({
      ...payment,
      startedAt: payment.startedAt instanceof Date ? payment.startedAt.toISOString() : payment.startedAt,
      closedAt: payment.closedAt instanceof Date ? payment.closedAt.toISOString() : payment.closedAt,
    }));

    return <SessionsPageClient initialSessions={sessionsWithOrders} restaurantId={restaurant.id} pendingCounterPayments={serializedPendingPayments} />;
  } catch (error) {
    console.error("SessionsPage error:", error);
    return (
      <div className="px-4 py-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Sessions</h2>
          <p className="text-red-600">
            An error occurred while loading sessions. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}
