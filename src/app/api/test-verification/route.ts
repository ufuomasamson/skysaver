import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    console.log('Testing database columns...');

    // Test if we can query the new columns
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, transaction_ref, payment_status, payment_method, payment_transaction_id, flight_amount, currency, status, updated_at')
      .limit(1);

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: error.message,
        suggestion: 'Check if columns were added correctly'
      }, { status: 500 });
    }

    console.log('Successfully queried new columns');

    // Test if we can insert a record with the new columns
    const testBooking = {
      user_id: '00000000-0000-0000-0000-000000000000',
      flight_id: 1,
      passenger_name: 'Test Verification',
      transaction_ref: 'test_ref_' + Date.now(),
      payment_status: 'pending',
      payment_method: 'paystack',
      payment_transaction_id: 'test_txn_' + Date.now(),
      flight_amount: 150.00,
      currency: 'USD',
      status: 'pending'
    };

    const { data: insertedBooking, error: insertError } = await supabase
      .from('bookings')
      .insert(testBooking)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert test booking',
        details: insertError.message
      }, { status: 500 });
    }

    console.log('Successfully inserted test booking:', insertedBooking.id);

    // Clean up test record
    await supabase
      .from('bookings')
      .delete()
      .eq('id', insertedBooking.id);

    return NextResponse.json({
      success: true,
      message: 'All payment columns are working correctly!',
      testedColumns: [
        'transaction_ref',
        'payment_status', 
        'payment_method',
        'payment_transaction_id',
        'flight_amount',
        'currency',
        'status',
        'updated_at'
      ],
      insertedBookingId: insertedBooking.id
    });

  } catch (error: any) {
    console.error('Test verification error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Test failed'
    }, { status: 500 });
  }
}
