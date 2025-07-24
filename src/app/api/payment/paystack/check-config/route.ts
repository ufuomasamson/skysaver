import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Check if Paystack keys exist
    const { data: keys, error } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack');

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database error: ' + error.message
      }, { status: 500 });
    }

    const keyTypes = keys?.map(key => ({
      type: key.type,
      hasKey: !!key.api_key,
      keyLength: key.api_key ? key.api_key.length : 0,
      keyPrefix: key.api_key ? key.api_key.substring(0, 10) + '...' : 'Not set'
    })) || [];

    return NextResponse.json({
      success: true,
      message: 'Paystack configuration check',
      keysFound: keys?.length || 0,
      keys: keyTypes,
      hasTestSecret: keyTypes.some(k => k.type === 'test_secret' && k.hasKey),
      hasTestPublic: keyTypes.some(k => k.type === 'test_public' && k.hasKey)
    });

  } catch (error: any) {
    console.error('Config check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check configuration: ' + error.message
    }, { status: 500 });
  }
}
