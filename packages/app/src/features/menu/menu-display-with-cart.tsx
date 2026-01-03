"use client";

import { UtensilsCrossed, CheckCircle2, ImageOff, ShoppingCart, Plus } from "lucide-react";
import { useCart } from "../../context/cart-context";
import { CartDrawer } from "./cart-drawer";
import { Button } from "../../ui/button";

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

interface MenuDisplayProps {
  restaurant: {
    name: string;
    slug: string;
    isActive: boolean;
  };
  categories: Category[];
  menuItems: MenuItem[];
}

export function MenuDisplayWithCart({ restaurant, categories, menuItems }: MenuDisplayProps) {
  const { addItem, totalItems, openCart } = useCart();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br neutral-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br primary-600 flex items-center justify-center shadow-lg">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {restaurant.name}
                  </h1>
                  <p className="text-sm text-gray-600">Explore our menu</p>
                </div>
              </div>

              {/* Cart Button */}
              <button
                onClick={openCart}
                className="relative p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-all"
              >
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
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
                      {/* Category Header */}
                      <div className="mb-6">
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r primary-600 text-white px-5 py-2 rounded-xl shadow-md">
                          <UtensilsCrossed className="w-5 h-5" />
                          <h2 className="text-xl font-bold">{category.name}</h2>
                        </div>
                      </div>

                      {/* Menu Items Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-primary-400 hover:shadow-xl transition-all duration-300"
                          >
                            {/* Item Image */}
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

                            {/* Item Details */}
                            <div className="p-5">
                              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">
                                {item.name}
                              </h3>

                              {item.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-baseline space-x-1">
                                  <span className="text-2xl font-bold text-primary-700">
                                    ₹{item.price.toFixed(0)}
                                  </span>
                                  {item.price % 1 !== 0 && (
                                    <span className="text-base font-medium text-primary-600">
                                      .{item.price.toFixed(2).split(".")[1]}
                                    </span>
                                  )}
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
                                  <Plus className="w-4 h-4" />
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

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
              <UtensilsCrossed className="w-5 h-5 text-primary-600" />
              <p className="text-sm">
                Powered by{" "}
                <span className="font-semibold text-primary-700">MenuMate</span>
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Digital menu management for modern restaurants
            </p>
          </div>
        </footer>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}

