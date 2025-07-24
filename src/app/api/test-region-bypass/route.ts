import { NextResponse } from 'next/server';
import { RegionBypassAPI, DATABASE_ID, COLLECTIONS } from '@/lib/regionBypassAPI';

/**
 * API route to test the region bypass API
 * Performs a series of tests to validate the region bypass solution
 * 
 * @route GET /api/test-region-bypass
 * @returns {Object} Test results
 */
export async function GET() {
  try {
    // Test connection first
    const connectionTest = await RegionBypassAPI.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Connection test failed',
        error: connectionTest.error,
        connectionTest
      }, { status: 500 });
    }
    
    // Test reading data from a collection
    const locationsList = await RegionBypassAPI.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LOCATIONS,
      ['limit=5']
    );
    
    // Test complete - return results
    return NextResponse.json({
      success: true,
      message: 'Region bypass API tests completed successfully',
      results: {
        connectionTest,
        locationsList
      }
    });
  } catch (error: any) {
    console.error('Error testing region bypass API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Region bypass API tests failed',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
