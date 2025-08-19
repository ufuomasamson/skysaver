import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment verify endpoint is accessible'
  });
}

export async function POST(request: Request) {
  try {
    const { tx_ref, transaction_id } = await request.json();

    if (!tx_ref) {
      return NextResponse.json({
        success: false,
        error: 'Transaction reference is required'
      }, { status: 400 });
    }

    // Get Flutterwave API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('name', 'flutterwave');

    console.log('API keys query result:', { apiKeys, keysError });

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch payment gateway configuration'
      }, { status: 500 });
    }

    if (!apiKeys || apiKeys.length === 0) {
      console.error('No API keys found for flutterwave');
      return NextResponse.json({
        success: false,
        error: 'Payment gateway not configured. Please configure Flutterwave API keys in the admin panel.'
      }, { status: 500 });
    }

    const testSecretKey = apiKeys.find(k => k.type === 'test_secret')?.api_key;
    const liveSecretKey = apiKeys.find(k => k.type === 'live_secret')?.api_key;

    console.log('Found keys:', {
      testSecretKey: testSecretKey ? 'Present' : 'Missing',
      liveSecretKey: liveSecretKey ? 'Present' : 'Missing',
      availableTypes: apiKeys.map(k => k.type)
    });

    // Use test key if available, otherwise use live key
    const secretKey = testSecretKey || liveSecretKey;

    if (!secretKey) {
      console.error('No secret key found. Available types:', apiKeys.map(k => k.type));
      return NextResponse.json({
        success: false,
        error: 'Payment gateway secret key not configured. Please add test_secret or live_secret key in admin panel.'
      }, { status: 500 });
    }

    // Verify payment with Flutterwave
    // First try with transaction_id if available, then fallback to tx_ref
    let verifyId = tx_ref;
    if (transaction_id) {
      verifyId = transaction_id;
    }
    
    console.log('Verifying payment with ID:', verifyId);
    console.log('Original tx_ref:', tx_ref);
    console.log('Transaction ID:', transaction_id);
    
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${verifyId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Flutterwave verification response:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error('Flutterwave verification error:', result);
      return NextResponse.json({
        success: false,
        error: result.message || 'Payment verification failed'
      }, { status: 500 });
    }

    // Check if payment was successful
    if (result.status !== 'success' || result.data.status !== 'successful') {
      return NextResponse.json({
        success: false,
        error: 'Payment was not successful',
        data: result.data
      }, { status: 400 });
    }

    // Find booking by transaction reference - try multiple approaches
    let booking = null;
    let bookingError = null;
    let foundByTxRef = false;
    let foundByTransactionId = false;
    let foundByPaymentTransactionId = false;
    
    // First try to find by the original tx_ref
    const { data: bookingByTxRef, error: errorByTxRef } = await supabase
      .from('bookings')
      .select('*')
      .eq('transaction_ref', tx_ref)
      .single();
    
    if (bookingByTxRef) {
      booking = bookingByTxRef;
      foundByTxRef = true;
    } else {
      // If not found by tx_ref, try by transaction_id in transaction_ref field
      const { data: bookingByTransactionId, error: errorByTransactionId } = await supabase
        .from('bookings')
        .select('*')
        .eq('transaction_ref', transaction_id)
        .single();
      
      if (bookingByTransactionId) {
        booking = bookingByTransactionId;
        foundByTransactionId = true;
      } else {
        // If not found, try by payment_transaction_id field
        const { data: bookingByPaymentTransactionId, error: errorByPaymentTransactionId } = await supabase
          .from('bookings')
          .select('*')
          .eq('payment_transaction_id', transaction_id)
          .single();
        
        if (bookingByPaymentTransactionId) {
          booking = bookingByPaymentTransactionId;
          foundByPaymentTransactionId = true;
        } else {
          bookingError = errorByPaymentTransactionId;
        }
      }
    }

    console.log('Booking lookup result:', {
      tx_ref,
      transaction_id,
      foundByTxRef,
      foundByTransactionId,
      foundByPaymentTransactionId,
      booking: booking ? { 
        id: booking.id, 
        transaction_ref: booking.transaction_ref,
        payment_transaction_id: booking.payment_transaction_id,
        paid: booking.paid,
        payment_status: booking.payment_status,
        flight_amount: booking.flight_amount
      } : null
    });

    if (bookingError || !booking) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found for this transaction. Please contact support with your transaction reference.'
      }, { status: 404 });
    }

    // Update booking status and save transaction_id
    console.log('Updating booking with ID:', booking.id);
    // Flutterwave returns amounts in the base currency
    let flightAmount = result.data.amount;
    
    // Ensure the amount is properly formatted
    flightAmount = Math.round(flightAmount * 100) / 100;
    
    console.log('Flutterwave transaction data:', {
      original_amount: result.data.amount,
      currency: result.data.currency,
      charged_amount: result.data.charged_amount,
      calculated_flight_amount: flightAmount
    });
    console.log('Update data:', {
      payment_status: 'paid',
      payment_date: new Date().toISOString(),
      paid: true,
      payment_transaction_id: transaction_id,
      flight_amount: result.data.amount
    });

    const { data: updateData, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_date: new Date().toISOString(),
        paid: true,
        payment_transaction_id: transaction_id, // Save the actual Flutterwave transaction ID
        flight_amount: flightAmount // Use the calculated amount based on currency
      })
      .eq('id', booking.id)
      .select(); // Return the updated data

    console.log('Booking update result:', { updateData, updateError });

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking status: ' + updateError.message
      }, { status: 500 });
    }

    if (!updateData || updateData.length === 0) {
      console.error('No rows were updated');
      return NextResponse.json({
        success: false,
        error: 'No booking was updated'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        booking_id: booking.id,
        transaction_ref: verifyId,
        amount: result.data.amount,
        currency: result.data.currency,
        status: result.data.status
      }
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
} 