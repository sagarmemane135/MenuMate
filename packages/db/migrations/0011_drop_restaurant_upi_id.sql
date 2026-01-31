-- Remove UPI ID column from restaurants (Pay via UPI feature removed)
ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "upi_id";
