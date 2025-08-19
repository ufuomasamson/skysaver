import { NextRequest, NextResponse } from 'next/server';
import { initializeStorage } from '@/lib/initializeStorage';

/**
 * API route to initialize storage buckets and folders
 * This should be protected in production and only accessible to admins
 */
export async function GET(request: NextRequest) {
  try {
    // For security, you might want to check admin permissions here
    // or use a secret key in the request
    
    // Initialize storage
    const result = await initializeStorage();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Storage initialization failed' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Storage initialization API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
