import { NextResponse } from 'next/server';
import { PaystackService } from '@/lib/paystackService';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Transaction reference is required'
      }, { status: 400 });
    }

    console.log('Verifying Paystack payment with reference:', reference);

    // Verify payment with Paystack
    const verificationResult = await PaystackService.verifyPayment(reference);

    if (!verificationResult.status) {
      return NextResponse.json({
        success: false,
        error: verificationResult.message || 'Payment verification failed'
      }, { status: 400 });
    }

    const paymentData = verificationResult.data;
    if (!paymentData) {
      return NextResponse.json({
        success: false,
        error: 'No payment data received from Paystack'
      }, { status: 400 });
    }

    console.log('Paystack verification response:', {
      status: paymentData.status,
      reference: paymentData.reference,
      amount: paymentData.amount,
      currency: paymentData.currency
    });

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      return NextResponse.json({
        success: false,
        error: `Payment was not successful. Status: ${paymentData.status}`,
        data: {
          status: paymentData.status,
          gateway_response: paymentData.gateway_response
        }
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find booking by transaction reference
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .select(`
        *,
        flights:flight_id (
          id,
          flight_number,
          airline_id,
          departure_location_id,
          arrival_location_id,
          date,
          time,
          price
        )
      `)
      .eq('transaction_ref', reference)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found for reference:', reference, bookingError);
      return NextResponse.json({
        success: false,
        error: 'Booking not found for this transaction'
      }, { status: 404 });
    }

    // Verify amount matches (convert from kobo)
    const paidAmountInOriginalCurrency = PaystackService.convertKoboToAmount(
      paymentData.amount, 
      paymentData.currency
    );
    
    const expectedAmount = booking.flight_amount || booking.flights?.price || 0;
    
    console.log('Amount verification:', {
      paid_amount_kobo: paymentData.amount,
      paid_amount_converted: paidAmountInOriginalCurrency,
      expected_amount: expectedAmount,
      currency: paymentData.currency
    });

    // Allow small differences due to currency conversion
    const amountDifference = Math.abs(paidAmountInOriginalCurrency - expectedAmount);
    if (amountDifference > 1) { // Allow 1 unit difference
      console.error('Amount mismatch:', {
        paid: paidAmountInOriginalCurrency,
        expected: expectedAmount,
        difference: amountDifference
      });
      
      return NextResponse.json({
        success: false,
        error: `Payment amount mismatch. Paid: ${paidAmountInOriginalCurrency}, Expected: ${expectedAmount}`
      }, { status: 400 });
    }

    // Update booking status to paid
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
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking status'
      }, { status: 500 });
    }

    // Create a payment record for revenue tracking
    const { error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: paidAmountInOriginalCurrency,
        currency: booking.currency || 'USD',
        payment_method: 'paystack',
        status: 'approved', // Paystack payments are automatically approved
        payment_reference: reference,
        payment_transaction_id: paymentData.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Don't fail the whole operation if payment record creation fails
      // The booking is still updated successfully
    }

    console.log('Payment verified and booking updated successfully:', {
      booking_id: booking.id,
      amount: paidAmountInOriginalCurrency,
      currency: paymentData.currency,
      reference: reference
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        booking_id: booking.id,
        transaction_ref: reference,
        amount: paidAmountInOriginalCurrency,
        currency: paymentData.currency,
        status: 'confirmed',
        payment_method: 'paystack',
        gateway_response: paymentData.gateway_response
      }
    });

  } catch (error: any) {
    console.error('Paystack payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment verification failed'
    }, { status: 500 });
  }
}
