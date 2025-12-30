import { db, restaurants, categories, menuItems, eq } from "@menumate/db";
import { MenuWithSession } from "./menu-with-session";
import { notFound } from "next/navigation";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Get restaurant by slug
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug))
    .limit(1);

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  // Get categories with menu items
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id))
    .orderBy(categories.sortOrder);

  const allMenuItems = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurant.id));

  return (
    <MenuWithSession
      restaurant={{
        name: restaurant.name,
        slug: restaurant.slug,
        isActive: restaurant.isActive,
      }}
      categories={allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
      }))}
      menuItems={allMenuItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        available: item.isAvailable,
        categoryId: item.categoryId,
        sortOrder: item.sortOrder,
      }))}
    />
  );
}


