import { NextResponse } from 'next/server';
import { PaystackService } from '@/lib/paystackService';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { bookingId, userId, amount, currency = 'NGN' } = await request.json();

    if (!bookingId || !userId || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId, userId, amount'
      }, { status: 400 });
    }

    // Validate currency is supported by this Paystack merchant account
    // Only NGN is supported - currency conversion should be handled client-side
    const supportedCurrencies = ['NGN'];
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json({
        success: false,
        error: `Currency ${currency} not supported by merchant. This endpoint only accepts NGN. Currency conversion should be handled on the client side.`
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .select(`
        *,
        flights:flight_id (
          id,
          flight_number,
          departure_location_id,
          arrival_location_id,
          date,
          time,
          price
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Generate unique reference
    const reference = `FLIGHT_${bookingId}_${userId}_${Date.now()}`;

    // Amount should already be converted and in smallest unit (cents/kobo)
    const paystackAmount = amount;

    const paymentData = {
      email: user.email,
      amount: paystackAmount,
      currency: currency.toUpperCase(),
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success`,
      metadata: {
        booking_id: bookingId,
        user_id: userId,
        flight_id: booking.flight_id,
        original_currency: currency,
        custom_fields: [
          {
            display_name: "Flight Number",
            variable_name: "flight_number",
            value: booking.flights?.flight_number || 'N/A'
          },
          {
            display_name: "Passenger Name",
            variable_name: "passenger_name",
            value: booking.passenger_name
          },
          {
            display_name: "Currency",
            variable_name: "currency",
            value: currency
          }
        ]
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    };

    console.log('Initializing Paystack payment:', {
      reference,
      amount: paystackAmount,
      currency: currency.toUpperCase(),
      email: user.email
    });

    const result = await PaystackService.initializePayment(paymentData);

    if (result.status && result.data) {
      // Store transaction reference in booking for later verification
      await supabase
        .from(TABLES.BOOKINGS)
        .update({
          transaction_ref: reference,
          payment_method: 'paystack',
          flight_amount: amount,
          currency: currency.toUpperCase()
        })
        .eq('id', bookingId);

      return NextResponse.json({
        success: true,
        message: 'Payment initialized successfully',
        data: {
          payment_url: result.data.authorization_url,
          access_code: result.data.access_code,
          reference: reference,
          amount: paystackAmount,
          currency: currency.toUpperCase()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment initialization failed'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Paystack payment initiation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
