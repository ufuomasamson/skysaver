import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference } = body;
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Payment reference is required'
      }, { status: 400 });
    }

    console.log('Manual verification for reference:', reference);

    const supabase = createServerSupabaseClient();

    // Get Paystack secret key
    const { data: keys, error: keyError } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack')
      .eq('type', 'live_secret')
      .single();

    if (keyError || !keys) {
      return NextResponse.json({
        success: false,
        error: 'Paystack configuration not found'
      }, { status: 500 });
    }

    // Verify payment with Paystack
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
    const verifyResponse = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${keys.api_key}`
      }
    });

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification result:', verifyData);

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json({
        success: false,
        error: 'Payment not successful on Paystack',
        paystackData: verifyData
      }, { status: 400 });
    }

    // Find booking by transaction reference
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('transaction_ref', reference)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found with this reference',
        reference: reference
      }, { status: 404 });
    }

    console.log('Found booking:', booking.id, 'Current status:', booking.status, 'Paid:', booking.paid);

    // Update booking to paid and approved
    const { error: updateError } = await supabase
      .from(TABLES.BOOKINGS)
      .update({
        paid: true,
        status: 'approved',
        payment_status: 'completed',
        payment_transaction_id: verifyData.data.id?.toString(),
        payment_method: 'paystack',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('Successfully updated booking:', booking.id);

    // Create payment record if not exists
    const { error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .upsert({
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: verifyData.data.amount / 100, // Convert from kobo
        currency: verifyData.data.currency,
        payment_method: 'paystack',
        transaction_id: reference,
        gateway_reference: verifyData.data.id?.toString(),
        status: 'completed',
        paid_at: new Date().toISOString()
      }, {
        onConflict: 'transaction_id'
      });

    if (paymentError) {
      console.warn('Payment record creation failed:', paymentError);
      // Don't fail the request, booking is updated
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and booking updated successfully',
      booking: {
        id: booking.id,
        reference: reference,
        status: 'approved',
        paid: true,
        amount: verifyData.data.amount / 100,
        currency: verifyData.data.currency
      }
    });

  } catch (error: any) {
    console.error('Manual verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Verification failed'
    }, { status: 500 });
  }
}
