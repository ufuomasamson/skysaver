import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

// GET bank details (public access for payment purposes)
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: bankDetails, error } = await supabase
      .from('bank_details')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching bank details:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch bank details' 
      }, { status: 500 });
    }

    if (!bankDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'No bank details available' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: bankDetails 
    });

  } catch (error) {
    console.error('Error in bank details API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
