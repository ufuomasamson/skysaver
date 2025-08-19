import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

/**
 * API route for flights - using Supabase to replace the previous
 * region bypass API approach
 */

/**
 * GET handler - Retrieve flights with optional filtering
 * @route GET /api/flights-bypass
 */
export async function GET(request: Request) {
  try {
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const tracking_number = url.searchParams.get('tracking_number');
    const airline = url.searchParams.get('airline');
    const origin = url.searchParams.get('origin');
    const destination = url.searchParams.get('destination');
    
    // Calculate pagination range
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Start building the query
    let query = supabase
      .from(TABLES.FLIGHTS)
      .select('*')
      .range(from, to);
    
    // Add optional filters if provided
    if (tracking_number) {
      query = query.eq('tracking_number', tracking_number);
    }
    
    if (airline) {
      query = query.eq('airline_id', airline);
    }
    
    if (origin) {
      query = query.eq('departure_location_id', origin);
    }
    
    if (destination) {
      query = query.eq('arrival_location_id', destination);
    }
    
    // Execute the query
    const { data: flights, error } = await query;
    
    if (error) {
      console.error('Failed to retrieve flights:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve flights',
        error: error.message
      }, { status: 500 });
    }
    
    // If we're looking for a specific flight by tracking number, return just that flight
    if (tracking_number && flights?.length > 0) {
      return NextResponse.json(flights[0]);
    }
    
    return NextResponse.json(flights || []);
  } catch (error: any) {
    console.error('Error retrieving flights:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve flights',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * POST handler - Create a new flight
 * @route POST /api/flights-bypass
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let {
      flight_number,
      airline_id,
      departure_airport,
      arrival_airport,
      departure_location_id,
      arrival_location_id,
      date,
      time,
      price,
      passenger_name
    } = body;
    
    console.log('Flight creation request body:', body);
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // If location IDs are not provided but airport names are, look up the IDs
    if (!departure_location_id && departure_airport) {
      // First, get all locations
      const { data: departureLocations, error: depError } = await supabase
        .from(TABLES.LOCATIONS)
        .select('id, city, country')
        .ilike('city', `%${departure_airport}%`)
        .limit(1);
      
      if (depError) {
        console.error('Error looking up departure location:', depError);
        return NextResponse.json({ error: 'Error looking up departure location' }, { status: 400 });
      }
      
      if (departureLocations?.length > 0) {
        departure_location_id = departureLocations[0].id;
      } else {
        return NextResponse.json({ error: 'Invalid departure airport name' }, { status: 400 });
      }
    }
    
    if (!arrival_location_id && arrival_airport) {
      // First, get all locations
      const { data: arrivalLocations, error: arrError } = await supabase
        .from(TABLES.LOCATIONS)
        .select('id, city, country')
        .ilike('city', `%${arrival_airport}%`)
        .limit(1);
      
      if (arrError) {
        console.error('Error looking up arrival location:', arrError);
        return NextResponse.json({ error: 'Error looking up arrival location' }, { status: 400 });
      }
      
      if (arrivalLocations?.length > 0) {
        arrival_location_id = arrivalLocations[0].id;
      } else {
        return NextResponse.json({ error: 'Invalid arrival airport name' }, { status: 400 });
      }
    }
    
    console.log('Resolved departure_location_id:', departure_location_id, 'arrival_location_id:', arrival_location_id);
    
    // Validate required fields
    if (!flight_number || !airline_id || !departure_location_id || !arrival_location_id || !date || !time || !price || !passenger_name) {
      console.error('Missing required fields:', { flight_number, airline_id, departure_location_id, arrival_location_id, date, time, price, passenger_name });
      return NextResponse.json({ error: 'All fields including passenger name are required' }, { status: 400 });
    }
    
    // Generate tracking number automatically
    const trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('Generated tracking number:', trackingNumber);
    
    // Create flight using Supabase
    const flightData = {
      flight_number,
      airline_id,
      departure_location_id,
      arrival_location_id,
      date,
      time,
      price,
      passenger_name,
      tracking_number: trackingNumber,
      created_at: new Date().toISOString()
    };
    
    const { data: flight, error } = await supabase
      .from(TABLES.FLIGHTS)
      .insert(flightData)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create flight:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Failed to create flight',
        error: error.message
      }, { status: 500 });
    }
    
    // Now get the full details of the newly created flight with location info
    // We'll need to make additional queries to get the location details
    
    // Get departure location details
    const { data: departureLocation } = await supabase
      .from(TABLES.LOCATIONS)
      .select('city, country')
      .eq('id', departure_location_id)
      .single();
    
    // Get arrival location details
    const { data: arrivalLocation } = await supabase
      .from(TABLES.LOCATIONS)
      .select('city, country')
      .eq('id', arrival_location_id)
      .single();
    
    // Combine the data
    if (departureLocation) {
      flight.departure_city = departureLocation.city;
      flight.departure_country = departureLocation.country;
    }
    
    if (arrivalLocation) {
      flight.arrival_city = arrivalLocation.city;
      flight.arrival_country = arrivalLocation.country;
    }
    
    console.log('Created flight with full details:', flight);
    
    return NextResponse.json({ 
      success: true, 
      flight
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating flight:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create flight',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * DELETE handler - Remove a flight
 * @route DELETE /api/flights-bypass?id=[id]
 */
export async function DELETE(request: Request) {
  try {
    // Extract ID from the query parameter
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Delete the flight using Supabase
    const { error } = await supabase
      .from(TABLES.FLIGHTS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete flight:', error.message);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete flight',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting flight:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete flight',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
