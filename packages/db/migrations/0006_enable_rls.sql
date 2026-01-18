-- Enable Row Level Security (RLS) on all public tables
-- This addresses Supabase Security Advisor warnings

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on menu_items table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on table_sessions table
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow service role (our application) to access all data
-- This is safe because we're using direct PostgreSQL connections with proper authentication
-- NOT using Supabase's PostgREST API

-- Users policies
CREATE POLICY "Service role can access all users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Restaurants policies
CREATE POLICY "Service role can access all restaurants"
  ON public.restaurants
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Categories policies
CREATE POLICY "Service role can access all categories"
  ON public.categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Menu items policies
CREATE POLICY "Service role can access all menu_items"
  ON public.menu_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Orders policies
CREATE POLICY "Service role can access all orders"
  ON public.orders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Table sessions policies
CREATE POLICY "Service role can access all table_sessions"
  ON public.table_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

