import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, eq } from "@menumate/db";
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

    let restaurantActive: boolean | null = null;
    if (user.role === "owner") {
      const [restaurant] = await db
        .select({ isActive: restaurants.isActive })
        .from(restaurants)
        .where(eq(restaurants.ownerId, user.userId))
        .limit(1);
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

