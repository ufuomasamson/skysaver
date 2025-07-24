import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function POST() {
  try {
    console.log('Running database migration...');
    
    // Add flight_amount column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_amount DECIMAL(10,2);
        
        -- Update existing bookings to set flight_amount based on the flight price
        UPDATE bookings 
        SET flight_amount = (
          SELECT price 
          FROM flights 
          WHERE flights.id = bookings.flight_id
        )
        WHERE flight_amount IS NULL AND flight_id IS NOT NULL;
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_bookings_flight_amount ON bookings(flight_amount);
      `
    });

    if (alterError) {
      console.error('Migration error:', alterError);
      return NextResponse.json({
        success: false,
        error: 'Migration failed: ' + alterError.message
      }, { status: 500 });
    }

    // Verify the migration worked
    const { data: bookings, error: verifyError } = await supabase
      .from('bookings')
      .select('id, flight_amount, paid, payment_status')
      .limit(5);

    if (verifyError) {
      return NextResponse.json({
        success: false,
        error: 'Verification failed: ' + verifyError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      sampleBookings: bookings
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 