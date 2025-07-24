import { NextRequest, NextResponse } from 'next/server';
import { apiServiceFactory } from '@/lib/apiServiceFactory';

/**
 * API route that provides information about the current API method configuration
 * and allows changing it if needed
 * 
 * GET: Get current API method configuration
 * POST: Set API method configuration
 */

export async function GET() {
  try {
    // Get the current API method configuration
    const apiStatus = apiServiceFactory.getStatus();
    
    return NextResponse.json({
      success: true,
      message: 'API method configuration retrieved successfully',
      apiStatus
    });
  } catch (error) {
    console.error('Error retrieving API method configuration:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve API method configuration',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { method, endpoint } = await request.json();
    
    if (!method || !['auto', 'regionBypass', 'standard', 'mysql'].includes(method)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid API method specified. Must be one of: auto, regionBypass, standard, mysql'
      }, { status: 400 });
    }
    
    if (endpoint) {
      // Set method for a specific endpoint
      await apiServiceFactory.setEndpointMethod(endpoint, method as any);
      
      return NextResponse.json({
        success: true,
        message: `API method for ${endpoint} set to ${method === 'auto' ? 'automatic selection' : method}`
      });
    } else {
      // Set method for all endpoints
      if (method === 'auto') {
        // Re-initialize to run tests and decide automatically
        await apiServiceFactory.initialize();
      } else {
        // Force specific method
        apiServiceFactory.forceApiMethod(method as any);
      }
      
      return NextResponse.json({
        success: true,
        message: `API method set to ${method === 'auto' ? 'automatic selection' : method} for all endpoints`
      });
    }
  } catch (error) {
    console.error('Error setting API method:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to set API method',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
