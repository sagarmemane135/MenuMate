# Database Migration: Add Customer Columns

## Problem
The `table_sessions` table is missing the `customer_name` and `customer_phone` columns that are defined in the schema.

## Solution

### Option 1: Run Migration Script (Recommended)

1. Set your Supabase DATABASE_URL:
   ```bash
   export DATABASE_URL="your-supabase-connection-string"
   ```

2. Run the migration script:
   ```bash
   cd packages/db
   npm run migrate:customer-columns
   ```

### Option 2: Run SQL Directly in Supabase

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
ALTER TABLE table_sessions
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(15);
```

### Option 3: Use Drizzle Kit Push

1. Set DATABASE_URL to your Supabase connection string
2. Run:
   ```bash
   cd packages/db
   npm run migrate
   ```

## Verification

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'table_sessions' 
AND column_name IN ('customer_name', 'customer_phone');
```

You should see both columns listed.

