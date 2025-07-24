import { NextRequest, NextResponse } from 'next/server';
import { initServerClient, DATABASE_ID, COLLECTIONS } from '@/lib/appwriteServer';

export async function GET() {
  try {
    console.log('Testing server-side Appwrite connection...');
    
    // Initialize the server client with API key
    const { databases, client } = initServerClient();
    
    // Try to list documents from a collection to verify connection works
    const flightsCollection = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FLIGHTS
    );
    
    // Use the flightsCollection instead of trying to get the database directly
    const databaseDetails = { 
      name: "Database", 
      id: DATABASE_ID 
    };
    
    // Get client headers info for debugging
    let headerInfo = {};
    try {
      // @ts-ignore - Access headers to check if API key is set
      if (client.headers) {
        // @ts-ignore - Create safe copy of headers (without showing full API key)
        headerInfo = {
          hasApiKey: !!client.headers['X-Appwrite-Key'],
          apiKeyLength: client.headers['X-Appwrite-Key'] ? client.headers['X-Appwrite-Key'].length : 0,
          projectHeader: client.headers['X-Appwrite-Project'],
          userAgent: client.headers['User-Agent']
        };
      }
    } catch (err) {
      console.error('Error accessing headers:', err);
    }
    
    // Return success response with details
    return NextResponse.json({
      success: true,
      message: 'Connection to Appwrite successful with API key authentication',
      database: databaseDetails,
      collections_count: flightsCollection.total,
      documents_sample: flightsCollection.documents.slice(0, 2),
      project_id: process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      api_key_configured: !!process.env.APPWRITE_API_KEY,
      using_server_variables: {
        endpoint: !!process.env.APPWRITE_ENDPOINT,
        project_id: !!process.env.APPWRITE_PROJECT_ID,
        database_id: !!process.env.APPWRITE_DATABASE_ID
      },
      headers: headerInfo
    });
  } catch (error: any) {
    // Detailed error logging
    console.error('Appwrite connection test failed:', error);
    
    // Return error response with details
    return NextResponse.json({
      success: false,
      message: 'Connection to Appwrite failed',
      error: error.message,
      code: error.code,
      type: error.type,
      api_key_configured: !!process.env.APPWRITE_API_KEY,
    }, { status: 500 });
  }
}
