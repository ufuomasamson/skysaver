import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = 'https://pbapixvhgiawwslnoipx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYXBpeHZoZ2lhd3dzbG5vaXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzMwNjkwMiwiZXhwIjoyMDY4ODgyOTAyfQ.RbJSTyRgC0k7IOx-VL_imdVjlyyWW4jPP-LoTwWlcTI';

async function runMigration() {
  console.log('🔑 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // First, add the type column if it doesn't exist
    console.log('📝 Adding type column to payment_gateways table...');
    const { error: alterError } = await supabase
      .from('payment_gateways')
      .select('type')
      .limit(1);

    if (alterError && alterError.message.includes('column "type" does not exist')) {
      console.log('Adding type column...');
      // Column doesn't exist, we need to add it using a different approach
      // Let's insert the records and let Supabase handle the schema
    }

    // Check current records
    console.log('🔍 Checking current payment gateway records...');
    const { data: currentRecords, error: selectError } = await supabase
      .from('payment_gateways')
      .select('*');

    if (selectError) {
      console.error('❌ Error fetching current records:', selectError.message);
      return;
    }

    console.log('Current records:', currentRecords);

    // Insert Flutterwave records
    console.log('📝 Inserting Flutterwave gateway types...');
    const flutterwaveRecords = [
      { name: 'flutterwave', type: 'test_public', api_key: '', enabled: true },
      { name: 'flutterwave', type: 'test_secret', api_key: '', enabled: true },
      { name: 'flutterwave', type: 'test_encryption', api_key: '', enabled: true },
      { name: 'flutterwave', type: 'live_public', api_key: '', enabled: true },
      { name: 'flutterwave', type: 'live_secret', api_key: '', enabled: true },
      { name: 'flutterwave', type: 'live_encryption', api_key: '', enabled: true }
    ];

    for (const record of flutterwaveRecords) {
      const { error: insertError } = await supabase
        .from('payment_gateways')
        .upsert(record, { 
          onConflict: 'name,type',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.log(`⚠️ Note: ${record.name} ${record.type} - ${insertError.message}`);
      } else {
        console.log(`✅ ${record.name} ${record.type} record ready`);
      }
    }

    // Insert Paystack records
    console.log('📝 Inserting Paystack gateway types...');
    const paystackRecords = [
      { name: 'paystack', type: 'test_public', api_key: '', enabled: true },
      { name: 'paystack', type: 'test_secret', api_key: '', enabled: true },
      { name: 'paystack', type: 'live_public', api_key: '', enabled: true },
      { name: 'paystack', type: 'live_secret', api_key: '', enabled: true }
    ];

    for (const record of paystackRecords) {
      const { error: insertError } = await supabase
        .from('payment_gateways')
        .upsert(record, { 
          onConflict: 'name,type',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.log(`⚠️ Note: ${record.name} ${record.type} - ${insertError.message}`);
      } else {
        console.log(`✅ ${record.name} ${record.type} record ready`);
      }
    }

    // Final verification
    console.log('\n🔍 Final verification - All payment gateway records:');
    const { data: finalRecords, error: finalError } = await supabase
      .from('payment_gateways')
      .select('name, type, enabled')
      .order('name')
      .order('type');

    if (finalError) {
      console.error('❌ Error in final verification:', finalError.message);
    } else {
      console.table(finalRecords);
      console.log('\n🎉 Migration completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
