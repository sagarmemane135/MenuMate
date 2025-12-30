import { getCurrentUser } from "@/lib/auth";
import { db, restaurants, categories, menuItems, eq } from "@menumate/db";
import { redirect } from "next/navigation";
import { MenuPageClient } from "./menu-page-client";

export default async function MenuPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "super_admin") {
    redirect("/admin");
  }

  // Get restaurant
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.ownerId, user.userId))
    .limit(1);

  if (!restaurant) {
    return (
      <div className="px-4 py-6">
        <p className="text-gray-600">No restaurant found</p>
      </div>
    );
  }

  // Get categories with menu items
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id));
  
  // Sort by sortOrder
  const sortedCategories = allCategories.sort((a, b) => a.sortOrder - b.sortOrder);

  const allMenuItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));

  const categoriesWithItems = sortedCategories.map((category) => ({
    ...category,
    menuItems: allMenuItems.filter((item) => item.categoryId === category.id),
  }));

  return (
    <MenuPageClient
      restaurantId={restaurant.id}
      initialCategories={categoriesWithItems}
    />
  );
}
