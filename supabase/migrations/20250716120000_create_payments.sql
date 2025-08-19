-- Migration: Create payments table for crypto payment proof and approval
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  wallet_id INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  proof_url VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Foreign keys
  CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_wallet FOREIGN KEY (wallet_id) REFERENCES crypto_wallets(id) ON DELETE CASCADE
);
