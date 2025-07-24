-- SQL script to check and test Row Level Security (RLS) policies in Supabase
-- This script helps identify if RLS policies are working correctly and diagnose issues

-- 1. List all tables with RLS enabled
SELECT
  table_schema,
  table_name,
  row_security
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
  AND row_security = true
ORDER BY
  table_name;

-- 2. List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  schemaname = 'public'
ORDER BY
  tablename, policyname;

-- 3. Test admin user access to flights table
-- Replace 'admin_user_id' with an actual admin user UUID from your users table
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'admin_user_id';
SELECT count(*) FROM flights;
RESET role;

-- 4. Test regular user access to flights table
-- Replace 'regular_user_id' with an actual regular user UUID from your users table
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'regular_user_id';
SELECT count(*) FROM flights;
RESET role;

-- 5. Test service role access (should bypass RLS)
SET LOCAL role service_role;
SELECT count(*) FROM flights;
RESET role;

-- 6. Test the specific RLS policy for admin access to users table
-- Replace 'admin_user_id' with an actual admin user UUID from your users table
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'admin_user_id';
SELECT count(*) FROM users;
RESET role;

-- 7. Test non-admin access to users table
-- Replace 'regular_user_id' with an actual regular user UUID from your users table
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'regular_user_id';
SELECT count(*) FROM users;
RESET role;

-- 8. Verify admin user in the database
-- Replace 'admin@example.com' with the email of your admin user
SELECT id, email, role FROM users WHERE email = 'admin@example.com';
