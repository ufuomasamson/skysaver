import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Testing Paystack payment gateway configuration...');
    
    const supabase = createServerSupabaseClient();
    
    // Check if payment_gateways table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateways table not accessible',
        details: tableError
      }, { status: 500 });
    }

    // Get all Paystack keys
    const { data: keys, error: keysError } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack');
    
    if (keysError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Paystack API keys',
        details: keysError
      }, { status: 500 });
    }

    // Check what keys are available
    const availableKeys = keys?.map(k => ({
      type: k.type,
      hasKey: !!k.api_key,
      keyLength: k.api_key?.length || 0,
      keyPrefix: k.api_key?.substring(0, 8) || 'none'
    })) || [];

    const hasTestSecret = availableKeys.some(k => k.type === 'test_secret' && k.hasKey);
    const hasLiveSecret = availableKeys.some(k => k.type === 'live_secret' && k.hasKey);
    const hasAnySecret = hasTestSecret || hasLiveSecret;

    return NextResponse.json({
      success: true,
      message: hasAnySecret ? 'Paystack payment gateway is configured' : 'Paystack payment gateway needs configuration',
      configuration: {
        totalKeys: keys?.length || 0,
        hasTestSecret,
        hasLiveSecret,
        hasAnySecret,
        availableKeys
      },
      instructions: !hasAnySecret ? {
        message: 'Please configure Paystack API keys',
        steps: [
          '1. Go to /admin/integrations',
          '2. Add your Paystack test_secret or live_secret key',
          '3. Keys should start with sk_test_ or sk_live_',
          '4. Save the configuration'
        ]
      } : null
    });

  } catch (error: any) {
    console.error('Test Paystack keys error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
