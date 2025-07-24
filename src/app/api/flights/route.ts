// Update the flights endpoint to use Supabase instead of MySQL
import { NextRequest, NextResponse } from "next/server";
import { supabase, createServerSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    // Use the server supabase client with higher privileges for admin operations
    const serverSupabase = createServerSupabaseClient();
    
    const url = req.url ? new URL(req.url) : null;
    const trackingNumber = url?.searchParams.get('tracking_number');
    
    let query = serverSupabase
      .from('flights')
      .select(`
        *,
        departure_location:locations!flights_departure_location_id_fkey(id, city, country),
        arrival_location:locations!flights_arrival_location_id_fkey(id, city, country),
        airline:airlines(id, name, logo_url)
      `);
    
    if (trackingNumber) {
      query = query.eq('tracking_number', trackingNumber);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (trackingNumber) {
      return NextResponse.json(data[0] || null);
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching flights:', err);
    return NextResponse.json(
      { error: "Failed to fetch flights", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Use the server supabase client with higher privileges for admin operations
    const serverSupabase = createServerSupabaseClient();
    
    const body = await req.json();
    let {
      flight_number,
      airline_id,
      departure_airport, // airport name (optional)
      arrival_airport,   // airport name (optional)
      departure_location_id, // id (optional)
      arrival_location_id,   // id (optional)
      date,
      time,
      price,
      passenger_name
    } = body;

    console.log('Flight creation request body:', body);
    
    // If airport names are provided, look up IDs (case-insensitive)
    if (!departure_location_id && departure_airport) {
      const { data: depLocations, error: depError } = await serverSupabase
        .from('locations')
        .select('id')
        .ilike('city', departure_airport)
        .limit(1);
      
      if (depError || !depLocations?.length) {
        return NextResponse.json({ error: 'Invalid departure airport name' }, { status: 400 });
      }
      departure_location_id = depLocations[0].id;
    }
    
    if (!arrival_location_id && arrival_airport) {
      const { data: arrLocations, error: arrError } = await serverSupabase
        .from('locations')
        .select('id')
        .ilike('city', arrival_airport)
        .limit(1);
      
      if (arrError || !arrLocations?.length) {
        return NextResponse.json({ error: 'Invalid arrival airport name' }, { status: 400 });
      }
      arrival_location_id = arrLocations[0].id;
    }
    
    console.log('Resolved departure_location_id:', departure_location_id, 'arrival_location_id:', arrival_location_id);

    if (!airline_id || !departure_location_id || !arrival_location_id || !date || !time || !price || !passenger_name) {
      console.error('Missing required fields:', { airline_id, departure_location_id, arrival_location_id, date, time, price, passenger_name });
      return NextResponse.json({ error: 'All fields including passenger name are required' }, { status: 400 });
    }

    // Generate tracking number automatically
    const trackingNumber = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('Generated tracking number:', trackingNumber);

    // Insert the flight
    const { data: insertedFlight, error: insertError } = await serverSupabase
      .from('flights')
      .insert({
        flight_number,
        airline_id,
        departure_location_id,
        arrival_location_id,
        date,
        time,
        price,
        passenger_name,
        tracking_number: trackingNumber
      })
      .select()
      .single();
      
    if (insertError) {
      throw insertError;
    }
    
    // Fetch the created flight info with joined location details
    const { data: flightWithDetails, error: joinError } = await serverSupabase
      .from('flights')
      .select(`
        *,
        departure_location:locations!flights_departure_location_id_fkey(id, city, country),
        arrival_location:locations!flights_arrival_location_id_fkey(id, city, country),
        airline:airlines(id, name, logo_url)
      `)
      .eq('id', insertedFlight.id)
      .single();
      
    if (joinError) {
      throw joinError;
    }
    
    console.log('Created flight:', flightWithDetails);
    return NextResponse.json({ success: true, flight: flightWithDetails });
  } catch (err) {
    console.error('Flight creation error:', err);
    return NextResponse.json({ 
      error: 'Failed to create flight', 
      details: String(err) 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Use the server supabase client with higher privileges for admin operations
    const serverSupabase = createServerSupabaseClient();
    
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Invalid flight ID" }, { status: 400 });
    }
    
    const { error } = await serverSupabase
      .from('flights')
      .delete()
      .eq('id', id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true, message: "Flight deleted successfully" });
  } catch (err) {
    console.error('Error deleting flight:', err);
    return NextResponse.json(
      { error: "Failed to delete flight", details: String(err) }, 
      { status: 500 }
    );
  }
}
