import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function POST(request: Request) {
  try {
    const { currency = 'EUR', amount = 100 } = await request.json();

    // Get Flutterwave API keys
    const { data: apiKeys, error: keysError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('name', 'flutterwave');

    if (keysError || !apiKeys || apiKeys.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway not configured'
      }, { status: 500 });
    }

    const testSecretKey = apiKeys.find(k => k.type === 'test_secret')?.api_key;

    if (!testSecretKey) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateway keys not configured'
      }, { status: 500 });
    }

    // Generate unique transaction reference
    const txRef = `TEST_CURRENCY_${Date.now()}`;

    // Test different payment data formats
    const testCases = [
      {
        name: 'Basic v3 format',
        data: {
          tx_ref: txRef,
          amount: amount,
          currency: currency.toUpperCase(),
          redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/test_currency.html`,
          customer: {
            email: 'test@example.com',
            name: 'Test Customer',
            phone_number: '+1234567890'
          },
          customizations: {
            title: 'Currency Test',
            description: 'Testing currency enforcement',
            logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
          }
        }
      },
      {
        name: 'With payment_options',
        data: {
          tx_ref: txRef + '_1',
          amount: amount,
          currency: currency.toUpperCase(),
          redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/test_currency.html`,
          customer: {
            email: 'test@example.com',
            name: 'Test Customer',
            phone_number: '+1234567890'
          },
          customizations: {
            title: 'Currency Test',
            description: 'Testing currency enforcement',
            logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
          },
          payment_options: 'card,banktransfer,ussd'
        }
      },
      {
        name: 'With meta currency',
        data: {
          tx_ref: txRef + '_2',
          amount: amount,
          currency: currency.toUpperCase(),
          redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/test_currency.html`,
          customer: {
            email: 'test@example.com',
            name: 'Test Customer',
            phone_number: '+1234567890'
          },
          customizations: {
            title: 'Currency Test',
            description: 'Testing currency enforcement',
            logo: `${process.env.NEXT_PUBLIC_BASE_URL}/logo.png`
          },
          meta: {
            currency: currency.toUpperCase()
          }
        }
      }
    ];

    const results = [];

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name}`);
      console.log('Request data:', JSON.stringify(testCase.data, null, 2));

      try {
        const response = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testSecretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.data)
        });

        const result = await response.json();
        
        console.log(`Response for ${testCase.name}:`, JSON.stringify(result, null, 2));
        
        results.push({
          testCase: testCase.name,
          success: response.ok,
          status: response.status,
          data: result,
          paymentUrl: result.data?.link
        });
      } catch (error) {
        console.error(`Error in ${testCase.name}:`, error);
        results.push({
          testCase: testCase.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return NextResponse.json({
      success: true,
      currency: currency.toUpperCase(),
      amount: amount,
      results: results
    });

  } catch (error: any) {
    console.error('Currency test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 