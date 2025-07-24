import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client for server-side operations
    const supabase = createServerSupabaseClient();
    
    // Get payment ID from URL params
    const { id: paymentId } = params;
    
    // Ensure consistent string format
    const paymentIdStr = String(paymentId);
    console.log('API: Processing payment approval for ID:', paymentIdStr, 'Type:', typeof paymentId);
    
    // Get payment details from Supabase
    const { data: payment, error: paymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .select('booking_id')
      .eq('id', paymentIdStr)
      .single();
    
    if (paymentError || !payment || !payment.booking_id) {
      return NextResponse.json({ error: 'Payment not found or missing booking_id' }, { status: 404 });
    }

    // Update payment status to approved
    const { error: updatePaymentError } = await supabase
      .from(TABLES.PAYMENTS)
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentIdStr);
    
    if (updatePaymentError) {
      throw updatePaymentError;
    }
    
    // Update booking status to approved and set paid to true
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

    // Return success
    return NextResponse.json({ 
      success: true,
      message: 'Payment approved successfully and booking status updated.'
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to approve payment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
