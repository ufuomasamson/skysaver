import { NextResponse } from 'next/server';
import { apiServiceFactory } from '@/lib/apiServiceFactory';

/**
 * API route to set the preferred API method
 * 
 * @route POST /api/set-api-method
 */
export async function POST(request: Request) {
  try {
    const { method } = await request.json();
    
    if (!method || !['auto', 'regionBypass', 'standard', 'mysql'].includes(method)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid API method specified'
      }, { status: 400 });
    }
    
    // If auto, let the apiServiceFactory decide based on tests
    if (method === 'auto') {
      console.log('Setting API method to auto (system will decide)');
      // Re-initialize to run tests and decide automatically
      await apiServiceFactory.initialize();
    } else {
      // Force specific method
      console.log(`Forcing API method to: ${method}`);
      apiServiceFactory.forceApiMethod(method as any);
    }
    
    return NextResponse.json({
      success: true,
      message: `API method set to ${method === 'auto' ? 'automatic selection' : method}`
    });
  } catch (error: any) {
    console.error('Error setting API method:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to set API method',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
