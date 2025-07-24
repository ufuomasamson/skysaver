import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// GET: List all payments needing approval
export async function GET() {
  const db = await getDB();
  const [rows] = await db.query(
    `SELECT p.*, b.passenger_name, b.flight_id, f.flight_number, w.name as wallet_name, w.network, w.wallet_address
     FROM payments p
     JOIN bookings b ON p.booking_id = b.id
     JOIN flights f ON b.flight_id = f.id
     JOIN crypto_wallets w ON p.wallet_id = w.id
     WHERE p.status = 'pending'
     ORDER BY p.created_at DESC`
  );
  return NextResponse.json(rows);
}

// PATCH: Approve a payment
export async function PATCH(req: NextRequest) {
  const db = await getDB();
  const { payment_id } = await req.json();
  if (!payment_id) return NextResponse.json({ error: 'Missing payment_id' }, { status: 400 });
  // Mark payment as approved
  await db.query('UPDATE payments SET status = ? WHERE id = ?', ['approved', payment_id]);
  // Mark booking as paid
  await db.query('UPDATE bookings SET paid = ?, status = ? WHERE id = (SELECT booking_id FROM payments WHERE id = ?)', [true, 'paid', payment_id]);
  // Optionally update revenue (handled elsewhere)
  return NextResponse.json({ success: true });
}
