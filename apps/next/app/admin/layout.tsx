import { redirect } from "next/navigation";
import { getCurrentUser, getRestaurantForAdminUser } from "@/lib/auth";
import { AdminNav } from "./nav";
import { AdminLayoutWrapper } from "./admin-layout-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Owner: subscription depends on restaurant isActive. Staff: no subscription UI; use restaurant isActive for consistency.
    let restaurantActive: boolean | null = null;
    if (user.role === "owner" || user.role === "staff") {
      const restaurant = await getRestaurantForAdminUser(user);
      restaurantActive = restaurant?.isActive ?? null;
    }

    return (
      <div className="min-h-screen bg-neutral-50">
        <AdminNav userRole={user.role} userEmail={user.email} />

        <main className="lg:pl-64">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <AdminLayoutWrapper
              userRole={user.role}
              restaurantActive={restaurantActive}
            >
              {children}
            </AdminLayoutWrapper>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("AdminLayout error:", error);
    redirect("/login");
  }
}

