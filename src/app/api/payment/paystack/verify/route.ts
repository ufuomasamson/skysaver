import { NextResponse } from 'next/server';
import https from 'https';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';
import { PaymentLogger } from '@/lib/logger';

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
  const startTime = Date.now();
  let reference = 'unknown';
  
  try {
    // Parse request body
    const requestBody = await request.json();
    reference = requestBody.reference;
    
    PaymentLogger.paymentStart(reference, { 
      url: request.url,
      method: request.method,
      headers: {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent')
      }
    });

    if (!reference) {
      PaymentLogger.error('Missing transaction reference in request', { requestBody });
      return NextResponse.json({
        success: false,
        error: 'Transaction reference is required'
      }, { status: 400 });
    }

    PaymentLogger.debug('Processing payment verification', { reference });

    // Get Paystack secret key from database
    let PAYSTACK_SECRET_KEY;
    try {
      PAYSTACK_SECRET_KEY = await getPaystackSecretKey();
      PaymentLogger.debug('Successfully retrieved Paystack secret key from database');
    } catch (keyError) {
      PaymentLogger.error('Failed to get Paystack secret key', keyError);
      return NextResponse.json({
        success: false,
        error: 'Paystack configuration not found. Please configure API keys in admin dashboard.'
      }, { status: 500 });
    }

    // Verify payment with Paystack using direct HTTPS request
    PaymentLogger.paystackRequest(`/transaction/verify/${reference}`, 'GET', reference);
    const verificationResult = await makePaystackRequest(`/transaction/verify/${reference}`, null, PAYSTACK_SECRET_KEY, 'GET');
    
    PaymentLogger.paystackResponse(`/transaction/verify/${reference}`, 200, {
      status: verificationResult.status,
      message: verificationResult.message,
      dataExists: !!verificationResult.data
    });

    if (!verificationResult.status) {
      PaymentLogger.paymentError(reference, new Error('Paystack verification failed'), {
        paystackResponse: verificationResult
      });
      return NextResponse.json({
        success: false,
        error: verificationResult.message || 'Payment verification failed'
      }, { status: 400 });
    }

    const paymentData = verificationResult.data;
    if (!paymentData) {
      PaymentLogger.paymentError(reference, new Error('No payment data received'), {
        verificationResult
      });
      return NextResponse.json({
        success: false,
        error: 'No payment data received from Paystack'
      }, { status: 400 });
    }

    PaymentLogger.debug('Paystack verification response received', {
      reference,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      gateway_response: paymentData.gateway_response
    });

    // Check if payment was successful
    if (paymentData.status !== 'success') {
      PaymentLogger.paymentError(reference, new Error(`Payment not successful: ${paymentData.status}`), {
        paymentStatus: paymentData.status,
        gateway_response: paymentData.gateway_response
      });
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
    PaymentLogger.debug('Looking up booking by transaction reference', { reference });
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
      PaymentLogger.error('Booking not found for reference', { 
        reference, 
        error: bookingError,
        errorCode: bookingError?.code,
        errorMessage: bookingError?.message
      });
      return NextResponse.json({
        success: false,
        error: 'Booking not found for this transaction'
      }, { status: 404 });
    }

    PaymentLogger.debug('Booking found successfully', {
      reference,
      bookingId: booking.id,
      userId: booking.user_id,
      flightAmount: booking.flight_amount,
      currency: booking.currency,
      currentPaid: booking.paid
    });

    // Verify amount matches (convert from kobo)
    // Paystack returns amounts in kobo (for NGN) or smallest currency unit
    const paidAmountInOriginalCurrency = paymentData.currency === 'NGN' 
      ? paymentData.amount / 100  // Convert kobo to naira
      : paymentData.amount / 100; // Convert cents to main currency unit
    
    const expectedAmount = booking.flight_amount || booking.flights?.price || 0;
    
    PaymentLogger.debug('Amount verification starting', {
      reference,
      paid_amount_kobo: paymentData.amount,
      paid_amount_converted: paidAmountInOriginalCurrency,
      expected_amount: expectedAmount,
      currency: paymentData.currency
    });

    // Allow small differences due to currency conversion
    const amountDifference = Math.abs(paidAmountInOriginalCurrency - expectedAmount);
    if (amountDifference > 1) { // Allow 1 unit difference
      PaymentLogger.error('Amount mismatch detected', {
        reference,
        paid: paidAmountInOriginalCurrency,
        expected: expectedAmount,
        difference: amountDifference,
        currency: paymentData.currency
      });
      
      return NextResponse.json({
        success: false,
        error: `Payment amount mismatch. Paid: ${paidAmountInOriginalCurrency}, Expected: ${expectedAmount}`
      }, { status: 400 });
    }

    PaymentLogger.debug('Amount verification passed', {
      reference,
      paidAmount: paidAmountInOriginalCurrency,
      expectedAmount: expectedAmount,
      difference: amountDifference
    });

    // Update booking status to paid
    PaymentLogger.debug('Updating booking status to paid', { reference, bookingId: booking.id });
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
      PaymentLogger.databaseOperation('update booking', 'BOOKINGS', false, updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking status'
      }, { status: 500 });
    }

    PaymentLogger.databaseOperation('update booking', 'BOOKINGS', true);

    // Create a payment record for revenue tracking
    PaymentLogger.debug('Creating payment record', { reference, bookingId: booking.id });
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
      PaymentLogger.databaseOperation('insert payment', 'PAYMENTS', false, paymentError);
      // Don't fail the whole operation if payment record creation fails
      // The booking is still updated successfully
    } else {
      PaymentLogger.databaseOperation('insert payment', 'PAYMENTS', true);
    }

    const processingTime = Date.now() - startTime;
    PaymentLogger.paymentSuccess(reference, {
      bookingId: booking.id,
      amount: paidAmountInOriginalCurrency,
      currency: paymentData.currency,
      processingTimeMs: processingTime
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
    const processingTime = Date.now() - startTime;
    PaymentLogger.paymentError(reference, error, {
      processingTimeMs: processingTime,
      errorStack: error.stack
    });
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

    PaymentLogger.debug('Making Paystack API request', {
      endpoint,
      method,
      hostname: options.hostname,
      hasAuth: !!secretKey,
      hasData: !!data
    });

    const req = https.request(options, (res) => {
      let responseData = '';

      PaymentLogger.debug('Paystack response started', {
        endpoint,
        statusCode: res.statusCode,
        headers: res.headers
      });

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          PaymentLogger.debug('Paystack response completed', {
            endpoint,
            statusCode: res.statusCode,
            responseSize: responseData.length,
            success: parsedResponse.status
          });
          resolve(parsedResponse);
        } catch (error) {
          PaymentLogger.error('Failed to parse Paystack response', {
            endpoint,
            responseData: responseData.substring(0, 500), // First 500 chars
            parseError: error
          });
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      PaymentLogger.error('Paystack request failed', {
        endpoint,
        error: error.message,
        code: (error as any).code
      });
      reject(error);
    });

    req.on('timeout', () => {
      PaymentLogger.error('Paystack request timeout', { endpoint });
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set timeout to 30 seconds
    req.setTimeout(30000);

    if (method === 'POST' && postData) {
      req.write(postData);
    }
    req.end();
  });
}
