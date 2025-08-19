import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    console.log('Adding payment columns to bookings table...');

    // Since Supabase doesn't allow direct SQL execution, we'll use a different approach
    // Let's check if we can modify the table structure through the API

    // First, let's see the current structure
    const { data: testBooking, error: testError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('Error checking bookings table:', testError);
      return NextResponse.json({
        success: false,
        error: 'Cannot access bookings table',
        details: testError.message
      }, { status: 500 });
    }

    console.log('Current bookings table structure:', Object.keys(testBooking?.[0] || {}));

    // Try to insert a test record with new columns to see what's missing
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      flight_id: 1,
      passenger_name: 'Test Migration',
      transaction_ref: 'test_migration_ref',
      payment_status: 'pending',
      payment_method: 'test',
      payment_transaction_id: 'test_txn',
      flight_amount: 100.00,
      currency: 'USD',
      status: 'pending'
    };

    // This will fail if columns don't exist
    const { error: insertError } = await supabase
      .from('bookings')
      .insert(testData);

    if (insertError) {
      console.log('Missing columns detected:', insertError.message);
      
      return NextResponse.json({
        success: false,
        error: 'Migration needed - missing columns detected',
        missingColumns: extractMissingColumns(insertError.message),
        suggestion: 'Please run the SQL migration manually in Supabase dashboard',
        sqlCommands: [
          "ALTER TABLE bookings ADD COLUMN transaction_ref VARCHAR(64);",
          "ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(32) DEFAULT 'pending';",
          "ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(32);",
          "ALTER TABLE bookings ADD COLUMN payment_transaction_id VARCHAR(128);",
          "ALTER TABLE bookings ADD COLUMN flight_amount DECIMAL(12,2);",
          "ALTER TABLE bookings ADD COLUMN currency VARCHAR(8) DEFAULT 'USD';",
          "ALTER TABLE bookings ADD COLUMN status VARCHAR(32) DEFAULT 'pending';",
          "ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;"
        ]
      }, { status:400 });
    }

    // Clean up test record
    await supabase
      .from('bookings')
      .delete()
      .eq('passenger_name', 'Test Migration');

    return NextResponse.json({
      success: true,
      message: 'All required columns already exist',
      currentStructure: Object.keys(testBooking?.[0] || {})
    });

  } catch (error: any) {
    console.error('Check columns error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check table structure'
    }, { status: 500 });
  }
}

function extractMissingColumns(errorMessage: string): string[] {
  const columnMatches = errorMessage.match(/column "([^"]+)" of relation "bookings" does not exist/g);
  if (columnMatches) {
    return columnMatches.map(match => {
      const columnMatch = match.match(/column "([^"]+)"/);
      return columnMatch ? columnMatch[1] : '';
    }).filter(Boolean);
  }
  return [];
}
