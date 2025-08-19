-- Direct SQL command to add email column to users table

-- First, check if the users table exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Table exists, add email column if it doesn't exist
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
    
    -- Make email column unique (if not already)
    BEGIN
      ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    EXCEPTION 
      WHEN duplicate_table THEN
        -- Constraint already exists, do nothing
    END;
    
    -- Create index for email column
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    
    -- Update email values from auth.users
    UPDATE public.users
    SET email = auth.users.email
    FROM auth.users
    WHERE public.users.id = auth.users.id
    AND (public.users.email IS NULL OR public.users.email = '');
    
    RAISE NOTICE 'Email column added to users table';
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      email TEXT UNIQUE,
      full_name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      role TEXT DEFAULT 'user'
    );
    
    -- Create index
    CREATE INDEX idx_users_email ON public.users(email);
    
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    CREATE POLICY "Users can view their own data" 
      ON public.users FOR SELECT 
      USING (auth.uid() = id);
    
    CREATE POLICY "Users can update their own data" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id);
    
    -- Copy data from auth.users if any exists
    INSERT INTO public.users (id, email, full_name)
    SELECT id, email, raw_user_meta_data->>'full_name'
    FROM auth.users
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Users table created with email column';
  END IF;
END $$;
