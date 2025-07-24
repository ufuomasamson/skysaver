import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gateway = searchParams.get('gateway');
    
    if (!gateway) {
      return NextResponse.json({
        success: false,
        error: 'Gateway parameter is required'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Fetch all keys for the specified gateway
    const { data: keys, error } = await supabase
      .from(TABLES.PAYMENT_GATEWAYS)
      .select('*')
      .eq('name', gateway);

    if (error) {
      console.error('Error fetching keys:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch API keys'
      }, { status: 500 });
    }

    // Transform the keys into a more convenient format
    const keyMap: { [key: string]: string } = {};
    if (keys) {
      keys.forEach(key => {
        if (key.type && key.api_key) {
          keyMap[key.type] = key.api_key;
        }
      });
    }

    return NextResponse.json({
      success: true,
      keys: keyMap,
      message: `Found ${Object.keys(keyMap).length} API keys for ${gateway}`
    });
    
  } catch (error: any) {
    console.error('API fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { keys } = await request.json();
    
    console.log('Saving API keys:', keys);
    
    if (!keys || !Array.isArray(keys)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid keys data'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const results = [];
    
    for (const keyData of keys) {
      console.log('Saving key:', keyData.type);
      
      try {
        // Check if the payment gateway already exists
        const { data: existingGateways, error: searchError } = await supabase
          .from(TABLES.PAYMENT_GATEWAYS)
          .select('*')
          .eq('name', keyData.name)
          .eq('type', keyData.type);

        if (searchError) {
          throw searchError;
        }
        
        let data;
        
        if (existingGateways && existingGateways.length > 0) {
          // Update existing gateway
          const { data: updateData, error: updateError } = await supabase
            .from(TABLES.PAYMENT_GATEWAYS)
            .update({
              api_key: keyData.api_key,
              enabled: keyData.enabled !== undefined ? keyData.enabled : true
            })
            .eq('id', existingGateways[0].id)
            .select()
            .single();

          if (updateError) {
            throw updateError;
          }
          data = updateData;
        } else {
          // Create new gateway
          const { data: insertData, error: insertError } = await supabase
            .from(TABLES.PAYMENT_GATEWAYS)
            .insert({
              name: keyData.name,
              type: keyData.type,
              api_key: keyData.api_key,
              enabled: keyData.enabled !== undefined ? keyData.enabled : true
            })
            .select()
            .single();

          if (insertError) {
            throw insertError;
          }
          data = insertData;
        }
      
        // Success case
        console.log('Successfully saved key:', keyData.type);
        results.push({
          type: keyData.type,
          success: true,
          data
        });
      } catch (error: any) {
        // Error case
        console.error('Error saving key:', keyData.type, error);
        results.push({
          type: keyData.type,
          success: false,
          error: error.message || 'Failed to save key'
        });
      }
    }

    const allSuccessful = results.every(result => result.success);
    
    return NextResponse.json({
      success: allSuccessful,
      results,
      message: allSuccessful ? 'All API keys saved successfully' : 'Some keys failed to save'
    });
    
  } catch (error: any) {
    console.error('API save error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 