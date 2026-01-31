"use client";

import { usePathname } from "next/navigation";
import { SubscriptionExpiredContent } from "./subscription-expired/subscription-expired-content";
import { PayAtCounterBanner } from "./pay-at-counter-banner";

interface AdminLayoutWrapperProps {
  userRole: string;
  restaurantActive: boolean | null;
  children: React.ReactNode;
}

/**
 * For owners with inactive restaurant, show subscription-expired content
 * instead of redirecting (avoids NEXT_REDIRECT console error in dev).
 * Pay-at-counter banner shows on all admin pages for owners until dismissed or marked paid.
 */
export function AdminLayoutWrapper({
  userRole,
  restaurantActive,
  children,
}: AdminLayoutWrapperProps) {
  const pathname = usePathname();

  const isSubscriptionExpiredPage = pathname === "/admin/subscription-expired";
  const isOwnerWithInactiveRestaurant =
    userRole === "owner" && restaurantActive === false;

  if (!isSubscriptionExpiredPage && isOwnerWithInactiveRestaurant) {
    return <SubscriptionExpiredContent />;
  }

  return (
    <>
      {userRole === "owner" && <PayAtCounterBanner />}
      {children}
    </>
  );
}
