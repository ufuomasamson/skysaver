"use client";
import { useState, useEffect } from 'react';
import { X, CreditCard, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useCurrencyStore } from '@/lib/currencyManager';
import { convertToNGN, logConversion } from '@/lib/currencyConversion';

interface PaymentData {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  flightNumber?: string;
  passengerName?: string;
}

interface InlinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentData;
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
}

interface CardForm {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  pin?: string;
  otp?: string;
}

interface PaymentStep {
  step: 'card-details' | 'pin' | 'otp' | 'processing' | 'success' | 'error';
  message?: string;
  reference?: string;
}

export default function InlinePaymentModal({
  isOpen,
  onClose,
  paymentData,
  onSuccess,
  onError
}: InlinePaymentModalProps) {
  const { formatPrice } = useCurrencyStore();
  const [cardForm, setCardForm] = useState<CardForm>({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    pin: '',
    otp: ''
  });
  
  const [currentStep, setCurrentStep] = useState<PaymentStep>({ step: 'card-details' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCardForm({
        number: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        pin: '',
        otp: ''
      });
      setCurrentStep({ step: 'card-details' });
      setErrors({});
      setIsLoading(false);
    }
  }, [isOpen]);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Validate card form
  const validateCardForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!cardForm.number.replace(/\s/g, '') || cardForm.number.replace(/\s/g, '').length < 13) {
      newErrors.number = 'Please enter a valid card number';
    }
    
    if (!cardForm.expiryMonth || !cardForm.expiryYear) {
      newErrors.expiry = 'Please enter expiry date';
    }
    
    if (!cardForm.cvv || cardForm.cvv.length < 3) {
      newErrors.cvv = 'Please enter valid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof CardForm, value: string) => {
    setCardForm(prev => ({
      ...prev,
      [field]: field === 'number' ? formatCardNumber(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Process payment with Paystack
  const processPayment = async () => {
    if (!validateCardForm()) return;

    setIsLoading(true);
    setCurrentStep({ step: 'processing', message: 'Processing your payment...' });

    try {
      // Convert amount to NGN for Paystack processing using centralized utility
      const conversion = convertToNGN(paymentData.amount, paymentData.currency);
      
      // Log conversion for debugging (only in development)
      logConversion(conversion, 'Inline Payment Modal');

      // First, create a charge with Paystack using NGN
      const chargeResponse = await fetch('/api/payment/paystack/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'customer@example.com', // Use dummy email since we're not collecting it
          amount: conversion.convertedAmount, // Amount in NGN (API will convert to kobo)
          currency: 'NGN', // Always use NGN for Paystack
          bookingId: paymentData.bookingId,
          userId: paymentData.userId,
          card: {
            number: cardForm.number.replace(/\s/g, ''),
            cvv: cardForm.cvv,
            expiry_month: cardForm.expiryMonth,
            expiry_year: cardForm.expiryYear
          }
        })
      });

      const chargeResult = await chargeResponse.json();

      if (!chargeResult.success) {
        throw new Error(chargeResult.error || 'Payment failed');
      }

      // Handle different response statuses
      const { status, data } = chargeResult;

      switch (status) {
        case 'send_pin':
          setCurrentStep({ 
            step: 'pin', 
            message: 'Please enter your card PIN to continue',
            reference: data.reference
          });
          break;

        case 'send_otp':
          setCurrentStep({ 
            step: 'otp', 
            message: 'Please enter the OTP sent to your phone',
            reference: data.reference
          });
          break;

        case 'success':
          setCurrentStep({ 
            step: 'success', 
            message: 'Payment successful!',
            reference: data.reference 
          });
          setTimeout(() => {
            onSuccess(data.reference);
            onClose();
          }, 2000);
          break;

        default:
          throw new Error('Unexpected payment status');
      }

    } catch (error: any) {
      setCurrentStep({ 
        step: 'error', 
        message: error.message || 'Payment failed. Please try again.' 
      });
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit PIN
  const submitPin = async () => {
    if (!cardForm.pin) {
      setErrors({ pin: 'Please enter your PIN' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/payment/paystack/submit-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: cardForm.pin,
          reference: currentStep.reference
        })
      });

      const result = await response.json();

      if (result.status === 'send_otp') {
        setCurrentStep({ 
          step: 'otp', 
          message: 'Please enter the OTP sent to your phone' 
        });
      } else if (result.status === 'success') {
        setCurrentStep({ 
          step: 'success', 
          message: 'Payment successful!',
          reference: result.data.reference 
        });
        setTimeout(() => {
          onSuccess(result.data.reference);
          onClose();
        }, 2000);
      }
    } catch (error: any) {
      setErrors({ pin: error.message || 'Invalid PIN' });
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP
  const submitOtp = async () => {
    if (!cardForm.otp) {
      setErrors({ otp: 'Please enter the OTP' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/payment/paystack/submit-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: cardForm.otp,
          reference: currentStep.reference
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setCurrentStep({ 
          step: 'success', 
          message: 'Payment successful!',
          reference: result.data.reference 
        });
        setTimeout(() => {
          onSuccess(result.data.reference);
          onClose();
        }, 2000);
      } else {
        setErrors({ otp: 'Invalid OTP. Please try again.' });
      }
    } catch (error: any) {
      setErrors({ otp: error.message || 'Invalid OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Secure Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Summary */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-800">Flight:</span>
              <span className="font-medium text-gray-900">{paymentData.flightNumber || 'N/A'}</span>
            </div>
            {paymentData.passengerName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-800">Passenger:</span>
                <span className="font-medium text-gray-900">{paymentData.passengerName}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold pt-2 border-t">
              <span className="text-gray-900">Total Amount:</span>
              <span className="text-blue-600">
                {formatPrice(paymentData.amount, paymentData.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Content based on current step */}
        <div className="p-6">
          {currentStep.step === 'card-details' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600 mb-4">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Your card details are encrypted and secure</span>
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardForm.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                    errors.number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
                {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Month
                  </label>
                  <select
                    value={cardForm.expiryMonth}
                    onChange={(e) => handleInputChange('expiryMonth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      errors.expiry ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="" className="text-gray-500">MM</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, '0')} className="text-gray-900">
                        {String(i + 1).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Year
                  </label>
                  <select
                    value={cardForm.expiryYear}
                    onChange={(e) => handleInputChange('expiryYear', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${
                      errors.expiry ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="" className="text-gray-500">YY</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i} value={String(new Date().getFullYear() + i).slice(-2)} className="text-gray-900">
                        {String(new Date().getFullYear() + i).slice(-2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardForm.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              {errors.expiry && <p className="text-red-500 text-xs">{errors.expiry}</p>}
              {errors.cvv && <p className="text-red-500 text-xs">{errors.cvv}</p>}

              <button
                onClick={processPayment}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Lock className="h-5 w-5" />
                    <span>Pay {formatPrice(paymentData.amount, paymentData.currency)}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep.step === 'pin' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Enter Your PIN</h4>
                <p className="text-gray-700 text-sm">{currentStep.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Card PIN
                </label>
                <input
                  type="password"
                  value={cardForm.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-gray-900 placeholder-gray-500 ${
                    errors.pin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="****"
                  maxLength={4}
                />
                {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
              </div>

              <button
                onClick={submitPin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>Submit PIN</span>
                )}
              </button>
            </div>
          )}

          {currentStep.step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Enter OTP</h4>
                <p className="text-gray-700 text-sm">{currentStep.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  One-Time Password
                </label>
                <input
                  type="text"
                  value={cardForm.otp}
                  onChange={(e) => handleInputChange('otp', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-gray-900 placeholder-gray-500 ${
                    errors.otp ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123456"
                  maxLength={6}
                />
                {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
              </div>

              <button
                onClick={submitOtp}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>Submit OTP</span>
                )}
              </button>
            </div>
          )}

          {currentStep.step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h4 className="font-semibold mb-2 text-gray-900">Processing Payment</h4>
              <p className="text-gray-700">{currentStep.message}</p>
            </div>
          )}

          {currentStep.step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-800 mb-2">Payment Successful!</h4>
              <p className="text-gray-700">{currentStep.message}</p>
              {currentStep.reference && (
                <p className="text-sm text-gray-600 mt-2">
                  Reference: {currentStep.reference}
                </p>
              )}
            </div>
          )}

          {currentStep.step === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h4 className="font-semibold text-red-800 mb-2">Payment Failed</h4>
              <p className="text-gray-700 mb-4">{currentStep.message}</p>
              <button
                onClick={() => setCurrentStep({ step: 'card-details' })}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
