-- Add subscription tier enum and fields to users table
CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'enterprise');

ALTER TABLE "users" 
ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
ADD COLUMN "subscription_expires_at" timestamp;

CREATE INDEX "users_subscription_idx" ON "users" ("subscription_tier");

-- Give existing users free tier
UPDATE "users" SET "subscription_tier" = 'free' WHERE "subscription_tier" IS NULL;

