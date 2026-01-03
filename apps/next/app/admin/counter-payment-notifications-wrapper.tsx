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
  const [error, setError] = useState<string | null>(null);

  console.log("[COUNTER PAYMENT WRAPPER] 🎬 Component mounted");
  console.log("[COUNTER PAYMENT WRAPPER] Props - userId:", userId, "userRole:", userRole);

  useEffect(() => {
    console.log("[COUNTER PAYMENT WRAPPER] 🔄 useEffect triggered");
    
    // Only fetch for restaurant owners
    if (userRole !== "owner") {
      console.log("[COUNTER PAYMENT WRAPPER] ⚠️ User is not an owner, skipping. Role:", userRole);
      setIsLoading(false);
      setError("User is not an owner");
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
          setError(null);
        } else {
          console.warn("[COUNTER PAYMENT WRAPPER] ⚠️ No restaurant found for this owner");
          setError("No restaurant found");
        }
      } catch (error) {
        console.error("[COUNTER PAYMENT WRAPPER] ❌ Failed to fetch restaurant ID:", error);
        setError(String(error));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantId();
  }, [userId, userRole]);

  console.log("[COUNTER PAYMENT WRAPPER] 📊 State - isLoading:", isLoading, "restaurantId:", restaurantId, "error:", error);

  // Show debug info while loading
  if (isLoading) {
    return (
      <div className="fixed bottom-4 left-4 z-[60] bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-mono shadow-lg">
        ⏳ Loading restaurant...
      </div>
    );
  }

  // Show error state
  if (error || !restaurantId) {
    return (
      <div className="fixed bottom-4 left-4 z-[60] bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg max-w-xs">
        <div className="font-bold">❌ Counter Notifications Error</div>
        <div className="mt-1">Role: {userRole}</div>
        <div>User ID: {userId?.substring(0, 8)}...</div>
        <div>Error: {error || "No restaurant ID"}</div>
      </div>
    );
  }

  return <CounterPaymentNotifications restaurantId={restaurantId} />;
}

