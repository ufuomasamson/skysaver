-- Simple direct SQL commands to add email column to users table
-- Run these commands one by one in Supabase SQL editor or dashboard

-- 1. First, add the email column if it doesn't exist
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Make it unique (if possible - this might fail if there are duplicate emails)
ALTER TABLE IF EXISTS public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS public.users ADD CONSTRAINT users_email_key UNIQUE (email);

-- 3. Create an index on the email column
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4. Update email values from auth.users
UPDATE public.users
SET email = auth.users.email
FROM auth.users
WHERE public.users.id = auth.users.id
AND (public.users.email IS NULL OR public.users.email = '');

-- 5. If the users table doesn't exist at all, run this to create it:
/*
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'user'
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view their own data" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);
*/
