"use client";

import { useEffect, useState } from "react";
import { CounterPaymentNotifications } from "./counter-payment-notifications";

export function CounterPaymentNotificationsWrapper() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch restaurant ID for the owner
    const fetchRestaurantId = async () => {
      try {
        console.log("[COUNTER PAYMENT WRAPPER] 🔍 Fetching restaurant ID...");
        const response = await fetch("/api/user/me");
        const data = await response.json();
        
        console.log("[COUNTER PAYMENT WRAPPER] API response:", data);
        
        if (data.success && data.user.restaurantId) {
          console.log("[COUNTER PAYMENT WRAPPER] ✅ Restaurant ID found:", data.user.restaurantId);
          setRestaurantId(data.user.restaurantId);
        } else {
          console.warn("[COUNTER PAYMENT WRAPPER] ⚠️ No restaurant ID in response");
        }
      } catch (error) {
        console.error("[COUNTER PAYMENT WRAPPER] ❌ Failed to fetch restaurant ID:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantId();
  }, []);

  if (isLoading || !restaurantId) {
    return null;
  }

  return <CounterPaymentNotifications restaurantId={restaurantId} />;
}

