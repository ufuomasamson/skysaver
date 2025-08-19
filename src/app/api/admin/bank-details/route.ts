import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

// GET bank details (admin only)
export async function GET(request: Request) {
  try {
    // Check if user is admin using cookie-based authentication
    const cookies = request.headers.get('cookie') || '';
    const userCookie = cookies.split('; ').find(row => row.startsWith('user='));
    
    if (!userCookie) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No user session' 
      }, { status: 401 });
    }

    try {
      const userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      if (userObj.role !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: 'Admin access required' 
        }, { status: 403 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user session' 
      }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      data: bankDetails || null
    });

  } catch (error) {
    console.error('Bank details API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST/PUT bank details (admin only)
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Check if user is admin using cookie-based authentication (same as admin dashboard)
    const cookies = request.headers.get('cookie') || '';
    const userCookie = cookies.split('; ').find(row => row.startsWith('user='));
    
    if (!userCookie) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - No user session' 
      }, { status: 401 });
    }

    try {
      const userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      if (userObj.role !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: 'Admin access required' 
        }, { status: 403 });
      }
    } catch (parseError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user session' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { details } = body;

    // Validate required fields
    if (!details || !details.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Bank details cannot be empty'
      }, { status: 400 });
    }

    // First, deactivate all existing bank details
    await supabase
      .from('bank_details')
      .update({ is_active: false })
      .eq('is_active', true);

    // Insert new bank details
    const { data: newBankDetails, error } = await supabase
      .from('bank_details')
      .insert({
        details: details.trim(),
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving bank details:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to save bank details'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      data: newBankDetails
    });

  } catch (error) {
    console.error('Bank details save error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
