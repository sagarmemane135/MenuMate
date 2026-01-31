-- Add UPI ID for restaurant (owner's Google Pay / PhonePe / any UPI)
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "upi_id" varchar(100);

-- Add 'upi' to payment_method enum (for UPI payment flow; owner confirms when received)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'upi'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method')
  ) THEN
    ALTER TYPE "payment_method" ADD VALUE 'upi';
  END IF;
END
$$;
