-- Platform settings for super admin (Pro plan price, currency, etc.)
CREATE TABLE IF NOT EXISTS "platform_settings" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "value" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Seed default Pro plan config
INSERT INTO "platform_settings" ("key", "value", "updated_at") VALUES
  ('pro_plan_price', '999', now()),
  ('pro_plan_currency', 'INR', now()),
  ('pro_plan_interval', 'month', now()),
  ('pro_plan_name', 'Pro Plan', now())
ON CONFLICT ("key") DO NOTHING;
