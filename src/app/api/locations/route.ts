import { NextResponse, NextRequest } from "next/server";
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

// POST: Add a new location
export async function POST(req: NextRequest) {
  try {
    console.log('Creating location using Supabase');
    const data = await req.json();
    const { city, country, code, continent, is_popular = false } = data;
    
    if (!city || !country) {
      return NextResponse.json({ error: 'City and Country are required' }, { status: 400 });
    }
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Create location using Supabase - only inserting city and country as per schema
    const { data: location, error } = await supabase
      .from(TABLES.LOCATIONS)
      .insert({
        city,
        country
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Location created successfully',
      location: location
    });
  } catch (error) {
    console.error('Error creating location using Supabase:', error);
    
    return NextResponse.json(
      { error: 'Failed to create location', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching locations using Supabase');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Number(searchParams.get('limit') || '100');
    const page = Number(searchParams.get('page') || '1');
    
    // Calculate the range for pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch locations with pagination
    const { data: locations, error, count } = await supabase
      .from(TABLES.LOCATIONS)
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('city');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(locations || []);
  } catch (error) {
    console.error('Error fetching locations using Supabase:', error);
    
    return NextResponse.json(
      { error: "Failed to fetch locations", message: error.message },
      { status: 500 }
    );
  }
}


// PUT: Edit an existing location
export async function PUT(req: NextRequest) {
  try {
    console.log('Updating location using Supabase');
    const data = await req.json();
    const { id, city, country, code, continent, is_popular } = data;
    
    if (!id) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Prepare update data - only city and country as per schema
    const updateData: Record<string, any> = {};
    if (city) updateData.city = city;
    if (country) updateData.country = country;
    
    // Update location using Supabase
    const { data: updatedLocation, error } = await supabase
      .from(TABLES.LOCATIONS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: updatedLocation
    });
  } catch (error) {
    console.error('Error updating location using Supabase:', error);
    
    return NextResponse.json(
      { error: 'Failed to update location', message: error.message },
      { status: 500 }
    );
  }
}
