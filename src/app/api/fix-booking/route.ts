import { NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reference } = body;
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Reference required'
      }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Find booking by transaction reference
    console.log('Finding booking with reference:', reference);
    const { data: booking, error: findError } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('transaction_ref', reference)
      .single();

    if (findError || !booking) {
      console.error('Booking not found:', findError);
      return NextResponse.json({
        success: false,
        error: 'Booking not found with this reference',
        reference: reference
      }, { status: 404 });
    }

    console.log('Found booking:', booking.id, 'Current status:', booking.status, 'Paid:', booking.paid);

    // Update booking to paid and approved
    const { error: updateError } = await supabase
      .from(TABLES.BOOKINGS)
      .update({
        paid: true,
        status: 'approved',
        payment_status: 'completed',
        payment_method: 'paystack',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update booking',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('Successfully updated booking:', booking.id);

    // Fetch updated booking to confirm
    const { data: updatedBooking } = await supabase
      .from(TABLES.BOOKINGS)
      .select('*')
      .eq('id', booking.id)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        id: booking.id,
        reference: reference,
        previousStatus: booking.status,
        previousPaid: booking.paid,
        newStatus: updatedBooking?.status,
        newPaid: updatedBooking?.paid
      }
    });

  } catch (error: any) {
    console.error('Manual update error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Update failed'
    }, { status: 500 });
  }
}
