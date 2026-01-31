import { getCurrentUser } from "@/lib/auth";
import { db, users, restaurants, eq, inArray } from "@menumate/db";
import { Button } from "@menumate/app";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCircle, XCircle, User, Mail, Store } from "lucide-react";
import { formatIndianDateTime } from "@/lib/date-utils";

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

  await db
    .update(restaurants)
    .set({ isActive: true })
    .where(eq(restaurants.ownerId, userId));

  revalidatePath("/admin/super");
  revalidatePath("/admin");
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

  await db
    .update(restaurants)
    .set({ isActive: false })
    .where(eq(restaurants.ownerId, userId));

  revalidatePath("/admin/super");
  revalidatePath("/admin");
}

export default async function SuperAdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "super_admin") {
    redirect("/admin");
  }

  const allPendingUsers = await db
    .select()
    .from(users)
    .where(eq(users.status, "pending"));

  const restaurantAdmins = allPendingUsers.filter((u) => u.role !== "super_admin");

  const adminIds = restaurantAdmins.map((u) => u.id);
  const allRestaurants =
    adminIds.length > 0
      ? await db
          .select()
          .from(restaurants)
          .where(inArray(restaurants.ownerId, adminIds))
      : [];

  const restaurantMap = new Map(allRestaurants.map((r) => [r.ownerId, r.name]));

  const pendingUsersWithRestaurants = restaurantAdmins.map((user) => ({
    ...user,
    restaurantName: restaurantMap.get(user.id) || null,
  }));

  const pendingUsers = pendingUsersWithRestaurants.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Restaurant Admin Approvals
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review and approve pending restaurant admin account requests
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <p className="text-sm font-medium text-neutral-600">
              No pending restaurant admin requests to review
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              All caught up! New requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50/50">
            <h2 className="text-sm font-semibold text-neutral-900">
              Pending restaurant admins
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Approve or reject to allow sign-in and activate their restaurant
            </p>
          </div>
          <div className="w-full overflow-x-auto -mx-1">
            <table className="w-full table-fixed min-w-[360px]">
              <colgroup>
                <col style={{ width: "35%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "18%" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pendingUsers.map((pendingUser) => (
                  <tr
                    key={pendingUser.id}
                    className="group hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">
                            {pendingUser.fullName}
                          </p>
                          <p className="text-xs text-neutral-500 truncate mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            {pendingUser.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Store className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        <span className="font-medium text-neutral-900 truncate">
                          {pendingUser.restaurantName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-left">
                      <span
                        className="text-xs text-neutral-500"
                        suppressHydrationWarning
                      >
                        {formatIndianDateTime(pendingUser.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <form
                          action={approveUser.bind(null, pendingUser.id)}
                          className="inline"
                        >
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                        </form>
                        <form
                          action={rejectUser.bind(null, pendingUser.id)}
                          className="inline"
                        >
                          <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            className="inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
