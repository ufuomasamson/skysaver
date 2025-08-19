-- Add payment_method column to payments table
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64);

-- If you need to set default values for existing rows
UPDATE payments 
SET payment_method = 'crypto'
WHERE payment_method IS NULL;
