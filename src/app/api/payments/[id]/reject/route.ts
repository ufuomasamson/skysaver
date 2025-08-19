import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Access id directly from params object to fix Next.js warning
    const { id: paymentId } = params;
    const db = await getDB();

    // Ensure the payment ID is handled consistently as a string
    const paymentIdStr = String(paymentId);
    console.log('API: Processing payment rejection for ID:', paymentIdStr, 'Type:', typeof paymentId);
    
    // Get payment and booking - use consistent string ID
    const [paymentRows] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentIdStr]);
    const paymentArr = Array.isArray(paymentRows) ? paymentRows : [paymentRows];
    const payment = paymentArr[0] as RowDataPacket & { booking_id?: string };
    
    if (!payment || !payment.booking_id) {
      return NextResponse.json({ error: 'Payment not found or missing booking_id' }, { status: 404 });
    }

    // Reject payment - use string ID
    await db.query('UPDATE payments SET status = ? WHERE id = ?', ['rejected', paymentIdStr]);
    
    // Update booking status with a shorter message to avoid 'Data too long' error
    await db.query(
      'UPDATE bookings SET status = ?, paid = ? WHERE id = ?',
      ['rejected', false, payment.booking_id]
    );

    // Return success
    return NextResponse.json({ 
      success: true,
      message: 'Payment rejected successfully and booking status updated.'
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to reject payment',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
