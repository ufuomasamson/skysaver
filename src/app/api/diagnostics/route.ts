import { NextResponse } from 'next/server';
import { RegionBypassAPI, DATABASE_ID, COLLECTIONS } from '@/lib/regionBypassAPI';
import { apiServiceFactory } from '@/lib/apiServiceFactory';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

/**
 * API route for diagnostics dashboard
 * Tests all API methods and returns comprehensive status information
 */
export async function GET() {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      regionBypassTest: null as any,
      standardApiTest: null as any,
      mysqlTest: null as any,
      apiServiceStatus: apiServiceFactory.getStatus(),
      recommendations: {
        bestMethod: null as string | null,
        recommendations: [] as string[]
      }
    };
    
    // Test the region bypass API
    try {
      const connectionTest = await RegionBypassAPI.testConnection();
      const locationsTest = connectionTest.success ? 
        await RegionBypassAPI.listDocuments(DATABASE_ID, COLLECTIONS.LOCATIONS, ['limit=1']) : 
        { success: false, message: 'Skipped due to connection failure' };
        
      testResults.regionBypassTest = {
        success: connectionTest.success && locationsTest.success,
        connectionTest,
        locationsTest,
        timestamp: new Date().toISOString()
      };
      
      if (connectionTest.success && locationsTest.success) {
        testResults.recommendations.recommendations.push(
          'Region bypass API is working correctly. This is the recommended approach.'
        );
        if (!testResults.recommendations.bestMethod) {
          testResults.recommendations.bestMethod = 'regionBypass';
        }
      } else {
        testResults.recommendations.recommendations.push(
          'Region bypass API is not working correctly. Consider using alternative methods.'
        );
      }
    } catch (error: any) {
      testResults.regionBypassTest = {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
      testResults.recommendations.recommendations.push(
        'Region bypass API test resulted in an error. Consider using alternative methods.'
      );
    }
    
    // Test the standard API
    try {
      const standardApiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/test-db`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      const standardApiResult = await standardApiResponse.json();
      
      testResults.standardApiTest = {
        success: standardApiResponse.ok,
        status: standardApiResponse.status,
        result: standardApiResult,
        timestamp: new Date().toISOString()
      };
      
      if (standardApiResponse.ok) {
        testResults.recommendations.recommendations.push(
          'Standard API test succeeded. This is a viable alternative.'
        );
        if (!testResults.recommendations.bestMethod) {
          testResults.recommendations.bestMethod = 'standard';
        }
      } else {
        testResults.recommendations.recommendations.push(
          'Standard API test failed. Not recommended for production use.'
        );
      }
    } catch (error: any) {
      testResults.standardApiTest = {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
      testResults.recommendations.recommendations.push(
        'Standard API test resulted in an error. Not recommended for production use.'
      );
    }
    
    // Test the Supabase API
    try {
      // Try direct Supabase connection
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase.from('flights').select('count(*)');
      
      // Also test the API endpoint
      const supabaseApiResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/database?collection=flights&limit=1`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      const supabaseApiResult = await supabaseApiResponse.json();
      
      testResults.mysqlTest = {
        success: !error && supabaseApiResponse.ok,
        status: supabaseApiResponse.status,
        directQuery: { success: !error, data },
        result: supabaseApiResult,
        timestamp: new Date().toISOString()
      };
      
      if (!error && supabaseApiResponse.ok) {
        testResults.recommendations.recommendations.push(
          'Supabase API test succeeded. This is now the recommended approach.'
        );
        if (!testResults.recommendations.bestMethod) {
          testResults.recommendations.bestMethod = 'supabase';
        }
      } else {
        testResults.recommendations.recommendations.push(
          'Supabase API test failed. Check your Supabase configuration.'
        );
      }
    } catch (error: any) {
      testResults.mysqlTest = {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
      testResults.recommendations.recommendations.push(
        'Supabase API test resulted in an error. Check your Supabase configuration.'
      );
    }
    
    // Generate final recommendations
    if (!testResults.recommendations.bestMethod) {
      testResults.recommendations.recommendations.push(
        'All API tests failed. Check your server and database configurations.'
      );
    } else if (testResults.recommendations.bestMethod === 'regionBypass') {
      testResults.recommendations.recommendations.push(
        'RECOMMENDATION: Use the region bypass API for production. It successfully overcomes the region restrictions.'
      );
    } else if (testResults.recommendations.bestMethod === 'supabase') {
      testResults.recommendations.recommendations.push(
        'RECOMMENDATION: Use the Supabase API for production as the most reliable option.'
      );
    } else {
      testResults.recommendations.recommendations.push(
        'RECOMMENDATION: Use the standard API with caution and implement fallbacks.'
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Diagnostics completed',
      testResults
    });
  } catch (error: any) {
    console.error('Error running diagnostics:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Diagnostics failed',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
