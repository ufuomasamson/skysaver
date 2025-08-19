-- SQL script to add storage policies for payment proofs

-- Create storage bucket for payment proofs if it doesn't exist
-- This assumes you have already created the unit-bucket in Supabase UI
-- If not, create it first via the Supabase dashboard

-- Add storage policies for payment proofs
-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to payment proofs" ON storage.objects;

-- Create policy for file uploads (authenticated users can upload)
CREATE POLICY "Allow authenticated uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'unit-bucket');

-- Create policy for file viewing
CREATE POLICY "Allow public access to payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'unit-bucket');

-- Add policy for users to delete their own files (optional)
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;
CREATE POLICY "Allow users to delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'unit-bucket' AND (auth.uid() = owner OR auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )));

-- Set up public sharing for the storage bucket if needed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'unit-bucket';
