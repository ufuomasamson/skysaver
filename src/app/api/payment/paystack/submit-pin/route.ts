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
    // Get Paystack secret key from database
    const PAYSTACK_SECRET_KEY = await getPaystackSecretKey();
    
    const { pin, reference } = await request.json();

    if (!pin || !reference) {
      return NextResponse.json({
        success: false,
        error: 'PIN and reference are required'
      }, { status: 400 });
    }

    // Submit PIN to Paystack
    const submitPinData = {
      pin,
      reference
    };

    const paystackResponse = await makePaystackRequest('/charge/submit_pin', submitPinData, PAYSTACK_SECRET_KEY);

    if (!paystackResponse.status) {
      return NextResponse.json({
        success: false,
        error: paystackResponse.message || 'PIN submission failed'
      }, { status: 400 });
    }

    const { data } = paystackResponse;

    // Return response based on status
    switch (data.status) {
      case 'success':
        // Auto-approve booking for successful Paystack payments
        if (data.metadata && data.metadata.booking_id) {
          try {
            const supabase = createServerSupabaseClient();
            const { error: updateError } = await supabase
              .from(TABLES.BOOKINGS)
              .update({
                status: 'approved',
                paid: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.metadata.booking_id);

            if (updateError) {
              console.error('Failed to auto-approve booking:', updateError);
            } else {
              console.log('Booking automatically approved for successful Paystack payment:', data.metadata.booking_id);
            }
          } catch (bookingError) {
            console.error('Error auto-approving booking:', bookingError);
          }
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

      default:
        return NextResponse.json({
          success: false,
          error: `Unexpected status: ${data.status}`
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Paystack PIN submission error:', error);
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
