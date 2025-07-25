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

interface PaystackChargeRequest {
  email: string;
  amount: number;
  currency: string;
  bookingId: string;
  userId: string;
  card: {
    number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
  };
}

export async function POST(request: Request) {
  try {
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
    
    const body: PaystackChargeRequest = await request.json();
    
    const { email, amount, currency, bookingId, userId, card } = body;

    // Validate required fields
    if (!email || !amount || !currency || !bookingId || !userId || !card) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate currency is supported by Paystack merchant
    const supportedCurrencies = ['NGN']; // Only NGN for this implementation
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json({
        success: false,
        error: `Currency ${currency} not supported. This endpoint only accepts NGN. Currency conversion should be handled on the client side.`
      }, { status: 400 });
    }

    // Convert amount to smallest currency unit (kobo for NGN)
    const amountInSmallestUnit = Math.round(amount * 100);

    // Prepare payload for Paystack charge
    const chargeData = {
      email,
      amount: amountInSmallestUnit,
      currency,
      card: {
        number: card.number,
        cvv: card.cvv,
        expiry_month: card.expiry_month,
        expiry_year: card.expiry_year
      },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mazoairways.vercel.app'}/payment/callback`,
      metadata: {
        booking_id: bookingId,
        user_id: userId,
        payment_method: 'inline_card'
      }
    };

    // Make request to Paystack charge endpoint
    const paystackResponse = await makePaystackRequest('/charge', chargeData, PAYSTACK_SECRET_KEY);

    console.log('Paystack Response:', JSON.stringify(paystackResponse, null, 2));

    if (!paystackResponse.status) {
      console.error('Paystack Error Response:', paystackResponse);
      return NextResponse.json({
        success: false,
        error: paystackResponse.message || 'Payment failed',
        details: paystackResponse.data || null
      }, { status: 400 });
    }

    const { data } = paystackResponse;
    
    // Store payment session for multi-step authentication (PIN/OTP)
    if (data.reference && (data.status === 'send_pin' || data.status === 'send_otp')) {
      try {
        const supabase = createServerSupabaseClient();
        // Store temporary payment session - first check if table exists, if not continue without it
        try {
          await supabase
            .from('payment_sessions')
            .upsert({
              payment_reference: data.reference,
              booking_id: bookingId,
              user_id: userId,
              created_at: new Date().toISOString()
            }, { 
              onConflict: 'payment_reference'
            });
          console.log('Payment session stored for reference:', data.reference);
        } catch (tableError) {
          // Table might not exist, store in memory as fallback
          console.warn('Payment sessions table not available, continuing without session storage');
        }
      } catch (sessionError) {
        console.error('Failed to store payment session:', sessionError);
        // Don't fail the payment, just log the error
      }
    }
    
    // Return response based on status
    switch (data.status) {
      case 'success':
        // Auto-approve booking for successful Paystack payments
        try {
          const supabase = createServerSupabaseClient();
          const { error: updateError } = await supabase
            .from(TABLES.BOOKINGS)
            .update({
              status: 'approved',
              paid: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', body.bookingId);

          if (updateError) {
            console.error('Failed to auto-approve booking:', updateError);
            // Don't fail the payment, just log the error
          } else {
            console.log('Booking automatically approved for successful Paystack payment:', body.bookingId);
          }
        } catch (bookingError) {
          console.error('Error auto-approving booking:', bookingError);
          // Don't fail the payment, just log the error
        }

        return NextResponse.json({
          success: true,
          status: 'success',
          data: {
            reference: data.reference,
            status: data.status,
            message: 'Payment successful'
          }
        });

      case 'send_pin':
        return NextResponse.json({
          success: true,
          status: 'send_pin',
          data: {
            reference: data.reference,
            message: 'Please provide your card PIN'
          }
        });

      case 'send_otp':
        return NextResponse.json({
          success: true,
          status: 'send_otp',
          data: {
            reference: data.reference,
            message: 'Please provide the OTP sent to your phone'
          }
        });

      case 'pending':
        return NextResponse.json({
          success: true,
          status: 'pending',
          data: {
            reference: data.reference,
            message: 'Transaction is being processed'
          }
        });

      case 'open_url':
        return NextResponse.json({
          success: true,
          status: 'open_url',
          data: {
            reference: data.reference,
            url: data.url,
            message: '3D Secure authentication required'
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unexpected status: ${data.status}`,
          data: {
            reference: data.reference,
            status: data.status
          }
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Paystack charge error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Helper function to make requests to Paystack API
function makePaystackRequest(endpoint: string, data: any, secretKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: endpoint,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

    req.write(postData);
    req.end();
  });
}
