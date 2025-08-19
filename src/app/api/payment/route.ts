import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/paymentService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...paymentData } = body;

    if (action === 'initialize') {
      const result = await PaymentService.initializePayment(paymentData);
      
      if (result.status === 'success') {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    } else if (action === 'verify') {
      const { transactionId } = paymentData;
      const result = await PaymentService.verifyPayment(transactionId);
      
      if (result.status === 'success') {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(result, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
} 