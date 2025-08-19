import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Basic connection & auth
    const startTime = Date.now();
    
    // Create server-side client
    const supabase = createServerSupabaseClient();
    
    // Test auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw authError;
    }
    
    // Test 2: Database query
    const { data: dbData, error: dbError } = await supabase
      .from(TABLES.CURRENCIES)
      .select('*')
      .limit(5);
      
    if (dbError) {
      throw dbError;
    }
    
    // Test 3: Storage buckets
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .listBuckets();
      
    if (bucketError) {
      throw bucketError;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection test successful',
      duration,
      auth: {
        session: !!authData.session,
        user: authData.session ? authData.session.user.email : null
      },
      database: {
        recordsReturned: dbData.length,
        tables: TABLES
      },
      storage: {
        buckets: bucketData.map(b => b.name)
      }
    });
    
  } catch (error: any) {
    console.error('Supabase test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      duration: Date.now() - Date.now()
    }, { status: 500 });
  }
}
