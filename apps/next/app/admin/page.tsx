import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, users, orders, eq, and, gte } from "@menumate/db";
import { Card } from "@menumate/app";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardClient } from "./dashboard-client";
import { Users, CheckCircle, Clock, UtensilsCrossed, ClipboardList, BarChart3 } from "lucide-react";

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
            
            todayRevenue = todayOrders.reduce(
              (sum, order) => sum + parseFloat(order.totalAmount),
              0
            );
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
            
            recentOrders.forEach((order) => {
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
              .slice(0, 3);
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Restaurant Admins</p>
                  <p className="stat-value">{stats?.totalRestaurantAdmins || 0}</p>
                  <p className="stat-change">Total registered</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-neutral-600" />
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Approved Admins</p>
                  <p className="stat-value text-success-600">{stats?.approvedRestaurantAdmins || 0}</p>
                  <p className="stat-change">Active restaurant admins</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-success-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success-600" />
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Pending Approvals</p>
                  <p className="stat-value text-warning-600">{stats?.pendingRestaurantAdmins || 0}</p>
                  <p className="stat-change">Awaiting review</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning-50 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning-600" />
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Total Restaurants</p>
                  <p className="stat-value text-primary-600">{stats?.totalRestaurants || 0}</p>
                  <p className="stat-change">{stats?.activeRestaurants || 0} active</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-neutral-200 rounded-card shadow-card">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="/admin/super"
                  className="flex items-start space-x-3 p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                      Review Admin Requests
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Approve or reject pending registrations
                    </p>
                  </div>
                </a>
                <div className="flex items-start space-x-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                      Platform Overview
                    </h3>
                    <p className="text-xs text-neutral-600">
                      {stats?.activeRestaurants || 0} active of{" "}
                      {stats?.totalRestaurants || 0} total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurants List */}
          <div className="bg-white border border-neutral-200 rounded-card shadow-card">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">All Restaurants</h2>
            </div>
            {allRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                  <UtensilsCrossed className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-600">
                  No restaurants registered yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-professional">
                  <thead>
                    <tr>
                      <th>Restaurant Name</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {allRestaurants.map((restaurant) => (
                      <tr key={restaurant.id}>
                        <td>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center mr-3">
                              <UtensilsCrossed className="w-4 h-4 text-primary-600" />
                            </div>
                            <div className="font-medium text-neutral-900">
                              {restaurant.name}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-sm text-neutral-600 font-mono">
                            {restaurant.slug}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              restaurant.isActive
                                ? "bg-success-50 text-success-700"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {restaurant.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                          >
                            View Menu →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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


