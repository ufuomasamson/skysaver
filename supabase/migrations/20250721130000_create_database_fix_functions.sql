-- Create function to create users table if it doesn't exist
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  -- Create users table with essential columns
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role TEXT DEFAULT 'user'
  );
  
  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  
  -- Enable RLS
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  
  -- Create policies
  DROP POLICY IF EXISTS "Users can view their own data" ON users;
  CREATE POLICY "Users can view their own data" 
    ON users FOR SELECT 
    USING (auth.uid() = id);
  
  DROP POLICY IF EXISTS "Users can update their own data" ON users;
  CREATE POLICY "Users can update their own data" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);
    
  DROP POLICY IF EXISTS "Admin can view all data" ON users;
  CREATE POLICY "Admin can view all data" 
    ON users FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
      )
    );
  
  -- Add trigger to sync with auth.users
  CREATE OR REPLACE FUNCTION public.handle_new_user() 
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE
    SET email = NEW.email,
        full_name = NEW.raw_user_meta_data->>'full_name',
        updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    
  -- Sync existing auth users
  INSERT INTO public.users (id, email, full_name)
  SELECT id, email, raw_user_meta_data->>'full_name'
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Function to add email column if it doesn't exist
CREATE OR REPLACE FUNCTION add_email_to_users()
RETURNS void AS $$
BEGIN
  -- Add email column if not exists
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
  
  -- Create index for email column
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  
  -- Update email values from auth.users
  UPDATE public.users
  SET email = auth.users.email
  FROM auth.users
  WHERE public.users.id = auth.users.id
  AND public.users.email IS NULL;
END;
$$ LANGUAGE plpgsql;
