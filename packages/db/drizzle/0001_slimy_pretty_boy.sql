ALTER TABLE "orders" ALTER COLUMN "table_number" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "table_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar(15) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "items" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" varchar(100);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" varchar(20) DEFAULT 'pending';