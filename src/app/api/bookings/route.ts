import { NextRequest, NextResponse } from "next/server";
import { supabase, createServerSupabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    // Use the server supabase client with higher privileges for admin operations
    const serverSupabase = createServerSupabaseClient();
    
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const flight_id = searchParams.get("flight_id");
    
    let query = serverSupabase.from('bookings').select('*');
    
    if (user_id && flight_id) {
      query = query.eq('user_id', user_id).eq('flight_id', flight_id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (flight_id) {
      query = query.eq('flight_id', flight_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error('[DEBUG] /api/bookings GET error:', err);
    return NextResponse.json({ error: "Failed to fetch bookings", details: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Use the server supabase client with higher privileges for admin operations
    const serverSupabase = createServerSupabaseClient();
    
    const body = await request.json();
    console.log('[DEBUG] /api/bookings POST body:', body);
    
    // Always fetch passenger_name from flights table for the given flight_id
    const { data: flightData, error: flightError } = await serverSupabase
      .from('flights')
      .select('passenger_name')
      .eq('id', body.flight_id)
      .single();
    
    if (flightError) {
      throw new Error(`Error fetching flight: ${flightError.message}`);
    }
    
    // Use passenger name from flight or fallback to the provided one
    let passenger_name = (flightData && flightData.passenger_name) || body.passenger_name || "N/A";
    
    // Default status to 'pending' if not provided
    const status = body.status || 'pending';
    
    // Insert the booking into Supabase
    const { data: booking, error: insertError } = await serverSupabase
      .from('bookings')
      .insert({
        user_id: body.user_id,
        flight_id: body.flight_id,
        passenger_name: passenger_name,
        paid: body.paid || false,
        created_at: body.created_at || new Date().toISOString(),
        status: status
      })
      .select()
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('[DEBUG] /api/bookings POST created booking:', booking);
    return NextResponse.json(booking);
  } catch (err) {
    console.error('[DEBUG] /api/bookings POST error:', err);
    return NextResponse.json({ error: "Failed to create booking", details: String(err) }, { status: 500 });
  }
}
