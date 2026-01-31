import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, users, orders, eq, and, gte } from "@menumate/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DashboardClient } from "./dashboard-client";
import { SuperAdminRestaurantsTable } from "./super-admin-restaurants-table";
import { Users, CheckCircle, Clock, UtensilsCrossed, ClipboardList } from "lucide-react";

async function setRestaurantInactive(restaurantId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") throw new Error("Unauthorized");
  await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, restaurantId));
  revalidatePath("/admin");
}

async function setRestaurantActive(restaurantId: string) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") throw new Error("Unauthorized");
  await db.update(restaurants).set({ isActive: true }).where(eq(restaurants.id, restaurantId));
  revalidatePath("/admin");
}

export default async function AdminDashboard() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Get restaurant for owner/staff
    let restaurant = null;
    let activeSessions: any[] = [];
    let pendingCounterPayments: any[] = [];
    let todayRevenue = 0;
    let topSellingItems: Array<{ name: string; quantity: number; revenue: number }> = [];
    
    if (user.role !== "super_admin") {
      try {
        const [restaurantData] = await db
          .select()
          .from(restaurants)
          .where(eq(restaurants.ownerId, user.userId))
          .limit(1);

        restaurant = restaurantData;

        // Inactive restaurant: layout shows subscription-expired content (no redirect to avoid NEXT_REDIRECT)

        // Fetch active sessions for this restaurant
        if (restaurant) {
          try {
            const { tableSessions, and } = await import("@menumate/db");
            const activeSessionsData = await db
              .select()
              .from(tableSessions)
              .where(
                and(
                  eq(tableSessions.restaurantId, restaurant.id),
                  eq(tableSessions.status, "active")
                )
              );
            
            // Serialize dates for client component
            activeSessions = activeSessionsData.map((session) => ({
              ...session,
              startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt,
              closedAt: session.closedAt instanceof Date ? session.closedAt.toISOString() : session.closedAt,
            }));
          } catch (error) {
            console.error("Error fetching active sessions:", error);
            activeSessions = [];
          }
          
          // Fetch pending counter payments
          try {
            const { tableSessions, and } = await import("@menumate/db");
            const pendingPaymentsData = await db
              .select()
              .from(tableSessions)
              .where(
                and(
                  eq(tableSessions.restaurantId, restaurant.id),
                  eq(tableSessions.paymentMethod, "counter"),
                  eq(tableSessions.paymentStatus, "pending")
                )
              );
            
            // Serialize dates for client component
            pendingCounterPayments = pendingPaymentsData.map((payment) => ({
              ...payment,
              startedAt: payment.startedAt instanceof Date ? payment.startedAt.toISOString() : payment.startedAt,
              closedAt: payment.closedAt instanceof Date ? payment.closedAt.toISOString() : payment.closedAt,
            }));
          } catch (error) {
            console.error("Error fetching pending counter payments:", error);
            pendingCounterPayments = [];
          }
          
          // Fetch today's revenue
          try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const todayOrders = await db
              .select()
              .from(orders)
              .where(
                and(
                  eq(orders.restaurantId, restaurant.id),
                  gte(orders.createdAt, startOfDay)
                )
              );
            
            todayRevenue = todayOrders
              .filter((order) => order.isPaid === true)
              .reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
          } catch (error) {
            console.error("Error fetching today's revenue:", error);
            todayRevenue = 0;
          }
          
          // Fetch top 3 selling items (last 30 days)
          try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentOrders = await db
              .select()
              .from(orders)
              .where(
                and(
                  eq(orders.restaurantId, restaurant.id),
                  gte(orders.createdAt, thirtyDaysAgo)
                )
              );
            
            // Aggregate items
            const itemMetrics = new Map<string, { name: string; quantity: number; revenue: number }>();
            
            recentOrders
              .filter((order) => order.isPaid === true)
              .forEach((order) => {
              const items = order.items as Array<{
                itemId: string;
                name: string;
                quantity: number;
                price: number;
              }>;
              
              items.forEach((item) => {
                const existing = itemMetrics.get(item.itemId) || {
                  name: item.name,
                  quantity: 0,
                  revenue: 0,
                };
                
                existing.quantity += item.quantity;
                existing.revenue += item.quantity * item.price;
                
                itemMetrics.set(item.itemId, existing);
              });
            });
            
            // Get top 3 by quantity
            topSellingItems = Array.from(itemMetrics.values())
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 5);
          } catch (error) {
            console.error("Error fetching top selling items:", error);
            topSellingItems = [];
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        restaurant = null;
      }
    }

    // For super admin: get all restaurants and stats
    let allRestaurants: Array<{
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      ownerId: string;
    }> = [];
    let stats: {
      totalRestaurantAdmins: number;
      approvedRestaurantAdmins: number;
      pendingRestaurantAdmins: number;
      totalRestaurants: number;
      activeRestaurants: number;
    } | null = null;
    if (user.role === "super_admin") {
      try {
        const restaurantsList = await db
          .select({
            id: restaurants.id,
            name: restaurants.name,
            slug: restaurants.slug,
            isActive: restaurants.isActive,
            ownerId: restaurants.ownerId,
          })
          .from(restaurants);
        
        // Sort restaurants by name
        allRestaurants = restaurantsList.sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        // Get statistics - exclude super_admin users (they are platform admins, not restaurant admins)
        const allUsers = await db.select().from(users);
        const restaurantAdmins = allUsers.filter((u) => u.role !== "super_admin");
        const totalRestaurantAdminsCount = restaurantAdmins.length;
        const approvedRestaurantAdminsCount = restaurantAdmins.filter((u) => u.status === "approved").length;
        const pendingRestaurantAdminsCount = restaurantAdmins.filter((u) => u.status === "pending").length;

        stats = {
          totalRestaurantAdmins: totalRestaurantAdminsCount,
          approvedRestaurantAdmins: approvedRestaurantAdminsCount,
          pendingRestaurantAdmins: pendingRestaurantAdminsCount,
          totalRestaurants: allRestaurants.length,
          activeRestaurants: allRestaurants.filter((r) => r.isActive).length,
        };
      } catch (error) {
        console.error("Error fetching super admin data:", error);
        allRestaurants = [];
        stats = {
          totalRestaurantAdmins: 0,
          approvedRestaurantAdmins: 0,
          pendingRestaurantAdmins: 0,
          totalRestaurants: 0,
          activeRestaurants: 0,
        };
      }
    }

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">
            {user.role === "super_admin" ? "Platform Admin" : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {user.role === "super_admin" 
              ? "Manage restaurants and admins" 
              : `Monitor your restaurant performance`}
          </p>
        </div>

        {user.role === "super_admin" ? (
        <div className="space-y-6">
          {/* Stats: uniform alignment and height */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="stat-label stat-label-fixed-height mb-1">Pending approvals</p>
                  <p className="stat-value text-warning-600 min-h-[2.25rem] flex items-center">{stats?.pendingRestaurantAdmins ?? 0}</p>
                  <p className="stat-change">Awaiting review</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-warning-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="stat-label stat-label-fixed-height mb-1">Approved admins</p>
                  <p className="stat-value text-success-600 min-h-[2.25rem] flex items-center">{stats?.approvedRestaurantAdmins ?? 0}</p>
                  <p className="stat-change">Can log in</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-5 h-5 text-success-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="stat-label stat-label-fixed-height mb-1">Total admins</p>
                  <p className="stat-value min-h-[2.25rem] flex items-center">{stats?.totalRestaurantAdmins ?? 0}</p>
                  <p className="stat-change">Registered</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-5 h-5 text-neutral-600" />
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="stat-label stat-label-fixed-height mb-1">Restaurants</p>
                  <p className="stat-value text-primary-600 min-h-[2.25rem] flex items-center">
                    <span>{stats?.activeRestaurants ?? 0}</span>
                    <span className="text-lg font-normal text-neutral-400 ml-0.5">/ {stats?.totalRestaurants ?? 0}</span>
                  </p>
                  <p className="stat-change">Active / total</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Single CTA when there are pending approvals */}
          {(stats?.pendingRestaurantAdmins ?? 0) > 0 && (
            <a
              href="/admin/super"
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-warning-200 bg-warning-50/50 hover:bg-warning-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-warning-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-6 h-6 text-warning-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-neutral-900">
                  {stats?.pendingRestaurantAdmins} request{(stats?.pendingRestaurantAdmins ?? 0) !== 1 ? "s" : ""} awaiting review
                </p>
                <p className="text-sm text-neutral-600 mt-0.5">Approve or reject new restaurant signups</p>
              </div>
              <span className="text-warning-700 font-medium text-sm flex-shrink-0">Review →</span>
            </a>
          )}

          {/* Restaurants table */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
              <h2 className="text-sm font-semibold text-neutral-900">All restaurants</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Toggle status to activate or deactivate menu</p>
            </div>
            <div className="p-4">
              <SuperAdminRestaurantsTable
                restaurants={allRestaurants}
                onActivate={setRestaurantActive}
                onDeactivate={setRestaurantInactive}
              />
            </div>
          </div>
        </div>
      ) : (
        <DashboardClient 
          restaurant={restaurant} 
          userEmail={user.email} 
          activeSessions={activeSessions}
          pendingCounterPayments={pendingCounterPayments}
          todayRevenue={todayRevenue}
          topSellingItems={topSellingItems}
        />
      )}
    </div>
    );
  } catch (error) {
    console.error("AdminDashboard error:", error);
    return (
      <div>
        <div className="bg-error-50 border border-error-200 rounded-card p-6">
          <h2 className="text-lg font-semibold text-error-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-sm text-error-600">
            An error occurred while loading the dashboard. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}


