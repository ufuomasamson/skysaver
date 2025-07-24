import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get collection and limit from query parameters
    const searchParams = request.nextUrl.searchParams;
    const collection = searchParams.get('collection') || 'flights';
    const limit = Number(searchParams.get('limit') || '10');
    const page = Number(searchParams.get('page') || '1');
    
    // Valid table names in Supabase
    const validTables = [
      'flights',
      'locations',
      'airlines',
      'users',
      'bookings',
      'currencies',
      'payment_gateways',
      'payments',
      'user_preferences',
      'crypto_wallets'
    ];
    
    // Normalize collection name to lowercase
    const normalizedCollection = collection.toLowerCase();
    
    // Check if the collection name is valid
    if (!validTables.includes(normalizedCollection)) {
      return NextResponse.json({
        success: false,
        message: `Invalid collection: ${collection}`,
        validCollections: validTables
      }, { status: 400 });
    }
    
    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Query Supabase
    console.log(`Querying Supabase table: ${normalizedCollection} with limit: ${limit}, offset: ${offset}`);
    const { data: rows, error } = await supabase
      .from(normalizedCollection)
      .select('*')
      .range(offset, offset + limit - 1);
    
    // Check for Supabase error
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({
        success: false,
        message: 'Error querying Supabase',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Retrieved ${collection} data successfully`,
      collection: normalizedCollection,
      data: rows,
      pagination: {
        page,
        limit,
        offset: (page - 1) * limit
      }
    });
  } catch (error: any) {
    console.error(`Error fetching ${request.nextUrl.searchParams.get('collection') || 'data'}:`, error);
    
    return NextResponse.json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    }, { status: 500 });
  }
}
