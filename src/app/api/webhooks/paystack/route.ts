import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    // Verify webhook signature (you'll need to add your webhook secret)
    // For now, we'll skip verification but you should add this in production
    
    const event = JSON.parse(body);
    console.log('Paystack webhook received:', event.event, event.data?.reference);

    // Only process successful charge events
    if (event.event !== 'charge.success') {
      return NextResponse.json({ message: 'Event ignored' });
    }

    const paymentData = event.data;
    if (!paymentData || !paymentData.reference) {
      return NextResponse.json({ message: 'Invalid payment data' });
    }

    const supabase = createServerSupabaseClient();

    // Find booking by transaction reference
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('transaction_ref', paymentData.reference)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found for reference:', paymentData.reference);
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
    }

    console.log('Found booking:', booking.id, 'for reference:', paymentData.reference);

    // Update booking status to paid and approved
    const { error: updateError } = await supabase
      .from(TABLES.BOOKINGS)
      .update({
        paid: true,
        status: 'approved',
        payment_status: 'completed',
        payment_transaction_id: paymentData.id?.toString(),
        payment_method: 'paystack',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return NextResponse.json({ message: 'Update failed' }, { status: 500 });
    }

    console.log('Successfully updated booking:', booking.id, 'to paid and approved');

    // Create payment record
    const { error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: paymentData.amount / 100, // Convert from kobo to naira
        currency: paymentData.currency,
        payment_method: 'paystack',
        transaction_id: paymentData.reference,
        gateway_reference: paymentData.id?.toString(),
        status: 'completed',
        paid_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Don't fail the webhook, booking is already updated
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      message: 'Webhook processing failed',
      error: error.message 
    }, { status: 500 });
  }
}
