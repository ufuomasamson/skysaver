-- Migration to create the bookings table in Supabase
-- This table stores flight booking information

-- Create the bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    passenger_name TEXT NOT NULL,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    payment_method TEXT,
    amount DECIMAL(10, 2)
);

-- Add comment to table
COMMENT ON TABLE bookings IS 'Stores flight bookings made by users';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Create Row Level Security policies
-- Enable RLS on the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookings
CREATE POLICY user_read_own_bookings ON bookings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can create their own bookings
CREATE POLICY user_insert_own_bookings ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bookings
CREATE POLICY user_update_own_bookings ON bookings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Admin users can view all bookings
CREATE POLICY admin_read_all_bookings ON bookings
    FOR SELECT
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Policy: Admin users can create bookings for any user
CREATE POLICY admin_insert_all_bookings ON bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Policy: Admin users can update any booking
CREATE POLICY admin_update_all_bookings ON bookings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Policy: Admin users can delete any booking
CREATE POLICY admin_delete_all_bookings ON bookings
    FOR DELETE
    TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Grant permissions to service role
GRANT ALL ON TABLE bookings TO service_role;

-- Add this table to the public API (allows anon access if RLS permits)
GRANT SELECT ON TABLE bookings TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE bookings TO authenticated;
