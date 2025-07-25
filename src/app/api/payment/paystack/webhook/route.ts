import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('No Paystack signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Get Paystack secret key for signature verification
    const supabase = createServerSupabaseClient();
    const { data: keys, error } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack')
      .eq('type', 'live_secret')
      .single();

    if (error || !keys) {
      console.error('Paystack key not found for webhook verification');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', keys.api_key)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook received:', event.event, event.data?.reference);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const paymentData = event.data;
      const reference = paymentData.reference;

      console.log('Processing successful payment:', reference);

      // Find booking by transaction reference
      const { data: booking, error: bookingError } = await supabase
        .from(TABLES.BOOKINGS)
        .select('*')
        .eq('transaction_ref', reference)
        .single();

      if (bookingError || !booking) {
        console.error('Booking not found for reference:', reference, bookingError);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      console.log('Found booking:', booking.id, 'Current status:', booking.status);

      // Update booking status to paid and approved
      const { error: updateError } = await supabase
        .from(TABLES.BOOKINGS)
        .update({
          paid: true,
          status: 'approved',
          payment_status: 'completed',
          payment_transaction_id: paymentData.id.toString(),
          payment_method: 'paystack',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) {
        console.error('Failed to update booking:', updateError);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
      }

      console.log('Successfully updated booking:', booking.id, 'to approved and paid');

      // Optional: Create payment record for tracking
      try {
        await supabase
          .from(TABLES.PAYMENTS)
          .upsert({
            booking_id: booking.id,
            user_id: booking.user_id,
            amount: paymentData.amount / 100, // Convert from kobo to naira
            currency: paymentData.currency,
            payment_method: 'paystack',
            transaction_id: paymentData.id.toString(),
            reference: reference,
            status: 'completed',
            payment_date: new Date().toISOString()
          }, {
            onConflict: 'reference'
          });
        console.log('Payment record created for:', reference);
      } catch (paymentRecordError) {
        console.warn('Could not create payment record:', paymentRecordError);
        // Don't fail the webhook for this
      }

      return NextResponse.json({ message: 'Webhook processed successfully' });
    }

    // Handle other events (optional)
    console.log('Unhandled webhook event:', event.event);
    return NextResponse.json({ message: 'Event received' });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
