import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createServerSupabaseClient();

    // Get recent payment verifications with details
    let query = supabase
      .from(TABLES.BOOKINGS)
      .select(`
        id,
        transaction_ref,
        paid,
        status,
        payment_status,
        payment_method,
        payment_transaction_id,
        created_at,
        updated_at,
        flight_amount,
        currency,
        user_id,
        flights:flight_id (
          flight_number,
          price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (reference) {
      query = query.eq('transaction_ref', reference);
    }

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Get payment records
    const { data: payments, error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get recent Paystack configuration
    const { data: paystackConfig, error: configError } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', 'paystack');

    return NextResponse.json({
      success: true,
      data: {
        bookings: bookings || [],
        payments: payments || [],
        paystackConfig: paystackConfig || [],
        debug: {
          timestamp: new Date().toISOString(),
          searchParams: {
            reference,
            limit
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Payment debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
