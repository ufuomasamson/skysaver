-- SQL command to set a user as admin in Supabase
-- Replace 'samsonenzo1111@gmail.com' with your email if different

-- Get the user's UUID and update their metadata
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO user_id
  FROM auth.users 
  WHERE email = 'samsonenzo1111@gmail.com';
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email samsonenzo1111@gmail.com not found';
  END IF;
  
  -- Update the user's metadata to set role=admin
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
      ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
    END
  WHERE id = user_id;
  
  -- Make sure the users table has the admin role too (if it exists)
  BEGIN
    INSERT INTO public.users (id, email, role, updated_at)
    VALUES (
      user_id, 
      'samsonenzo1111@gmail.com', 
      'admin', 
      now()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = now();
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE 'Table "users" does not exist, skipping this step';
  END;

  -- Also update the user_roles table if it exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    BEGIN
      INSERT INTO public.user_roles (user_id, role, updated_at)
      VALUES (
        user_id, 
        'admin', 
        now()
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        role = 'admin',
        updated_at = now();
    EXCEPTION
      WHEN undefined_column THEN
        RAISE NOTICE 'Column "user_id" in table "user_roles" might be named differently, skipping';
    END;
  END IF;
  
  RAISE NOTICE 'Admin role has been set for samsonenzo1111@gmail.com';
END $$;

-- Output confirmation message
SELECT 'Admin role has been set for samsonenzo1111@gmail.com' as result;

-- After running this, you can verify with:
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'samsonenzo1111@gmail.com';
