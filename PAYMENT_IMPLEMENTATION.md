# Payment System Implementation Guide

## Overview

This guide explains how the payment system works in the United Air application after implementing crypto wallet payments.

## Current Payment Flow

1. **Book a Flight**
   - User searches for and selects a flight
   - User clicks "Book Flight" button
   - System creates a booking record in the database

2. **Submit Payment Proof**
   - User selects a crypto wallet from their saved wallets
   - User uploads proof of payment (screenshot or confirmation)
   - System uploads the proof to Supabase Storage
   - System creates a payment record linked to the booking

3. **Admin Approval**
   - Admin reviews payment proof in admin dashboard
   - Admin approves or rejects the payment
   - If approved, booking status is updated to "approved" and marked as paid

## Database Schema

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency_code VARCHAR(8) NOT NULL,  -- Note: API expects "currency" but DB has "currency_code"
  payment_method VARCHAR(64),
  status VARCHAR(32) DEFAULT 'pending',
  transaction_id VARCHAR(128),
  payment_proof_url TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### POST /api/payments
Creates a new payment record with proof upload

#### Request Body (FormData):
```
booking_id: ID of the booking
amount: Payment amount
payment_proof: File containing proof of payment
payment_method: Method used (e.g., 'crypto')
currency: Currency code (e.g., 'USD')
user_id: ID of the authenticated user
user_email: Email of the user (optional)
```

#### Response:
```json
{
  "success": true,
  "message": "Payment record created successfully",
  "payment": {
    "id": 1,
    "booking_id": "123",
    "amount": 655.98,
    "currency_code": "USD",
    "payment_method": "crypto",
    "status": "pending",
    "payment_proof_url": "https://...",
    "user_id": "42633d63-c95c-4122-95a6-57bb887efa44"
  }
}
```

### PATCH /api/payments
Approves a payment and updates the booking status

#### Request Body:
```json
{
  "payment_id": 1
}
```

## Storage Setup

The payment proofs are stored in Supabase Storage:
- Bucket: `unit-bucket`
- Path format: `payment_proofs/{timestamp}-{random-string}.{extension}`

## Common Issues

### Missing currency column
The API expects a column called `currency` but the database has `currency_code`. The API has been modified to use the correct column name.

### Storage permissions
Make sure the storage bucket has the proper policies to allow:
- Authenticated users to upload files
- Users to view payment proofs
- Admins to manage all files

## Troubleshooting

If you encounter issues with payment processing:

1. Check browser console for detailed error messages
2. Verify that the storage bucket exists and has proper permissions
3. Ensure the user is authenticated before attempting payment
4. Check that all required fields are being sent in the request

## Future Improvements

- Add email notifications for payment status changes
- Implement automatic payment verification with crypto APIs
- Add support for multiple payment methods
- Create a payment history view for users
