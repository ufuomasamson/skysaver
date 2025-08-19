import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, currency } = await request.json();
    
    console.log('Debug amount conversion:', { amount, currency });
    
    let convertedAmount = amount;
    let explanation = '';
    
    // Flutterwave expects and returns amounts in the base currency
    convertedAmount = Math.round(amount * 100) / 100;
    explanation = `Flutterwave expects ${currency} amounts in base currency. ${amount} ${currency} = ${convertedAmount} ${currency}`;
    
    return NextResponse.json({
      success: true,
      original_amount: amount,
      currency: currency,
      converted_amount: convertedAmount,
      explanation: explanation
    });

  } catch (error: any) {
    console.error('Debug amount error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 