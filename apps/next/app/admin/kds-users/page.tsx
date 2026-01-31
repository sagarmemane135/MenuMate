import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KdsUsersPageClient } from "./kds-users-page-client";

export default async function KdsUsersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "owner") {
    redirect("/admin");
  }

  return (
    <div className="px-4 py-6">
      <KdsUsersPageClient />
    </div>
  );
}
