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
    .eq('type', 'live_secret');

  if (error || !keys || keys.length === 0) {
    throw new Error('Paystack live secret key not found.');
  }

  return keys[0].api_key;
}

// Test Paystack connection
function testPaystackConnection(secretKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/bank',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
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
          resolve({
            statusCode: res.statusCode,
            response: parsedResponse
          });
        } catch (error) {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000); // 10 second timeout
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

export async function GET(request: Request) {
  try {
    PaymentLogger.info('Testing Paystack connection');

    // Get Paystack secret key
    let secretKey;
    try {
      secretKey = await getPaystackSecretKey();
      PaymentLogger.debug('Secret key retrieved', {
        keyExists: !!secretKey,
        keyLength: secretKey?.length
      });
    } catch (keyError) {
      PaymentLogger.error('Failed to get secret key', keyError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get Paystack secret key',
        details: keyError.message
      }, { status: 500 });
    }

    // Test connection to Paystack
    try {
      const testResult = await testPaystackConnection(secretKey);
      PaymentLogger.info('Paystack connection test result', {
        statusCode: testResult.statusCode,
        success: testResult.response?.status
      });

      return NextResponse.json({
        success: true,
        message: 'Paystack connection test completed',
        data: {
          statusCode: testResult.statusCode,
          paystackStatus: testResult.response?.status,
          paystackMessage: testResult.response?.message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (connectionError) {
      PaymentLogger.error('Paystack connection test failed', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Paystack API',
        details: connectionError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    PaymentLogger.error('Connection test error', error);
    return NextResponse.json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    }, { status: 500 });
  }
}
