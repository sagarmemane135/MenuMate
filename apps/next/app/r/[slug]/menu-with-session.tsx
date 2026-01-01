"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UtensilsCrossed, CheckCircle2, ImageOff, ShoppingCart, Send, Plus, Minus, X, Receipt } from "lucide-react";
import { useCart, useToast } from "@menumate/app";
import { CartDrawer } from "@menumate/app";
import { Button } from "@menumate/app";
import { usePusherChannel } from "@/lib/pusher-client";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  categoryId: string;
  sortOrder: number;
}

interface MenuWithSessionProps {
  restaurant: {
    name: string;
    slug: string;
    isActive: boolean;
  };
  categories: Category[];
  menuItems: MenuItem[];
}

export function MenuWithSession({ restaurant, categories, menuItems }: MenuWithSessionProps) {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("table");
  
  const { addItem, items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { showToast } = useToast();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showCart, setShowCart] = useState(false);

  // Create or get session on mount if table number provided
  useEffect(() => {
    console.log("[CLIENT] useEffect - Session initialization");
    console.log("[CLIENT] useEffect - tableNumber:", tableNumber, "restaurant.slug:", restaurant.slug);
    
    if (tableNumber && typeof window !== "undefined") {
      const storageKey = `session_${restaurant.slug}_${tableNumber}`;
      console.log("[CLIENT] useEffect - Checking localStorage for key:", storageKey);
      
      const savedToken = localStorage.getItem(storageKey);
      console.log("[CLIENT] useEffect - Saved token found:", savedToken ? savedToken.substring(0, 8) + "..." : "null");
      
      if (savedToken) {
        console.log("[CLIENT] useEffect - Using saved token");
        setSessionToken(savedToken);
      } else {
        console.log("[CLIENT] useEffect - No saved token, creating new session");
        createSession();
      }
    } else {
      console.log("[CLIENT] useEffect - Skipping session creation - tableNumber:", tableNumber, "window:", typeof window);
    }
  }, [tableNumber, restaurant.slug]);

  // Listen for order status updates via WebSocket
  usePusherChannel(
    sessionToken ? `session-${sessionToken}` : null,
    "order:status:updated",
    (data: unknown) => {
      const eventData = data as { orderId: string; status: string };
      const statusMessages: Record<string, string> = {
        cooking: "Your order is being prepared! 👨‍🍳",
        ready: "Your order is ready! 🎉",
        paid: "Payment received! Thank you! ✅",
      };

      if (statusMessages[eventData.status]) {
        showToast(statusMessages[eventData.status], "info");
      }
    }
  );

  const createSession = async () => {
    console.log("[CLIENT] createSession called - tableNumber:", tableNumber, "isCreatingSession:", isCreatingSession);
    
    if (!tableNumber || isCreatingSession) {
      console.log("[CLIENT] createSession aborted - tableNumber:", tableNumber, "isCreatingSession:", isCreatingSession);
      return;
    }
    
    setIsCreatingSession(true);
    console.log("[CLIENT] Starting session creation - restaurantSlug:", restaurant.slug, "tableNumber:", tableNumber);
    
    try {
      const requestBody = {
        restaurantSlug: restaurant.slug,
        tableNumber,
      };
      console.log("[CLIENT] Sending session creation request:", JSON.stringify(requestBody));
      
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[CLIENT] Session creation response status:", response.status, "ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[CLIENT] Session creation failed - status:", response.status, "error:", errorData);
        throw new Error(errorData.error || "Failed to create session");
      }

      const data = await response.json();
      console.log("[CLIENT] Session creation response data:", {
        success: data.success,
        hasSession: !!data.session,
        sessionTokenPreview: data.session?.sessionToken?.substring(0, 8) + "...",
        tableNumber: data.session?.tableNumber
      });

      if (data.success && data.session?.sessionToken) {
        console.log("[CLIENT] Session created successfully, setting token");
        setSessionToken(data.session.sessionToken);
        if (typeof window !== "undefined") {
          try {
            const storageKey = `session_${restaurant.slug}_${tableNumber}`;
            window.localStorage.setItem(storageKey, data.session.sessionToken);
            console.log("[CLIENT] Session token saved to localStorage with key:", storageKey);
          } catch (e) {
            console.warn("[CLIENT] Failed to save session to localStorage:", e);
          }
        }
      } else {
        console.error("[CLIENT] Invalid response format - success:", data.success, "hasSession:", !!data.session, "hasToken:", !!data.session?.sessionToken);
        throw new Error(data.error || "Failed to create session");
      }
    } catch (error) {
      console.error("[CLIENT] Session creation error:", error);
      console.error("[CLIENT] Error details:", error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error);
      showToast(
        error instanceof Error ? error.message : "Failed to create session",
        "error"
      );
    } finally {
      setIsCreatingSession(false);
      console.log("[CLIENT] createSession completed");
    }
  };

  const sendToKitchen = async () => {
    console.log("[CLIENT] sendToKitchen called");
    console.log("[CLIENT] Current state - items:", items.length, "customerName:", customerName, "customerPhone:", customerPhone, "sessionToken:", sessionToken ? sessionToken.substring(0, 8) + "..." : "null", "tableNumber:", tableNumber);
    
    if (items.length === 0) {
      console.log("[CLIENT] sendToKitchen aborted - cart is empty");
      showToast("Please add items to your cart first", "warning");
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      console.log("[CLIENT] sendToKitchen - showing customer form");
      setShowCustomerForm(true);
      return;
    }

    // If no session token, create one first
    let token: string | null = sessionToken;
    console.log("[CLIENT] sendToKitchen - current token:", token ? token.substring(0, 8) + "..." : "null");
    
    if (!token && tableNumber) {
      console.log("[CLIENT] sendToKitchen - No token, creating session first");
      setIsSendingOrder(true);
      showToast("Creating session...", "info");
      try {
        const requestBody = {
          restaurantSlug: restaurant.slug,
          tableNumber,
        };
        console.log("[CLIENT] sendToKitchen - Creating session with:", JSON.stringify(requestBody));
        
        const sessionResponse = await fetch("/api/sessions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        console.log("[CLIENT] sendToKitchen - Session creation response status:", sessionResponse.status, "ok:", sessionResponse.ok);

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          console.error("[CLIENT] sendToKitchen - Session creation failed:", errorData);
          throw new Error(errorData.error || "Failed to create session");
        }

        const sessionData = await sessionResponse.json();
        console.log("[CLIENT] sendToKitchen - Session creation response:", {
          success: sessionData.success,
          hasSession: !!sessionData.session,
          sessionTokenPreview: sessionData.session?.sessionToken?.substring(0, 8) + "...",
          tableNumber: sessionData.session?.tableNumber
        });

        if (sessionData.success && sessionData.session?.sessionToken) {
          token = sessionData.session.sessionToken;
          console.log("[CLIENT] sendToKitchen - Session created, token:", token.substring(0, 8) + "...");
          setSessionToken(token);
          if (tableNumber && token && typeof window !== "undefined") {
            try {
              const storageKey = `session_${restaurant.slug}_${tableNumber}`;
              window.localStorage.setItem(storageKey, token);
              console.log("[CLIENT] sendToKitchen - Token saved to localStorage:", storageKey);
            } catch (e) {
              console.warn("[CLIENT] sendToKitchen - Failed to save to localStorage:", e);
            }
          }
        } else {
          console.error("[CLIENT] sendToKitchen - Invalid session response:", sessionData);
          throw new Error(sessionData.error || "Failed to create session");
        }
      } catch (error) {
        console.error("[CLIENT] sendToKitchen - Session creation error:", error);
        console.error("[CLIENT] sendToKitchen - Error details:", error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error);
        showToast(
          error instanceof Error ? error.message : "Failed to create session",
          "error"
        );
        setIsSendingOrder(false);
        return;
      }
    }

    if (!token) {
      console.error("[CLIENT] sendToKitchen - No token available after creation attempt");
      showToast("Unable to create session. Please refresh the page.", "error");
      setIsSendingOrder(false);
      return;
    }

    console.log("[CLIENT] sendToKitchen - Proceeding with order creation, token:", token.substring(0, 8) + "...");
    setIsSendingOrder(true);
    try {
      const orderBody = {
        sessionToken: token,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      };
      console.log("[CLIENT] sendToKitchen - Creating order with:", {
        sessionToken: token.substring(0, 8) + "...",
        itemsCount: orderBody.items.length,
        customerName: orderBody.customerName,
        customerPhone: orderBody.customerPhone
      });

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });

      console.log("[CLIENT] sendToKitchen - Order creation response status:", response.status, "ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[CLIENT] sendToKitchen - Order creation failed:", errorData);
        throw new Error(errorData.error || "Failed to send order");
      }

      const data = await response.json();
      console.log("[CLIENT] sendToKitchen - Order creation response:", {
        success: data.success,
        orderId: data.order?.id
      });

      if (data.success) {
        console.log("[CLIENT] sendToKitchen - Order created successfully!");
        showToast(
          `Order sent to kitchen! Order #${data.order.id.slice(0, 8).toUpperCase()}`,
          "success"
        );
        clearCart();
        setShowCustomerForm(false);
        setCustomerName("");
        setCustomerPhone("");
        setShowCart(false);
      } else {
        console.error("[CLIENT] sendToKitchen - Order creation returned success:false");
        throw new Error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("[CLIENT] sendToKitchen - Order creation error:", error);
      console.error("[CLIENT] sendToKitchen - Error details:", error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error);
      showToast(
        error instanceof Error ? error.message : "Failed to send order",
        "error"
      );
    } finally {
      setIsSendingOrder(false);
      console.log("[CLIENT] sendToKitchen completed");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-24">
        {/* Compact Mobile Header */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm sticky top-0 z-40">
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-bold text-gray-900 truncate">
                    {restaurant.name}
                  </h1>
                  {tableNumber && (
                    <p className="text-[10px] text-orange-600 font-medium">
                      Table {tableNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {sessionToken && (
                  <a
                    href={`/bill?session=${sessionToken}`}
                    className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                    title="View Bill"
                  >
                    <Receipt className="w-5 h-5 text-orange-600" />
                  </a>
                )}
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {items.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Mobile Optimized */}
        <main className="px-3 py-4">
          {categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mt-4">
              <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Menu Coming Soon
              </h2>
              <p className="text-sm text-gray-600">
                We're preparing something delicious for you
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((category) => {
                  const categoryItems = menuItems
                    .filter(
                      (item) => item.categoryId === category.id && item.available
                    )
                    .sort((a, b) => a.sortOrder - b.sortOrder);

                  if (categoryItems.length === 0) return null;

                  return (
                    <section key={category.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent flex-1" />
                        <h2 className="text-lg font-bold text-gray-900 px-3 py-1 bg-white rounded-full border border-orange-200 shadow-sm">
                          {category.name}
                        </h2>
                        <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent flex-1" />
                      </div>

                      <div className="space-y-3">
                        {categoryItems.map((item) => {
                          const cartItem = items.find((i) => i.id === item.id);
                          const quantity = cartItem?.quantity || 0;

                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
                            >
                              <div className="flex gap-3 p-3">
                                {item.imageUrl ? (
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute top-1 right-1">
                                      <div className="bg-green-500 text-white p-1 rounded shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                    <ImageOff className="w-8 h-8 text-gray-400" />
                                    <div className="absolute top-1 right-1">
                                      <div className="bg-green-500 text-white p-1 rounded shadow-sm">
                                        <CheckCircle2 className="w-3 h-3" />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
                                      {item.name}
                                    </h3>
                                    {item.description && (
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-base font-bold text-orange-600">
                                      ₹{item.price.toFixed(0)}
                                    </span>

                                    {quantity > 0 ? (
                                      <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-2 py-1">
                                        <button
                                          onClick={() => updateQuantity(item.id, quantity - 1)}
                                          className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Minus className="w-3 h-3 text-orange-600" />
                                        </button>
                                        <span className="text-sm font-bold text-orange-600 w-6 text-center">
                                          {quantity}
                                        </span>
                                        <button
                                          onClick={() => updateQuantity(item.id, quantity + 1)}
                                          className="w-6 h-6 rounded-full bg-white border border-orange-200 flex items-center justify-center active:scale-90 transition-transform"
                                        >
                                          <Plus className="w-3 h-3 text-orange-600" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() =>
                                          addItem({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            imageUrl: item.imageUrl,
                                          })
                                        }
                                        size="sm"
                                        className="text-xs px-3 py-1.5 h-auto"
                                      >
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
            </div>
          )}
        </main>

        {/* Mobile Cart Drawer */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Order</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">Your cart is empty</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-xl p-3 flex items-center gap-3"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          ₹{item.price.toFixed(0)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center active:scale-90"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center active:scale-90"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-4 border-t border-gray-200 space-y-3">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">₹{totalPrice.toFixed(0)}</span>
                  </div>
                  {!showCustomerForm ? (
                    <Button
                      onClick={sendToKitchen}
                      disabled={isSendingOrder || isCreatingSession}
                      className="w-full h-12 text-base font-semibold"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSendingOrder
                        ? "Sending..."
                        : isCreatingSession
                        ? "Initializing..."
                        : "Send to Kitchen"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Your Name *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        required
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number *"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        required
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowCustomerForm(false);
                            setCustomerName("");
                            setCustomerPhone("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={sendToKitchen}
                          disabled={isSendingOrder || !customerName.trim() || !customerPhone.trim()}
                          className="flex-1"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSendingOrder ? "Sending..." : "Confirm"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Bottom Button - Mobile Only */}
        {items.length > 0 && !showCart && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-500 shadow-2xl z-40 safe-area-inset-bottom">
            <div className="px-4 py-3">
              <Button
                onClick={() => {
                  if (!customerName.trim() || !customerPhone.trim()) {
                    setShowCustomerForm(true);
                    setShowCart(true);
                  } else {
                    sendToKitchen();
                  }
                }}
                disabled={isSendingOrder || isCreatingSession}
                className="w-full h-12 text-base font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSendingOrder
                  ? "Sending to Kitchen..."
                  : isCreatingSession
                  ? "Initializing..."
                  : `Send to Kitchen (₹${totalPrice.toFixed(0)})`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <CartDrawer />
    </>
  );
}
