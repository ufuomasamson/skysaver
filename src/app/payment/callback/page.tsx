'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [reference, setReference] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    const urlRef = searchParams.get('reference') || searchParams.get('trxref');
    
    if (!urlRef) {
      setStatus('error');
      setMessage('Invalid payment reference');
      return;
    }

    setReference(urlRef);
    verifyPayment(urlRef);
  }, [searchParams]);

  const verifyPayment = async (ref: string) => {
    try {
      console.log('Verifying payment with reference:', ref);
      
      const response = await fetch('/api/payment/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref })
      });

      const result = await response.json();
      console.log('Verification result:', result);

      if (result.success && result.data?.status === 'confirmed') {
        setStatus('success');
        setMessage('Payment successful! Your booking has been confirmed.');
        setBookingData(result.data);
        
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          router.push(`/payment-success?reference=${ref}&booking_id=${result.data.booking_id}`);
        }, 3000);
      } else if (result.success === false) {
        setStatus('failed');
        setMessage(result.error || 'Payment verification failed');
      } else {
        setStatus('failed');
        setMessage('Payment was not successful');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage('Failed to verify payment. Please contact support.');
    }
  };

  const handleRetryPayment = () => {
    router.push('/search'); // Redirect back to search to retry
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {/* Status Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full">
            {status === 'verifying' && (
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {(status === 'failed' || status === 'error') && (
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'verifying' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'error' && 'Verification Error'}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Reference */}
          {reference && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
              <p className="font-mono text-sm text-gray-900">{reference}</p>
            </div>
          )}

          {/* Booking Data */}
          {bookingData && status === 'success' && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-green-900 mb-2">Booking Confirmed</h3>
              <div className="space-y-1 text-sm text-green-800">
                <p><span className="font-medium">Booking ID:</span> {bookingData.booking_id}</p>
                <p><span className="font-medium">Amount:</span> {bookingData.amount} {bookingData.currency}</p>
                <p><span className="font-medium">Payment Method:</span> {bookingData.payment_method}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                Redirecting to your booking details...
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting...</span>
              </div>
            </div>
          )}

          {(status === 'failed' || status === 'error') && (
            <div className="space-y-3">
              <button
                onClick={handleRetryPayment}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>
          )}

          {/* Support Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Having issues? Contact our support team with reference: <span className="font-mono">{reference}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
