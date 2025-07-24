"use client";
import { useState } from 'react';
import InlinePaymentModal from '@/components/InlinePaymentModal';
import { convertToNGN, logConversion } from '@/lib/currencyConversion';
import { CreditCard, DollarSign, Euro, PoundSterling } from 'lucide-react';

export default function PaymentTestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [testAmount, setTestAmount] = useState(100);

  // Test payment data
  const paymentData = {
    bookingId: 'TEST-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    userId: 'test-user-' + Date.now(),
    amount: testAmount,
    currency: selectedCurrency,
    flightNumber: 'UA-TEST-123',
    passengerName: 'Test Passenger'
  };

  const handlePaymentSuccess = (reference: string) => {
    alert(`Payment successful! Reference: ${reference}`);
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  // Show conversion details
  const conversion = convertToNGN(testAmount, selectedCurrency);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Testing Dashboard</h1>
          <p className="text-gray-800 mb-8">Test the inline payment system with updated Paystack USD to NGN rates</p>

          {/* Exchange Rate Information */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">Current Exchange Rates (Updated)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-gray-900">USD to NGN</span>
                </div>
                <p className="text-2xl font-bold text-green-600">₦1,529</p>
                <p className="text-sm text-gray-800">Updated from XE.com</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Euro className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">EUR to NGN</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">₦1,650</p>
                <p className="text-sm text-gray-800">Estimated rate</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <PoundSterling className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">GBP to NGN</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">₦1,940</p>
                <p className="text-sm text-gray-800">Estimated rate</p>
              </div>
            </div>
          </div>

          {/* Test Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Payment Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Test Amount
                  </label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    min="1"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Currency
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Flight Details</h3>
                  <div className="space-y-1 text-sm text-gray-800">
                    <p><span className="font-medium text-gray-900">Booking ID:</span> {paymentData.bookingId}</p>
                    <p><span className="font-medium text-gray-900">Flight:</span> {paymentData.flightNumber}</p>
                    <p><span className="font-medium text-gray-900">Passenger:</span> {paymentData.passengerName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Preview</h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">User sees:</span>
                    <span className="font-bold text-lg text-gray-900">
                      {selectedCurrency} {testAmount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800">Exchange rate:</span>
                      <span className="font-medium text-gray-900">
                        1 {selectedCurrency} = ₦{conversion.exchangeRate.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800">Paystack processes:</span>
                      <span className="font-bold text-lg text-green-600">
                        ₦{conversion.convertedAmount.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-800">Amount in kobo:</span>
                      <span className="font-medium text-sm text-gray-900">
                        {conversion.amountInKobo.toLocaleString()} kobo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Test Payment Flow</span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Test Instructions</h3>
            <div className="text-yellow-900 space-y-2">
              <p><strong>Before testing:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-900">
                <li>Go to <code className="bg-yellow-100 px-1 rounded text-gray-900">/admin</code> dashboard</li>
                <li>Click "Configure" next to Paystack in Payment Gateways section</li>
                <li>Enter your Paystack test keys:</li>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong>Test Public Key:</strong> pk_test_...</li>
                  <li><strong>Test Secret Key:</strong> sk_test_...</li>
                </ul>
                <li>Click "Save Configuration"</li>
                <li>Return to this page and test the payment flow</li>
              </ol>
              <p className="mt-3"><strong className="text-yellow-900">Note:</strong> <span className="text-gray-900">The payment will now process with the correct USD to NGN rate (₦1,529 per $1) to avoid Paystack rejections.</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <InlinePaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paymentData={paymentData}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
