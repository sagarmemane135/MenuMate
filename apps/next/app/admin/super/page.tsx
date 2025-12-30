import { getCurrentUser } from "@/lib/auth";
import { db, users, restaurants, eq, inArray } from "@menumate/db";
import { Card, Button } from "@menumate/app";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCircle, XCircle, User, Mail, Store } from "lucide-react";

async function approveUser(userId: string) {
  "use server";
  const user = await getCurrentUser();
  
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ status: "approved" })
    .where(eq(users.id, userId));
  
  revalidatePath("/admin/super");
}

async function rejectUser(userId: string) {
  "use server";
  const user = await getCurrentUser();
  
  if (!user || user.role !== "super_admin") {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ status: "rejected" })
    .where(eq(users.id, userId));
  
  revalidatePath("/admin/super");
}

export default async function SuperAdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "super_admin") {
    redirect("/admin");
  }

  // Get pending restaurant admins (exclude super_admin users)
  const allPendingUsers = await db
    .select()
    .from(users)
    .where(eq(users.status, "pending"));
  
  // Filter out super_admin users
  const restaurantAdmins = allPendingUsers.filter((u) => u.role !== "super_admin");
  
  // Get all restaurants for these admins in one query
  const adminIds = restaurantAdmins.map((u) => u.id);
  const allRestaurants = adminIds.length > 0 
    ? await db
        .select()
        .from(restaurants)
        .where(inArray(restaurants.ownerId, adminIds))
    : [];
  
  // Create a map of ownerId -> restaurant name
  const restaurantMap = new Map(
    allRestaurants.map((r) => [r.ownerId, r.name])
  );
  
  // Add restaurant names to users
  const pendingUsersWithRestaurants = restaurantAdmins.map((user) => ({
    ...user,
    restaurantName: restaurantMap.get(user.id) || null,
  }));
  
  // Sort by created date (newest first)
  const pendingUsers = pendingUsersWithRestaurants.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Restaurant Admin Approvals
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Review and approve pending restaurant admin account requests
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-slate-600 font-medium text-lg">
              No pending restaurant admin requests to review
            </p>
            <p className="text-slate-500 text-sm mt-2">
              All caught up! New requests will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id} className="hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {pendingUser.fullName}
                    </h3>
                  </div>
                  <div className="space-y-3 ml-15">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Email:</span> {pendingUser.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-slate-400" />
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Restaurant:</span>{" "}
                        <span className="font-bold text-orange-600">
                          {pendingUser.restaurantName || "N/A"}
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-500" suppressHydrationWarning>
                      <span className="font-semibold">Requested:</span>{" "}
                      {new Date(pendingUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <form action={approveUser.bind(null, pendingUser.id)}>
                    <Button type="submit" variant="primary" size="md">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  </form>
                  <form action={rejectUser.bind(null, pendingUser.id)}>
                    <Button type="submit" variant="danger" size="md">
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

