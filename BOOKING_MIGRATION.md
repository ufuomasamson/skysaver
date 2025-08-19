# Booking System Migration: MySQL to Supabase

This document outlines the changes made to migrate the booking system from MySQL to Supabase.

## Changes Made

### 1. API Endpoints Updated
- `/api/bookings` - GET and POST endpoints now use Supabase instead of MySQL
- Updated to use the server-side Supabase client for admin operations

### 2. Database Schema Created
- Created a migration file for the bookings table in Supabase
- Added proper foreign key references to auth.users and flights tables
- Set up Row Level Security policies to control access

### 3. Fixed Client-Side Code
- Updated timestamp format to use ISO format for Supabase
- Fixed error handling for the booking process

### 4. Added Testing Tools
- Created a test page at `/admin/test-bookings` to verify table existence
- Added utility functions for database debugging

### 5. Added Documentation
- Created `BOOKING_SYSTEM.md` to document the booking flow

## How to Test the Fix

1. Navigate to `/track` and enter a valid tracking number for a flight
2. Log in as a user if prompted
3. Click the "Book Flight" button
4. Verify that a booking is created without errors
5. Check the admin dashboard to confirm the booking appears

## Error Troubleshooting

If you encounter any further issues with bookings:

1. Check the `/admin/test-bookings` page to verify table existence
2. Ensure the migrations have been applied to your Supabase instance
3. Verify user authentication is working properly
4. Check browser console for detailed error messages

## Database Tables

The booking system uses the following tables:

- `bookings` - Stores booking information
- `flights` - Stores flight information
- `users` - Stores user profiles
- `auth.users` - Supabase authentication table

## API Reference

### GET /api/bookings
- Query params:
  - `user_id` (optional) - Filter by user ID
  - `flight_id` (optional) - Filter by flight ID
- Returns: Array of booking objects

### POST /api/bookings
- Body:
  - `user_id` (required) - User's UUID
  - `flight_id` (required) - Flight ID
  - `passenger_name` (optional) - Passenger's name
  - `paid` (optional) - Payment status
  - `created_at` (optional) - Creation timestamp
  - `status` (optional) - Booking status
- Returns: Created booking object

---

This migration completes the transition from MySQL to Supabase for the booking system.
