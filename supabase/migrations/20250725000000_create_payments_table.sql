-- Create the payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'USD',
  payment_method VARCHAR(64),
  status VARCHAR(32) DEFAULT 'pending',
  transaction_id VARCHAR(128),
  payment_proof_url TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments
-- Users can view their own payments
CREATE POLICY IF NOT EXISTS "Users can view their own payments" 
  ON payments FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins can view and manage all payments
CREATE POLICY IF NOT EXISTS "Admins can view all payments" 
  ON payments FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can insert payments" 
  ON payments FOR INSERT 
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can update payments" 
  ON payments FOR UPDATE 
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Users can create their own payments
CREATE POLICY IF NOT EXISTS "Users can insert their own payments" 
  ON payments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Grant permissions to service role
GRANT ALL ON TABLE payments TO service_role;

-- Create storage bucket for payment proofs if it doesn't exist
-- Note: This is done through the Supabase dashboard UI, not SQL
-- But we can create policies for the storage
-- CREATE POLICY "Anyone can upload payment proofs" ON storage.objects FOR INSERT 
--   WITH CHECK (bucket_id = 'unit-bucket' AND path LIKE 'payment_proofs/%');
