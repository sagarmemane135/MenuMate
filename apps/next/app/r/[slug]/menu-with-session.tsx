"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UtensilsCrossed, CheckCircle2, ImageOff, ShoppingCart, Send } from "lucide-react";
import { useCart } from "@menumate/app";
import { CartDrawer } from "@menumate/app";
import { Button } from "@menumate/app";

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
  
  const { addItem, items, clearCart } = useCart();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isSendingOrder, setIsSendingOrder] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Create or get session on mount if table number provided
  useEffect(() => {
    if (tableNumber) {
      const savedToken = localStorage.getItem(`session_${restaurant.slug}_${tableNumber}`);
      if (savedToken) {
        setSessionToken(savedToken);
      } else {
        createSession();
      }
    }
  }, [tableNumber, restaurant.slug]);

  const createSession = async () => {
    if (!tableNumber || isCreatingSession) return;
    
    setIsCreatingSession(true);
    try {
      const response = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          tableNumber,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionToken(data.session.sessionToken);
        localStorage.setItem(`session_${restaurant.slug}_${tableNumber}`, data.session.sessionToken);
      }
    } catch (error) {
      console.error("Session creation error:", error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const sendToKitchen = async () => {
    if (items.length === 0) {
      alert("Please add items to your cart first");
      return;
    }

    if (!customerName || !customerPhone) {
      setShowCustomerForm(true);
      return;
    }

    if (!sessionToken) {
      alert("Please wait, initializing session...");
      return;
    }

    setIsSendingOrder(true);
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          items: items.map((item) => ({
            itemId: item.id,
            quantity: item.quantity,
          })),
          customerName,
          customerPhone,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Order sent to kitchen! Order #${data.order.id.slice(0, 8).toUpperCase()}`);
        clearCart();
        setShowCustomerForm(false);
      } else {
        throw new Error(data.error || "Failed to send order");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert(error instanceof Error ? error.message : "Failed to send order");
    } finally {
      setIsSendingOrder(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {restaurant.name}
                  </h1>
                  {tableNumber && (
                    <p className="text-sm text-orange-600 font-semibold">
                      Table {tableNumber} • Session Active
                    </p>
                  )}
                </div>
              </div>

              {/* Cart Badge */}
              <div className="flex items-center space-x-3">
                <a
                  href={`/bill?session=${sessionToken}`}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  View Bill
                </a>
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {categories.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Menu Coming Soon
              </h2>
              <p className="text-gray-600">
                We're preparing something delicious for you
              </p>
            </div>
          ) : (
            <div className="space-y-12">
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
                    <section key={category.id}>
                      <div className="mb-6">
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-xl shadow-md">
                          <UtensilsCrossed className="w-5 h-5" />
                          <h2 className="text-xl font-bold">{category.name}</h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-orange-400 hover:shadow-xl transition-all duration-300"
                          >
                            {item.imageUrl ? (
                              <div className="relative h-48 bg-gray-100 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute top-3 right-3">
                                  <div className="bg-green-500 text-white p-1.5 rounded-lg shadow-lg">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <ImageOff className="w-12 h-12 text-gray-400" />
                                <div className="absolute top-3 right-3">
                                  <div className="bg-green-500 text-white p-1.5 rounded-lg shadow-lg">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="p-5">
                              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>

                              {item.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-2xl font-bold text-orange-600">
                                    ₹{item.price.toFixed(0)}
                                  </span>
                                </div>

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
                                  className="flex items-center space-x-1"
                                >
                                  <span>Add</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
            </div>
          )}
        </main>

        {/* Fixed Bottom Bar */}
        {items.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-500 shadow-lg z-50">
            <div className="max-w-6xl mx-auto px-4 py-4">
              {showCustomerForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowCustomerForm(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={sendToKitchen}
                      disabled={isSendingOrder || !customerName || !customerPhone}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isSendingOrder ? "Sending..." : "Confirm"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={sendToKitchen}
                  disabled={isSendingOrder}
                  className="w-full h-14 text-lg"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSendingOrder ? "Sending to Kitchen..." : `Send to Kitchen (${items.length} items)`}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <CartDrawer />
    </>
  );
}

