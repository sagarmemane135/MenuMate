-- Migration: Add "served" to order_status enum
-- This adds the "served" status to the existing order_status enum type

DO $$ BEGIN
  -- Add "served" to the order_status enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'served' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
  ) THEN
    ALTER TYPE order_status ADD VALUE 'served';
  END IF;
END $$;



