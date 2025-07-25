-- Add payment tracking columns to bookings table
-- This migration adds the necessary columns for payment processing

-- Add transaction reference column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(64);

-- Add payment status column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending';

-- Add payment method column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32);

-- Add payment transaction ID from payment gateway
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(128);

-- Add flight amount and currency for payment tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_amount DECIMAL(12,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'USD';

-- Add status column for booking status
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending';

-- Add updated_at column for tracking changes
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create unique index on transaction_ref for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_transaction_ref ON bookings(transaction_ref) WHERE transaction_ref IS NOT NULL;

-- Create index on payment_status for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add comments for documentation
COMMENT ON COLUMN bookings.transaction_ref IS 'Unique transaction reference from payment gateway';
COMMENT ON COLUMN bookings.payment_status IS 'Status of payment: pending, completed, failed';
COMMENT ON COLUMN bookings.payment_method IS 'Payment method used: paystack, etc';
COMMENT ON COLUMN bookings.payment_transaction_id IS 'Transaction ID from payment gateway';
COMMENT ON COLUMN bookings.flight_amount IS 'Amount paid for the flight';
COMMENT ON COLUMN bookings.currency IS 'Currency used for payment';
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, approved, cancelled';
COMMENT ON COLUMN bookings.updated_at IS 'Last update timestamp';
