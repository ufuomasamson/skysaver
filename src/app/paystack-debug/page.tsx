"use client";
import { useState } from 'react';
import { AlertCircle, CheckCircle, Key, CreditCard } from 'lucide-react';

export default function PaystackDebugPage() {
  const [configCheck, setConfigCheck] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const checkConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/paystack/check-config');
      const result = await response.json();
      setConfigCheck(result);
    } catch (error: any) {
      setConfigCheck({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentCharge = async () => {
    setLoading(true);
    try {
      const testData = {
        email: 'test@example.com',
        amount: 152900, // ₦1,529 in kobo (equivalent to $1 USD)
        currency: 'NGN',
        bookingId: 'DEBUG-' + Date.now(),
        userId: 'debug-user',
        card: {
          number: '4084084084084081', // Paystack test card
          cvv: '408',
          expiry_month: '12',
          expiry_year: '25'
        }
      };

      const response = await fetch('/api/payment/paystack/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paystack Debug Dashboard</h1>
          <p className="text-gray-800 mb-8">Debug and test Paystack integration</p>

          {/* Configuration Check */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900 flex items-center">
                <Key className="h-5 w-5 mr-2" />
                API Key Configuration
              </h2>
              <button
                onClick={checkConfiguration}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Config'}
              </button>
            </div>

            {configCheck && (
              <div className="mt-4">
                {configCheck.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-900">Configuration loaded successfully</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-gray-900">Configuration Details:</h3>
                      <ul className="space-y-1 text-sm text-gray-800">
                        <li><strong>Keys found:</strong> {configCheck.keysFound}</li>
                        <li><strong>Has test secret key:</strong> {configCheck.hasTestSecret ? '✅ Yes' : '❌ No'}</li>
                        <li><strong>Has test public key:</strong> {configCheck.hasTestPublic ? '✅ Yes' : '❌ No'}</li>
                      </ul>
                      
                      {configCheck.keys && configCheck.keys.length > 0 && (
                        <div className="mt-3">
                          <h4 className="font-medium mb-1 text-gray-900">API Keys:</h4>
                          <div className="space-y-1">
                            {configCheck.keys.map((key: any, index: number) => (
                              <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                <strong className="text-gray-900">{key.type}:</strong> <span className="text-gray-800">{key.hasKey ? key.keyPrefix : 'Not configured'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-900">Error: {configCheck.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Payment */}
          <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-900 flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Test Payment Charge
              </h2>
              <button
                onClick={testPaymentCharge}
                disabled={loading || !configCheck?.hasTestSecret}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Charge'}
              </button>
            </div>

            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2 text-gray-900">Test Card Details:</h3>
              <div className="text-sm space-y-1 text-gray-800">
                <p><strong className="text-gray-900">Card Number:</strong> 4084084084084081 (Paystack test card)</p>
                <p><strong className="text-gray-900">CVV:</strong> 408</p>
                <p><strong className="text-gray-900">Expiry:</strong> 12/25</p>
                <p><strong className="text-gray-900">Amount:</strong> ₦1,529.00 (152,900 kobo)</p>
                <p><strong className="text-gray-900">Currency:</strong> NGN</p>
              </div>
            </div>

            {testResult && (
              <div className="mt-4">
                {testResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-900">Payment request successful</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-gray-900">Paystack Response:</h3>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-gray-900">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-900">Payment request failed</span>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <h3 className="font-semibold mb-2 text-gray-900">Error Details:</h3>
                      <p className="text-red-600 mb-2">{testResult.error}</p>
                      {testResult.details && (
                        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto text-gray-900">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Setup Instructions</h3>
            <div className="text-yellow-900 space-y-2">
              <p><strong>If configuration check fails:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-900">
                <li>Go to <code className="bg-yellow-100 px-1 rounded text-gray-900">/admin</code> dashboard</li>
                <li>Find "Payment Gateways" section</li>
                <li>Click "Configure" next to Paystack</li>
                <li>Enter your test API keys from Paystack dashboard</li>
                <li>Click "Save Configuration"</li>
                <li>Return to this page and run the configuration check</li>
              </ol>
              
              <p className="mt-3"><strong className="text-yellow-900">Paystack Test API Keys:</strong></p>
              <ul className="list-disc list-inside ml-4 text-gray-900">
                <li>Test Public Key: starts with <code className="bg-yellow-100 px-1 rounded text-gray-900">pk_test_</code></li>
                <li>Test Secret Key: starts with <code className="bg-yellow-100 px-1 rounded text-gray-900">sk_test_</code></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
