-- Simple SQL command to set user as admin in Supabase
-- Run this in the Supabase SQL Editor

-- First, check if the user already exists and what metadata they have
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'samsonenzo1111@gmail.com';

-- Set the user as admin with a single command
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'samsonenzo1111@gmail.com';

-- Verify the change was successful
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'samsonenzo1111@gmail.com';
