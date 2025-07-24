import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES, STORAGE_BUCKETS } from '@/lib/supabaseClient';

// PATCH: Admin approves a payment and updates booking status
export async function PATCH(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    const { payment_id } = await req.json();
    
    if (!payment_id) {
      return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
    }
    
    // Get payment document
    const { data: payment, error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .select('booking_id')
      .eq('id', payment_id)
      .single();
    
    if (paymentError || !payment || !payment.booking_id) {
      return NextResponse.json({ error: 'Payment not found or missing booking_id' }, { status: 404 });
    }
    
    // Update payment status to approved
    const { error: updatePaymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', payment_id);
    
    if (updatePaymentError) {
      throw updatePaymentError;
    }
    
    // Update booking status to approved and paid to true
    const { error: updateBookingError } = await supabase
      .from(TABLES.BOOKINGS)
      .update({ 
        status: 'approved',
        paid: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', payment.booking_id);
    
    if (updateBookingError) {
      throw updateBookingError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment approved and booking updated successfully'
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json(
      { error: 'Failed to approve payment', message: error.message },
      { status: 500 }
    );
  }
}

// GET: Retrieve payments with filtering
export async function GET(request: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Parse URL to get query parameters
    const url = new URL(request.url);
    const booking_id = url.searchParams.get('booking_id');
    const status = url.searchParams.get('status');
    const user_id = url.searchParams.get('user_id');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Calculate pagination range
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Start building the query
    let query = supabase
      .from(TABLES.PAYMENTS)
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    // Apply filters if provided
    if (booking_id) {
      query = query.eq('booking_id', booking_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    // Execute the query
    const { data: payments, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('Error retrieving payments:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payments', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new payment record
export async function POST(req: NextRequest) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    const formData = await req.formData();
    const booking_id = formData.get('booking_id') as string;
    const amount = Number(formData.get('amount'));
    const currency = formData.get('currency') as string;
    const payment_method = formData.get('payment_method') as string;
    const user_id = formData.get('user_id') as string;
    const user_email = formData.get('user_email') as string;
    const proofFile = formData.get('payment_proof') as File;
    
    console.log('[DEBUG] POST /api/payments received:', {
      booking_id,
      amount,
      currency,
      payment_method,
      user_id,
      user_email,
      proofFile: proofFile ? `File: ${proofFile.name}` : 'No file'
    });
    
    if (!booking_id || !amount || !payment_method) {
      console.error('[DEBUG] Missing required fields:', { booking_id, amount, payment_method });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Handle payment proof upload if provided
    let payment_proof_url = '';
    if (proofFile && proofFile instanceof File) {
      // Upload the file to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${STORAGE_BUCKETS.PAYMENT_PROOFS}/${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .upload(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''), proofFile);
      
      if (uploadError) {
        console.error('Error uploading payment proof:', uploadError);
        return NextResponse.json({ error: 'Failed to upload payment proof' }, { status: 500 });
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .getPublicUrl(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''));
      
      payment_proof_url = urlData.publicUrl;
    }
    
    // Create payment record in Supabase
    const { data: payment, error } = await supabase
      .from(TABLES.PAYMENTS)
      .insert({
        booking_id,
        amount,
        currency_code: currency || 'USD',
        payment_method,
        status: 'pending',
        user_id,
        user_email,
        payment_proof_url,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create payment record:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create payment record'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment record created successfully',
      payment
    });
  } catch (error) {
    console.error('Error creating payment record:', error);
    return NextResponse.json(
      { error: 'Failed to create payment record', message: error.message },
      { status: 500 }
    );
  }
}
