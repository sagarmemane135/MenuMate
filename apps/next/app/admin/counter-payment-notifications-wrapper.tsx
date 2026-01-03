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
        const response = await fetch("/api/user/me");
        const data = await response.json();
        
        if (data.success && data.user.restaurantId) {
          setRestaurantId(data.user.restaurantId);
        }
      } catch (error) {
        console.error("Failed to fetch restaurant ID:", error);
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

