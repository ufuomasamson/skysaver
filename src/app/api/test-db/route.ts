import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Testing Supabase database connection...');
    
    // Test 1: Basic connection
    const startTime = Date.now();
    
    // Create server-side client
    const supabase = createServerSupabaseClient();
    
    // Test 2: Simple select
    const { data: testData, error } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .limit(1);
      
    if (error) {
      throw error;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('Database test completed in', duration, 'ms');
    console.log('Test result:', { testData });
    
    // Test 3: Try a simple insert/update
    const testKey = {
      name: 'test_connection',
      type: 'test_type',
      api_key: 'test_key_' + Date.now()
    };
    
    console.log('Attempting insert with data:', testKey);
    
    let insertData;
    let insertId;
    
    try {
      // Check if document already exists
      const { data: existingDocs } = await supabase
        .from(TABLES.PAYMENT_GATEWAYS)
        .select('*')
        .eq('name', testKey.name)
        .eq('type', testKey.type);
      
      if (existingDocs && existingDocs.length > 0) {
        // Update existing
        insertId = existingDocs[0].id;
        const { data } = await supabase
          .from(TABLES.PAYMENT_GATEWAYS)
          .update(testKey)
          .eq('id', insertId)
          .select()
          .single();
          
      } else {
        // Create new
        const { data } = await supabase
          .from(TABLES.PAYMENT_GATEWAYS)
          .insert(testKey)
          .select()
          .single();
          
        insertData = data;
        insertId = data.id;
      }
      
      console.log('Insert result successful:', insertData);
      
      // Test 4: Verify the insert/update
      const { data: verifyData } = await supabase
        .from(TABLES.PAYMENT_GATEWAYS)
        .select('*')
        .eq('id', insertId)
        .single();
      
      console.log('Verify result:', verifyData);
      
      // Test 5: Delete the test data
      await supabase
        .from(TABLES.PAYMENT_GATEWAYS)
        .delete()
        .eq('id', insertId);
      
      console.log('Delete successful');
      
      return NextResponse.json({
        success: true,
        message: 'Database connection tests completed successfully',
        duration,
        testData: testData?.length || 0,
        insertSuccess: true,
        verifySuccess: !!verifyData,
        deleteSuccess: true
      });
      
    } catch (error: any) {
      console.error('Test error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Database test failed',
        duration
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      duration: Date.now() - Date.now()
    }, { status: 500 });
  }
} 