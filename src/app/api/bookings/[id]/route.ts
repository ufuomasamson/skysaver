import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side operations
    const supabase = createServerSupabaseClient();
    
    // Get booking ID from params
    const { id: bookingId } = params;
    
    // Get booking with related flight, departure, arrival, and airline info
    const { data: booking, error } = await supabase
      .from(TABLES.BOOKINGS)
      .select(`
        *,
        flight:flights(
          *,
          airline:airlines(*),
          departure:locations!flights_departure_location_id_fkey(*),
          arrival:locations!flights_arrival_location_id_fkey(*)
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (error) {
      console.error('Error fetching booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    // Format data for frontend
    const formattedBooking = {
      id: booking.id,
      user_id: booking.user_id,
      flight_id: booking.flight_id,
      passenger_name: booking.passenger_name,
      status: booking.status,
      paid: booking.paid,
      created_at: booking.created_at,
      flight: {
        flight_number: booking.flight_number,
        date: booking.date,
        time: booking.time,
        price: booking.price,
        currency: booking.currency || 'USD', // Use actual currency from DB or fallback to USD
        departure: {
          city: booking.departure_city,
          country: booking.departure_country
        },
        arrival: {
          city: booking.arrival_city,
          country: booking.arrival_country
        },
        airline: {
          name: booking.airline_name,
          logo: booking.airline_logo
        }
      }
    };

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side operations
    const supabase = createServerSupabaseClient();
    
    // Get booking ID from params
    const { id: bookingId } = params;
    const data = await request.json();
    
    // Validate required fields
    if (!data.status) {
      return NextResponse.json({ error: 'Status field is required' }, { status: 400 });
    }
    
    // Update booking status
    const { error } = await supabase
      .from(TABLES.BOOKINGS)
      .update({
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);
    
    if (error) {
      console.error('Error updating booking status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update booking',
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
