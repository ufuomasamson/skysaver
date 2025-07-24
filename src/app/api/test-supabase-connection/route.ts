import { NextResponse } from 'next/server';
import { createServerSupabaseClient, supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    const startTime = Date.now();
    
    // Create server-side Supabase client
    const serverSupabase = createServerSupabaseClient();
    
    // Try to get the database schema version
    const { data: version, error: versionError } = await serverSupabase.from('pg_stat_statements').select('version()').limit(1).single();
    
    if (versionError) {
      // Try a simpler query if pg_stat_statements fails
      const { data, error } = await serverSupabase.from('flights').select('count(*)').single();
      
      if (error) {
        throw new Error(`Supabase query failed: ${error.message}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return NextResponse.json({
        success: true,
        message: 'Supabase connection test successful',
        data: {
          count: data,
          duration: `${duration}ms`
        }
      });
    }
    
    // Try to list tables
    const { data: tables, error: tablesError } = await serverSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection test successful',
      data: {
        version,
        tables: tables?.map(t => t.table_name),
        duration: `${duration}ms`
      }
    });
  } catch (error: any) {
    console.error('Supabase connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Supabase connection test failed',
      error: error.message
    }, { status: 500 });
  }
}
