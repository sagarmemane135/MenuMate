import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50">
      <AdminNav userRole={user.role} userEmail={user.email} />

      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

