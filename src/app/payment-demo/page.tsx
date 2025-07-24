"use client";
import { useState } from 'react';
import InlinePaymentModal from '@/components/InlinePaymentModal';
import { convertToNGN, getConversionDisplay } from '@/lib/currencyConversion';

export default function PaymentDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  const demoPaymentData = {
    bookingId: 'demo-booking-123',
    userId: 'demo-user-456',
    amount: 1.85, // Base amount
    currency: selectedCurrency,
    flightNumber: 'UA-001',
    passengerName: 'John Doe'
  };

  // Calculate conversion preview
  const conversion = convertToNGN(demoPaymentData.amount, selectedCurrency);

  const handleSuccess = (reference: string) => {
    alert(`Payment successful! Reference: ${reference}`);
    console.log('Payment successful with reference:', reference);
  };

  const handleError = (error: string) => {
    alert(`Payment failed: ${error}`);
    console.error('Payment failed:', error);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Payment Demo</h1>
        
        <div className="space-y-4 mb-6">
          {/* Currency Selector */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Select Currency</h3>
            <select 
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            >
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Demo Flight Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Flight:</span>
                <span>{demoPaymentData.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Passenger:</span>
                <span>{demoPaymentData.passengerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{selectedCurrency} {demoPaymentData.amount}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Paystack Conversion Preview</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• User sees: <strong>{selectedCurrency} {demoPaymentData.amount}</strong></p>
              <p>• Paystack processes: <strong>NGN {conversion.convertedAmount.toFixed(2)}</strong></p>
              <p>• Rate: 1 {selectedCurrency} = {conversion.exchangeRate} NGN</p>
              <p>• Customer never sees NGN amount</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Test Instructions</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• This is a demo payment flow</p>
              <p>• Use test card: 4084084084084081</p>
              <p>• CVV: Any 3 digits</p>
              <p>• Expiry: Any future date</p>
              <p>• PIN: 1234 (if requested)</p>
              <p>• No email required - form simplified!</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Test Inline Payment Flow
        </button>

        <InlinePaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          paymentData={demoPaymentData}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
}
