import { pgEnum, pgTable, uuid, text, timestamp, boolean, integer, decimal, index, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum Types
export const userRoleEnum = pgEnum("user_role", ["super_admin", "owner", "staff"]);
export const userStatusEnum = pgEnum("user_status", ["pending", "approved", "rejected"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "cooking", "ready", "served", "paid", "cancelled"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "closed", "paid"]);
export const paymentMethodEnum = pgEnum("payment_method", ["online", "counter", "split", "pending"]);

// Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").default("owner").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  statusIdx: index("users_status_idx").on(table.status),
}));

// Restaurants Table
export const restaurants = pgTable("restaurants", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  slugIdx: index("restaurants_slug_idx").on(table.slug),
  ownerIdx: index("restaurants_owner_idx").on(table.ownerId),
}));

// Categories Table
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
}, (table) => ({
  restaurantIdx: index("categories_restaurant_idx").on(table.restaurantId),
}));

// Menu Items Table
export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true).notNull(),
}, (table) => ({
  categoryIdx: index("menu_items_category_idx").on(table.categoryId),
  restaurantIdx: index("menu_items_restaurant_idx").on(table.restaurantId),
}));

// Table Sessions
export const tableSessions = pgTable("table_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  tableNumber: varchar("table_number", { length: 20 }).notNull(),
  sessionToken: varchar("session_token", { length: 100 }).notNull().unique(),
  status: sessionStatusEnum("status").default("active").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("pending"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentId: varchar("payment_id", { length: 100 }),
  customerName: varchar("customer_name", { length: 100 }),
  customerPhone: varchar("customer_phone", { length: 15 }),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  restaurantIdx: index("sessions_restaurant_idx").on(table.restaurantId),
  tokenIdx: index("sessions_token_idx").on(table.sessionToken),
  statusIdx: index("sessions_status_idx").on(table.status),
}));

// Orders Table
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  restaurantId: uuid("restaurant_id").notNull().references(() => restaurants.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => tableSessions.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 100 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 15 }).notNull(),
  tableNumber: varchar("table_number", { length: 20 }),
  items: jsonb("items").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  isPaid: boolean("is_paid").default(false).notNull(),
  paymentId: varchar("payment_id", { length: 100 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  restaurantIdx: index("orders_restaurant_idx").on(table.restaurantId),
  sessionIdx: index("orders_session_idx").on(table.sessionId),
  statusIdx: index("orders_status_idx").on(table.status),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, {
    fields: [restaurants.ownerId],
    references: [users.id],
  }),
  categories: many(categories),
  menuItems: many(menuItems),
  orders: many(orders),
  tableSessions: many(tableSessions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id],
  }),
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id],
  }),
}));

export const tableSessionsRelations = relations(tableSessions, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tableSessions.restaurantId],
    references: [restaurants.id],
  }),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  session: one(tableSessions, {
    fields: [orders.sessionId],
    references: [tableSessions.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type TableSession = typeof tableSessions.$inferSelect;
export type NewTableSession = typeof tableSessions.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
