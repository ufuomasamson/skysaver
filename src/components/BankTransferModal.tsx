"use client";

import { useState, useEffect } from 'react';
import { X, Building2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    bookingId: string;
    amount: number;
    currency: string;
    flightNumber?: string;
    passengerName?: string;
  };
}

interface BankDetails {
  id: number;
  details: string;
}

export default function BankTransferModal({
  isOpen,
  onClose,
  paymentData
}: BankTransferModalProps) {
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const fetchBankDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bank-details');
      const data = await response.json();
      
      if (data.success && data.data) {
        setBankDetails(data.data);
      } else {
        setError('Bank transfer is currently unavailable. Please try another payment method.');
      }
    } catch (err) {
      console.error('Error fetching bank details:', err);
      setError('Failed to load bank transfer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Bank Transfer Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : bankDetails ? (
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-800 font-medium">Amount:</span>
                    <span className="font-semibold ml-2 text-gray-900">{formatAmount(paymentData.amount, paymentData.currency)}</span>
                  </div>
                  <div>
                    <span className="text-blue-800 font-medium">Flight:</span>
                    <span className="font-semibold ml-2 text-gray-900">{paymentData.flightNumber || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-800 font-medium">Booking ID:</span>
                    <span className="font-semibold ml-2 text-gray-900">{paymentData.bookingId}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Bank Account Details</h3>
                  <button
                    onClick={() => copyToClipboard(bankDetails.details)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-700 font-medium">Copy Details</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-sm font-mono whitespace-pre-line text-gray-800">
                    {bankDetails.details}
                  </pre>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">Payment Instructions</h3>
                <ul className="text-sm text-yellow-900 space-y-1">
                  <li>• Transfer the exact amount: <strong className="text-yellow-900">{formatAmount(paymentData.amount, paymentData.currency)}</strong></li>
                  <li>• Include your <strong className="text-yellow-900">Booking ID: {paymentData.bookingId}</strong> in the transfer description/reference</li>
                  <li>• Save your transfer receipt for verification</li>
                  <li>• Your flight will be confirmed once payment is verified (usually within 1-2 business days)</li>
                  <li>• Contact support if you need assistance with your transfer</li>
                </ul>
              </div>

              {/* Quick Copy Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">Booking Reference</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-900">
                      {paymentData.bookingId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(paymentData.bookingId)}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Copy booking ID"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-800">Amount</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono text-gray-900">
                      {formatAmount(paymentData.amount, paymentData.currency)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(formatAmount(paymentData.amount, paymentData.currency))}
                      className="p-2 hover:bg-gray-200 rounded transition-colors"
                      title="Copy amount"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bank details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
