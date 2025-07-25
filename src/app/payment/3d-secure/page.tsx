'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Lock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function ThreeDSecurePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticating' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [reference, setReference] = useState('');
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    const urlRef = searchParams.get('reference');
    const url = searchParams.get('url');
    const returnUrl = searchParams.get('return_url');

    if (!urlRef || !url) {
      setStatus('error');
      setMessage('Invalid authentication parameters');
      return;
    }

    setReference(urlRef);
    setAuthUrl(url);
    setStatus('authenticating');
    setMessage('Redirecting to secure authentication...');

    // Add reference parameter to the Paystack URL for tracking
    const paystackUrl = new URL(url);
    paystackUrl.searchParams.set('reference', urlRef);
    paystackUrl.searchParams.set('callback_url', `${window.location.origin}/payment/callback?reference=${urlRef}`);

    console.log('Redirecting to Paystack 3D Secure:', paystackUrl.toString());

    // Short delay to show the loading state
    setTimeout(() => {
      window.location.href = paystackUrl.toString();
    }, 1500);
  }, [searchParams]);

  const handleReturnToPayment = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          {/* Header */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />}
            {status === 'authenticating' && <Lock className="w-8 h-8 text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-8 h-8 text-green-600" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-red-600" />}
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {status === 'loading' && 'Preparing Authentication'}
            {status === 'authenticating' && '3D Secure Authentication'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Error'}
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

          {/* Status-specific content */}
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}

          {status === 'authenticating' && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                You are being redirected to your bank's secure authentication page.
              </p>
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Redirecting...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <button
                onClick={handleReturnToPayment}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Payment
              </button>
            </div>
          )}

          {/* Security notice */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Secure Connection</span>
            </div>
            <p className="text-xs text-gray-500">
              Your payment is protected by bank-grade security. 
              Complete the authentication with your bank to proceed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
