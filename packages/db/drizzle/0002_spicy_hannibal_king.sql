DO $$ BEGIN
 CREATE TYPE "payment_method" AS ENUM('online', 'counter', 'split', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "session_status" AS ENUM('active', 'closed', 'paid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "table_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"table_number" varchar(20) NOT NULL,
	"session_token" varchar(100) NOT NULL,
	"status" "session_status" DEFAULT 'active' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'pending',
	"payment_status" varchar(20) DEFAULT 'pending',
	"payment_id" varchar(100),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	CONSTRAINT "table_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
ALTER TABLE "menu_items" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_restaurant_idx" ON "table_sessions" ("restaurant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "table_sessions" ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_status_idx" ON "table_sessions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_session_idx" ON "orders" ("session_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_table_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "table_sessions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
