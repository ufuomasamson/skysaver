import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();

    console.log('Starting database migration to add payment columns...');

    // Read the migration SQL
    const migrationSQL = `
      -- Add transaction reference column
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(64);

      -- Add payment status column
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending';

      -- Add payment method column
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32);

      -- Add payment transaction ID from payment gateway
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(128);

      -- Add flight amount and currency for payment tracking
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_amount DECIMAL(12,2);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'USD';

      -- Add status column for booking status
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending';

      -- Add updated_at column for tracking changes
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `;

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      
      // Try running individual commands if the RPC fails
      const commands = [
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(64)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'pending'",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_transaction_id VARCHAR(128)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_amount DECIMAL(12,2)",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency VARCHAR(8) DEFAULT 'USD'",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'pending'",
        "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"
      ];

      const results = [];
      for (const command of commands) {
        try {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command });
          results.push({
            command,
            success: !cmdError,
            error: cmdError?.message
          });
          console.log(`Command result: ${command} - ${cmdError ? 'FAILED' : 'SUCCESS'}`);
        } catch (e) {
          results.push({
            command,
            success: false,
            error: e.message
          });
        }
      }

      return NextResponse.json({
        success: false,
        error: 'Migration partially completed',
        details: results
      }, { status: 500 });
    }

    console.log('Migration completed successfully');

    // Verify the columns exist
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'bookings');

    if (verifyError) {
      console.error('Failed to verify columns:', verifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      columns: columns?.map(c => c.column_name) || []
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Migration failed'
    }, { status: 500 });
  }
}
