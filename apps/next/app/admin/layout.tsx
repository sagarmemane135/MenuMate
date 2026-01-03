import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "./nav";
import { CounterPaymentNotificationsWrapper } from "./counter-payment-notifications-wrapper";

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

    return (
      <div className="min-h-screen bg-neutral-50">
        <AdminNav userRole={user.role} userEmail={user.email} />

        <main className="lg:pl-64">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Counter Payment Notifications - Persistent and visible across all admin pages */}
        {user.role === "owner" && <CounterPaymentNotificationsWrapper />}
      </div>
    );
  } catch (error) {
    console.error("AdminLayout error:", error);
    redirect("/login");
  }
}

