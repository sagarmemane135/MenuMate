import { db, restaurants, categories, menuItems, eq } from "@menumate/db";
import { MenuDisplay } from "@menumate/app";
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

  const categoriesWithItems = allCategories.map((category) => ({
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
    menuItems: allMenuItems
      .filter((item) => item.categoryId === category.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        isAvailable: item.isAvailable,
      })),
  }));

  return (
    <MenuDisplay restaurantName={restaurant.name} categories={categoriesWithItems} />
  );
}


