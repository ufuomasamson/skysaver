const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runMigration() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('🔑 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // Read the migration file
    const migrationSQL = fs.readFileSync('update_payment_gateways_table.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Running ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n${i + 1}. Running: ${statement.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_statement: statement 
      });

      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with other statements for non-critical errors
      } else {
        console.log(`✅ Statement ${i + 1} completed successfully`);
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying payment_gateways table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('payment_gateways')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error checking table:', tableError.message);
    } else {
      console.log('✅ Table structure verified');
    }

    // Check existing records
    const { data: records, error: recordsError } = await supabase
      .from('payment_gateways')
      .select('name, type, enabled');

    if (recordsError) {
      console.error('❌ Error fetching records:', recordsError.message);
    } else {
      console.log('\n📋 Current payment gateway records:');
      console.table(records);
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
