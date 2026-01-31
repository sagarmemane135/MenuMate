-- Restaurant staff (KDS users): staff can only access Kitchen and update order status
CREATE TABLE IF NOT EXISTS "restaurant_staff" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "restaurant_id" uuid NOT NULL REFERENCES "restaurants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "restaurant_staff_restaurant_idx" ON "restaurant_staff" ("restaurant_id");
CREATE INDEX IF NOT EXISTS "restaurant_staff_user_idx" ON "restaurant_staff" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurant_staff_user_unique" ON "restaurant_staff" ("user_id");
