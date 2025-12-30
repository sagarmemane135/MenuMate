import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, users, eq } from "@menumate/db";
import { Card } from "@menumate/app";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardClient } from "./dashboard-client";
import { Users, CheckCircle, Clock, UtensilsCrossed, ClipboardList, BarChart3 } from "lucide-react";

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get restaurant for owner/staff
  let restaurant = null;
  let activeSessions: any[] = [];
  
  if (user.role !== "super_admin") {
    const [restaurantData] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.ownerId, user.userId))
      .limit(1);

    restaurant = restaurantData;

    // Fetch active sessions for this restaurant
    if (restaurant) {
      const { tableSessions, and } = await import("@menumate/db");
      activeSessions = await db
        .select()
        .from(tableSessions)
        .where(
          and(
            eq(tableSessions.restaurantId, restaurant.id),
            eq(tableSessions.status, "active")
          )
        );
    }
  }

  // For super admin: get all restaurants and stats
  let allRestaurants = [];
  let stats = null;
  if (user.role === "super_admin") {
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
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
          {user.role === "super_admin" ? "Platform Admin" : "Dashboard"}
        </h1>
        <p className="mt-2 sm:mt-3 text-base sm:text-lg text-slate-600">
          {user.role === "super_admin" 
            ? "Manage restaurants and admins" 
            : `Welcome back!`}
        </p>
      </div>

      {user.role === "super_admin" ? (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Restaurant Admins</p>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mt-3">
                  {stats?.totalRestaurantAdmins || 0}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Total registered</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Approved Admins</p>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-green-600 mt-3">
                  {stats?.approvedRestaurantAdmins || 0}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Active restaurant admins</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Pending Approvals</p>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-4xl font-bold text-yellow-600 mt-3">
                  {stats?.pendingRestaurantAdmins || 0}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting review</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-600">Total Restaurants</p>
                  <UtensilsCrossed className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-blue-600 mt-3">
                  {stats?.totalRestaurants || 0}
                </p>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {stats?.activeRestaurants || 0} active
                </p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="/admin/super"
                className="block p-5 border-2 border-orange-200 rounded-xl hover:border-orange-400 bg-gradient-to-br from-orange-50 to-white hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start space-x-3">
                  <ClipboardList className="w-10 h-10 text-orange-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1.5">
                      Review Restaurant Admin Requests
                    </h3>
                    <p className="text-sm text-slate-600">
                      Approve or reject pending restaurant admin registrations
                    </p>
                  </div>
                </div>
              </a>
              <div className="p-5 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="w-10 h-10 text-slate-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1.5">
                      Platform Overview
                    </h3>
                    <p className="text-sm text-slate-600">
                      {stats?.activeRestaurants || 0} active restaurants out of{" "}
                      {stats?.totalRestaurants || 0} total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Restaurants List */}
          <Card title="All Restaurants">
            {allRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">
                  No restaurants registered yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Restaurant Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {allRestaurants.map((restaurant) => (
                      <tr key={restaurant.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">
                            {restaurant.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600 font-mono">
                            {restaurant.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              restaurant.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {restaurant.isActive ? "● Active" : "● Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <a
                            href={`/r/${restaurant.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:text-orange-700 transition-colors"
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
          </Card>
        </div>
      ) : (
        <DashboardClient restaurant={restaurant} userEmail={user.email} activeSessions={activeSessions} />
      )}
    </div>
  );
}


