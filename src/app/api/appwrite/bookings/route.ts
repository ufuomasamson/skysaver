import { NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';
import { createBooking } from '@/lib/documentService';

/**
 * API route to create a new booking record
 * POST /api/appwrite/bookings
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const bookingData = await request.json();
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
    const databases = new Databases(client);
    
    // Create booking using the documentService function
    const result = await createBooking(databases, bookingData);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create booking',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
