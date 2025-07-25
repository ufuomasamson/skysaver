import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');
  const status = url.searchParams.get('status');
  const trxref = url.searchParams.get('trxref');

  return NextResponse.json({
    message: 'Redirect endpoint working!',
    timestamp: new Date().toISOString(),
    received_params: {
      reference: reference || trxref,
      status,
      all_params: Object.fromEntries(url.searchParams.entries())
    },
    instructions: 'If you see this, your callback URL is working. Users should be redirected to /payment/callback instead.'
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Test webhook endpoint working!',
      timestamp: new Date().toISOString(),
      received_data: body,
      instructions: 'This confirms webhook delivery is working.'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Test endpoint error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
