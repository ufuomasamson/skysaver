-- Update payment_gateways table to support multiple payment methods
-- Add type column to distinguish between different API keys for the same gateway
ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS type VARCHAR(64);

-- Add unique constraint for name + type combination
CREATE UNIQUE INDEX IF NOT EXISTS payment_gateways_name_type_unique 
ON payment_gateways (name, type);

-- Insert Flutterwave gateway types if they don't exist
INSERT INTO payment_gateways (name, type, api_key, enabled) VALUES 
('flutterwave', 'test_public', '', TRUE),
('flutterwave', 'test_secret', '', TRUE),
('flutterwave', 'test_encryption', '', TRUE),
('flutterwave', 'live_public', '', TRUE),
('flutterwave', 'live_secret', '', TRUE),
('flutterwave', 'live_encryption', '', TRUE),
('paystack', 'test_public', '', TRUE),
('paystack', 'test_secret', '', TRUE),
('paystack', 'live_public', '', TRUE),
('paystack', 'live_secret', '', TRUE)
ON CONFLICT (name, type) DO NOTHING;

-- Update existing records to have proper types (if any exist without type)
UPDATE payment_gateways 
SET type = 'test_secret' 
WHERE name = 'flutterwave' AND type IS NULL AND api_key LIKE 'FLWSECK_TEST%';

UPDATE payment_gateways 
SET type = 'live_secret' 
WHERE name = 'flutterwave' AND type IS NULL AND api_key LIKE 'FLWSECK%' AND api_key NOT LIKE 'FLWSECK_TEST%';
