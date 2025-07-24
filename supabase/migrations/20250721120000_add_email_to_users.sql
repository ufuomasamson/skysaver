-- Add email column to users table
ALTER TABLE IF EXISTS users 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update any existing users (if any) from auth.users
UPDATE users
SET email = auth.users.email
FROM auth.users
WHERE users.id = auth.users.id;

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Grant permissions
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
