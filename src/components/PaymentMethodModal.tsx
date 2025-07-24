'use client';
import { useState, useEffect } from 'react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPayment: (method: string, gateway?: string) => void;
  booking: any;
  flight: any;
  loading?: boolean;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  onSelectPayment,
  booking,
  flight,
  loading = false
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [availableGateways, setAvailableGateways] = useState<any[]>([]);
  const [gatewaysLoading, setGatewaysLoading] = useState(true);

  // Check for available payment gateways
  useEffect(() => {
    if (isOpen) {
      checkAvailableGateways();
    }
  }, [isOpen]);

  const checkAvailableGateways = async () => {
    try {
      setGatewaysLoading(true);
      const gateways = [];

      // Check Flutterwave
      try {
        const flutterwaveRes = await fetch('/api/payment/test-keys');
        const flutterwaveData = await flutterwaveRes.json();
        if (flutterwaveData.success && flutterwaveData.configuration?.hasAnySecret) {
          gateways.push({ 
            id: 'flutterwave', 
            name: 'Flutterwave', 
            description: 'Secure payment via Flutterwave' 
          });
        }
      } catch (error) {
        console.log('Flutterwave not available');
      }

      // Check Paystack
      try {
        const paystackRes = await fetch('/api/payment/paystack/test-keys');
        const paystackData = await paystackRes.json();
        if (paystackData.success && paystackData.configuration?.hasAnySecret) {
          gateways.push({ 
            id: 'paystack', 
            name: 'Paystack', 
            description: 'Secure payment via Paystack' 
          });
        }
      } catch (error) {
        console.log('Paystack not available');
      }

      setAvailableGateways(gateways);
    } catch (error) {
      console.error('Error checking available gateways:', error);
      setAvailableGateways([]);
    } finally {
      setGatewaysLoading(false);
    }
  };

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with your credit or debit card',
      icon: '💳',
      gateways: availableGateways
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
      icon: '₿',
      gateways: []
    }
  ];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    if (methodId === 'crypto') {
      setSelectedGateway('');
    }
  };

  const handleGatewaySelect = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
  };

  const handleProceed = () => {
    if (selectedMethod === 'crypto') {
      onSelectPayment('crypto');
    } else if (selectedMethod === 'card' && selectedGateway) {
      onSelectPayment('card', selectedGateway);
    }
  };

  const canProceed = selectedMethod === 'crypto' || (selectedMethod === 'card' && selectedGateway);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Select Payment Method</h2>
              <p className="text-blue-100 text-sm mt-1">
                Choose how you want to pay for flight {flight?.flight_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Flight Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Flight Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Flight:</span>
                <span className="ml-2 font-medium text-gray-800">{flight?.flight_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium text-green-600">${flight?.price}</span>
              </div>
              <div>
                <span className="text-gray-600">Passenger:</span>
                <span className="ml-2 font-medium text-gray-800">{booking?.passenger_name}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium text-gray-800">{flight?.date}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
            
            {paymentMethods.map((method) => (
              <div key={method.id} className="border rounded-lg overflow-hidden">
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedMethod === method.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleMethodSelect(method.id)}
                >
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">{method.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{method.name}</h4>
                      <p className="text-gray-600 text-sm">{method.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod === method.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-full h-full bg-white rounded-full scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Gateway Selection for Card Payments */}
                {selectedMethod === method.id && method.gateways && (
                  <div className="border-t bg-gray-50 p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Choose Payment Gateway:</h5>
                    {gatewaysLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-gray-600 text-sm">Loading payment options...</span>
                      </div>
                    ) : method.gateways.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-gray-500 text-sm">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          No payment gateways configured.
                        </div>
                        <p className="text-gray-400 text-xs mt-1">Contact admin to set up payment methods.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {method.gateways.map((gateway) => (
                          <div
                            key={gateway.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedGateway === gateway.id
                                ? 'bg-blue-100 border border-blue-200'
                                : 'bg-white border border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleGatewaySelect(gateway.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h6 className="font-medium text-gray-800">{gateway.name}</h6>
                                <p className="text-gray-600 text-xs">{gateway.description}</p>
                              </div>
                              <div className={`w-3 h-3 rounded-full border ${
                                selectedGateway === gateway.id
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300'
                              }`}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Crypto Payment Info */}
                {selectedMethod === 'crypto' && (
                  <div className="border-t bg-amber-50 p-4">
                    <div className="flex items-start">
                      <div className="text-amber-500 mr-2 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-amber-800 text-sm font-medium">Manual Verification Required</p>
                        <p className="text-amber-700 text-xs mt-1">
                          Crypto payments require manual verification. You'll need to upload proof of payment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProceed}
              disabled={!canProceed || loading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                canProceed && !loading
                  ? 'bg-[#18176b] text-white hover:bg-[#18176b]/90'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
