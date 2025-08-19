import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Reference parameter required'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Look up booking by transaction reference
    console.log('Looking up booking with reference:', reference);
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('transaction_ref', reference)
      .single();

    if (bookingError) {
      console.error('Booking lookup error:', bookingError);
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        details: bookingError.message,
        reference: reference
      }, { status: 404 });
    }

    if (!booking) {
      return NextResponse.json({
        success: false,
        error: 'No booking found with this reference',
        reference: reference
      }, { status: 404 });
    }

    console.log('Found booking:', booking);

    // Try to verify with Paystack
    const paystackKeys = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack')
      .eq('type', 'live_secret')
      .single();

    if (!paystackKeys.data) {
      return NextResponse.json({
        success: false,
        error: 'Paystack key not found',
        booking: booking
      }, { status: 500 });
    }

    // Test verification call (just to see if it works)
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${paystackKeys.data.api_key}`
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification:', verifyData);

    return NextResponse.json({
      success: true,
      booking: booking,
      paystackVerification: verifyData,
      needsUpdate: booking.paid !== true || booking.status !== 'approved'
    });

  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Debug failed'
    }, { status: 500 });
  }
}
