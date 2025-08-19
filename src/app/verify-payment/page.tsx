'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentVerificationPage() {
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!reference.trim()) {
      alert('Please enter a payment reference');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/payment/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred'
      });
    }

    setLoading(false);
  };

  const handleFixBooking = async () => {
    if (!reference.trim()) {
      alert('Please enter a payment reference');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/fix-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred'
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Payment Verification
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter Paystack reference (e.g., xyz123abc)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center mb-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Payment'
            )}
          </button>

          <button
            onClick={handleFixBooking}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              'Fix Booking Status'
            )}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
              )}
              <div>
                <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.message || result.error}
                </p>
                
                {result.success && result.booking && (
                  <div className="mt-2 text-sm text-green-700">
                    <p>Booking ID: {result.booking.id}</p>
                    <p>Status: {result.booking.status}</p>
                    <p>Paid: {result.booking.paid ? 'Yes' : 'No'}</p>
                    <p>Amount: {result.booking.amount} {result.booking.currency}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <h4 className="font-medium mb-2">How to use:</h4>
          <ol className="list-decimal list-inside space-y-1">
            <li>Get your payment reference from the transaction</li>
            <li>Enter it in the field above</li>
            <li>Click "Verify Payment" to check and update booking status</li>
            <li>If verification doesn't work, use "Fix Booking Status"</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> This page is for manual verification. Once webhooks are configured, 
              payments will be automatically verified and booking status updated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
