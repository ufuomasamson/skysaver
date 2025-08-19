import { NextResponse } from 'next/server';
import { AppwriteServerAPI, DATABASE_ID, COLLECTIONS } from '@/lib/appwriteDirectAPI';

export async function GET() {
  try {
    console.log('Testing direct Appwrite API connection...');
    
    // Check if environment variables are configured
    const apiKey = process.env.APPWRITE_API_KEY;
    const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    
    // Log configuration status but not the actual values
    console.log({
      apiKeySet: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      projectIdSet: !!projectId,
      endpointSet: !!endpoint,
      databaseIdSet: !!DATABASE_ID,
      flightsCollectionSet: !!COLLECTIONS.FLIGHTS
    });
    
    // Test the connection using our direct API approach
    const connectionTest = await AppwriteServerAPI.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Appwrite API directly',
        error: connectionTest.message,
        environment: {
          apiKeyConfigured: !!apiKey,
          projectIdConfigured: !!projectId, 
          endpointConfigured: !!endpoint,
          databaseIdConfigured: !!DATABASE_ID,
          flightsCollectionConfigured: !!COLLECTIONS.FLIGHTS
        }
      }, { status: 500 });
    }
    
    // Try to fetch some real data
    try {
      const flights = await AppwriteServerAPI.listDocuments(
        DATABASE_ID,
        COLLECTIONS.FLIGHTS,
        ['limit=5']
      );
      
      return NextResponse.json({
        success: true,
        message: 'Successfully connected to Appwrite API directly',
        api_key_configured: !!apiKey,
        environment: {
          databaseId: DATABASE_ID ? DATABASE_ID.substring(0, 4) + '...' : 'Not configured',
          endpoint,
          projectId: projectId ? projectId.substring(0, 4) + '...' : 'Not configured',
          flightsCollection: COLLECTIONS.FLIGHTS ? COLLECTIONS.FLIGHTS.substring(0, 4) + '...' : 'Not configured'
        },
        test_result: connectionTest,
        flights_data: flights
      });
    } catch (dataError: any) {
      console.error('Connected to API but failed to fetch flights data:', dataError);
      
      // Still return success for the connection test, but include the data fetch error
      return NextResponse.json({
        success: true,
        message: 'Connected to Appwrite API, but failed to fetch flights data',
        api_key_configured: !!apiKey,
        environment: {
          databaseId: DATABASE_ID ? DATABASE_ID.substring(0, 4) + '...' : 'Not configured',
          endpoint,
          projectId: projectId ? projectId.substring(0, 4) + '...' : 'Not configured',
          flightsCollection: COLLECTIONS.FLIGHTS ? COLLECTIONS.FLIGHTS.substring(0, 4) + '...' : 'Not configured'
        },
        connection_test: connectionTest,
        data_error: dataError.message
      });
    }
  } catch (error: any) {
    console.error('Error testing direct Appwrite API:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error testing direct Appwrite API',
      error: error.message
    }, { status: 500 });
  }
}
