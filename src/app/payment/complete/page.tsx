'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export default function PaymentCompletePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking');
  const [message, setMessage] = useState('Checking your payment status...');
  const [reference, setReference] = useState('');
  const [checkCount, setCheckCount] = useState(0);
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) {
      setReference(ref);
      checkPaymentStatus(ref);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, [searchParams]);

  const checkPaymentStatus = async (ref: string) => {
    try {
      setCheckCount(prev => prev + 1);
      console.log(`Payment check attempt ${checkCount + 1} for reference:`, ref);

      const response = await fetch('/api/payment/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref })
      });

      const result = await response.json();
      console.log('Payment verification result:', result);

      if (result.success) {
        setStatus('success');
        setMessage('Payment successful! Your booking has been confirmed.');
        setDetails(result);
        
        // Redirect to booking details after 3 seconds
        setTimeout(() => {
          if (result.booking_id) {
            router.push(`/ticket?booking=${result.booking_id}`);
          } else {
            router.push('/profile');
          }
        }, 3000);
        
      } else if (result.paystack_status === 'success' && result.error?.includes('already processed')) {
        // Payment was successful but already processed
        setStatus('success');
        setMessage('Payment confirmed! Your booking is being processed.');
        setTimeout(() => router.push('/profile'), 3000);
        
      } else if (checkCount < 3) {
        // Retry up to 3 times with delay
        setMessage(`Verifying payment... (attempt ${checkCount + 1}/3)`);
        setTimeout(() => checkPaymentStatus(ref), 2000);
        
      } else {
        // Failed after retries
        setStatus('failed');
        setMessage('Unable to verify payment status. Please contact support or try manual verification.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      if (checkCount < 3) {
        setTimeout(() => checkPaymentStatus(ref), 2000);
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please try manual verification.');
      }
    }
  };

  const retryCheck = () => {
    setCheckCount(0);
    setStatus('checking');
    setMessage('Rechecking payment status...');
    checkPaymentStatus(reference);
  };

  const manualVerify = () => {
    router.push(`/verify-payment?reference=${reference}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {status === 'checking' && (
            <div className="bg-blue-50 rounded-full p-4 inline-block">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="bg-green-50 rounded-full p-4 inline-block">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          )}
          {status === 'failed' && (
            <div className="bg-red-50 rounded-full p-4 inline-block">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {status === 'checking' && 'Verifying Payment'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Verification Needed'}
        </h1>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {reference && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-1"><strong>Payment Reference:</strong></p>
            <p className="text-sm font-mono text-gray-800 break-all">{reference}</p>
            {details?.paystack_status && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Paystack Status:</strong> {details.paystack_status}
              </p>
            )}
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">
              Redirecting to your booking details...
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          {status === 'failed' && (
            <>
              <button
                onClick={retryCheck}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </button>
              
              <button
                onClick={manualVerify}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Manual Verification
              </button>
            </>
          )}
          
          {status === 'success' && (
            <button
              onClick={() => router.push(details?.booking_id ? `/ticket?booking=${details.booking_id}` : '/profile')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Booking
            </button>
          )}
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>
        
        <div className="mt-6 text-xs text-gray-500">
          <p>
            If you completed payment but don't see success, your payment may still be processing.
            Try "Check Again" or use "Manual Verification".
          </p>
        </div>
      </div>
    </div>
  );
}
