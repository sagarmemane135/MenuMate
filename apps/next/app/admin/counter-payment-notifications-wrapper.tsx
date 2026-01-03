"use client";

import { useEffect, useState } from "react";
import { CounterPaymentNotifications } from "./counter-payment-notifications";

interface CounterPaymentNotificationsWrapperProps {
  userId: string;
  userRole: string;
}

export function CounterPaymentNotificationsWrapper({ 
  userId, 
  userRole 
}: CounterPaymentNotificationsWrapperProps) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only fetch for restaurant owners
    if (userRole !== "owner") {
      console.log("[COUNTER PAYMENT WRAPPER] ⚠️ User is not an owner, skipping");
      setIsLoading(false);
      return;
    }

    // Fetch restaurant ID for the owner
    const fetchRestaurantId = async () => {
      try {
        console.log("[COUNTER PAYMENT WRAPPER] 🔍 Fetching restaurant for owner:", userId);
        const response = await fetch(`/api/restaurants?ownerId=${userId}`);
        const data = await response.json();
        
        console.log("[COUNTER PAYMENT WRAPPER] API response:", data);
        
        if (data.success && data.data && data.data.length > 0) {
          const restaurantId = data.data[0].id;
          console.log("[COUNTER PAYMENT WRAPPER] ✅ Restaurant ID found:", restaurantId);
          setRestaurantId(restaurantId);
        } else {
          console.warn("[COUNTER PAYMENT WRAPPER] ⚠️ No restaurant found for this owner");
        }
      } catch (error) {
        console.error("[COUNTER PAYMENT WRAPPER] ❌ Failed to fetch restaurant ID:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantId();
  }, [userId, userRole]);

  if (isLoading || !restaurantId) {
    return null;
  }

  return <CounterPaymentNotifications restaurantId={restaurantId} />;
}

