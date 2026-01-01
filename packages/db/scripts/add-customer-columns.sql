-- Migration: Add customer_name and customer_phone columns to table_sessions
-- Run this migration on your Supabase database

ALTER TABLE table_sessions
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15);

-- Add comments for documentation
COMMENT ON COLUMN table_sessions.customer_name IS 'Customer name for the session';
COMMENT ON COLUMN table_sessions.customer_phone IS 'Customer phone number for the session';

