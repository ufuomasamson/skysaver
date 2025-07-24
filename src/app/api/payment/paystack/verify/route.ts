import { NextResponse } from 'next/server';
import https from 'https';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

// Helper function to fetch Paystack secret key from database
async function getPaystackSecretKey(): Promise<string> {
  const supabase = createServerSupabaseClient();
  
  const { data: keys, error } = await supabase
    .from(TABLES.PAYMENT_GATEWAYS)
    .select('*')
    .eq('name', 'paystack')
    .eq('type', 'live_secret'); // Use live key for production

  if (error || !keys || keys.length === 0) {
    throw new Error('Paystack live secret key not found. Please configure in admin dashboard.');
  }

  return keys[0].api_key;
}

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

    // Get Paystack secret key from database
    let PAYSTACK_SECRET_KEY;
    try {
      PAYSTACK_SECRET_KEY = await getPaystackSecretKey();
    } catch (keyError) {
      console.error('Failed to get Paystack secret key:', keyError);
      return NextResponse.json({
        success: false,
        error: 'Paystack configuration not found. Please configure API keys in admin dashboard.'
      }, { status: 500 });
    }

    // Verify payment with Paystack using direct HTTPS request
    const verificationResult = await makePaystackRequest(`/transaction/verify/${reference}`, null, PAYSTACK_SECRET_KEY, 'GET');

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
    // Paystack returns amounts in kobo (for NGN) or smallest currency unit
    const paidAmountInOriginalCurrency = paymentData.currency === 'NGN' 
      ? paymentData.amount / 100  // Convert kobo to naira
      : paymentData.amount / 100; // Convert cents to main currency unit
    
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

// Helper function to make requests to Paystack API
function makePaystackRequest(endpoint: string, data: any, secretKey: string, method: string = 'POST'): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...(method === 'POST' && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          resolve(parsedResponse);
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (method === 'POST' && postData) {
      req.write(postData);
    }
    req.end();
  });
}
