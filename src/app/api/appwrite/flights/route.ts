import { NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';
import { createFlight } from '@/lib/documentService';

/**
 * API route to create a new flight record
 * POST /api/appwrite/flights
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const flightData = await request.json();
    
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
    const databases = new Databases(client);
    
    // Create flight using the documentService function
    const result = await createFlight(databases, flightData);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Flight created successfully',
      data: result
    });
  } catch (error: any) {
    console.error('Error creating flight:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to create flight',
        error: error.toString()
      },
      { status: 500 }
    );
  }
}
