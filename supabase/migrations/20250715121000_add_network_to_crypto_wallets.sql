-- Add network column to crypto_wallets table
ALTER TABLE crypto_wallets ADD COLUMN network VARCHAR(64) NOT NULL DEFAULT 'Unknown';
