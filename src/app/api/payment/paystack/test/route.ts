import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if Paystack API key is configured
    const { data: gateway, error } = await supabase
      .from('payment_gateways')
      .select('api_key')
      .eq('name', 'Paystack')
      .single();

    if (error || !gateway?.api_key) {
      return NextResponse.json(
        { available: false, error: 'Paystack not configured' },
        { status: 404 }
      );
    }

    // If we have an API key, Paystack is available
    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking Paystack availability:', error);
    return NextResponse.json(
      { available: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
