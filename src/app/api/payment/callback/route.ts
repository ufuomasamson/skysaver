import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');
    const txRef = searchParams.get('tx_ref');
    const status = searchParams.get('status');

    console.log('Payment callback received:', { transactionId, txRef, status });

    if (!transactionId || !txRef) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?error=Invalid payment parameters`);
    }

    if (status !== 'successful') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?error=Payment was not successful`);
    }

    // Find the booking using tx_ref
    const db = await getDB();
    
    // Get booking with related data
    const [bookingRows] = await db.query(`
      SELECT 
        b.*,
        f.id as flight_id,
        f.flight_number,
        f.date,
        f.time,
        f.price,
        f.currency,
        a.id as airline_id,
        a.name as airline_name,
        a.logo_url as airline_logo,
        dl.city AS departure_city,
        dl.country AS departure_country,
        al.city AS arrival_city,
        al.country AS arrival_country
      FROM bookings b
      LEFT JOIN flights f ON b.flight_id = f.id
      LEFT JOIN airlines a ON f.airline_id = a.id
      LEFT JOIN locations dl ON f.departure_location_id = dl.id
      LEFT JOIN locations al ON f.arrival_location_id = al.id
      WHERE b.tx_ref = ?
    `, [txRef]);

    if (!bookingRows || !Array.isArray(bookingRows) || bookingRows.length === 0) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?error=Booking not found`);
    }
    
    const booking = bookingRows[0] as any;

    // Update booking as paid
    try {
      await db.query(
        'UPDATE bookings SET paid = ?, payment_transaction_id = ?, payment_date = ? WHERE id = ?',
        [true, transactionId, new Date().toISOString(), booking.id]
      );
    } catch (error) {
      console.error('Failed to update booking:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?error=Failed to update booking`);
    }

    // Redirect to success page
    const trackingNumber = booking.tracking_number || txRef;
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?success=Payment successful&tx_ref=${trackingNumber}`);

  } catch (error) {
    console.error('Payment callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/track?error=Payment processing failed`);
  }
} 