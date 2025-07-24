import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET() {
  try {
    console.log('Testing payment gateway configuration...');
    
    // Check if payment_gateways table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('payment_gateways')
      .select('*')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Payment gateways table not accessible',
        details: tableError
      }, { status: 500 });
    }

    // Get all Flutterwave keys
    const { data: keys, error: keysError } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('name', 'flutterwave');
    
    if (keysError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch API keys',
        details: keysError
      }, { status: 500 });
    }

    // Check what keys are available
    const availableKeys = keys?.map(k => ({
      type: k.type,
      hasKey: !!k.api_key,
      keyLength: k.api_key?.length || 0
    })) || [];

    const hasTestSecret = availableKeys.some(k => k.type === 'test_secret' && k.hasKey);
    const hasLiveSecret = availableKeys.some(k => k.type === 'live_secret' && k.hasKey);
    const hasAnySecret = hasTestSecret || hasLiveSecret;

    return NextResponse.json({
      success: true,
      message: hasAnySecret ? 'Payment gateway is configured' : 'Payment gateway needs configuration',
      configuration: {
        totalKeys: keys?.length || 0,
        hasTestSecret,
        hasLiveSecret,
        hasAnySecret,
        availableKeys
      },
      instructions: !hasAnySecret ? {
        message: 'Please configure Flutterwave API keys',
        steps: [
          '1. Go to /admin/integrations',
          '2. Add your Flutterwave test_secret or live_secret key',
          '3. Save the configuration'
        ]
      } : null
    });

  } catch (error: any) {
    console.error('Test keys error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 