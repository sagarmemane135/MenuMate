import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubscriptionsPageClient } from "./subscriptions-page-client";

export default async function SubscriptionsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    redirect("/admin");
  }

  return (
    <div className="px-4 py-6">
      <SubscriptionsPageClient />
    </div>
  );
}
