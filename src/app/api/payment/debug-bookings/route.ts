import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    console.log('Debugging bookings...');
    
    try {
      const db = await getDB();
      
      // Get all bookings with transaction references
      const [bookings] = await db.query(`
        SELECT id, tx_ref as transaction_ref, payment_transaction_id, payment_status, paid, created_at
        FROM bookings
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Recent bookings retrieved',
        bookings: bookings || [],
        total: Array.isArray(bookings) ? bookings.length : 0
      });
    } catch (error: any) {
      console.error('Debug bookings error:', error);
      return NextResponse.json({
        success: false,
        error: error.message || 'Unknown error'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Debug bookings error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 