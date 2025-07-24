"use client";
import { useState } from 'react';
import { PaymentService } from '@/services/paymentService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PaymentButtonProps {
  bookingId: string;
  userId: string;
  amount: number;
  currency?: string;
  flightNumber?: string;
  className?: string;
}

export async function downloadTicket(ticketElement: HTMLElement, fileName = 'flight-ticket.pdf') {
  if (!ticketElement) return;
  try {
    // Use html2canvas to render the ticket element
    const canvas = await html2canvas(ticketElement, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    // Calculate width/height to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(fileName);
  } catch (err) {
    console.error('PDF download error:', err);
  }
}

export default function PaymentButton({
  bookingId,
  userId,
  amount,
  currency = 'EUR',
  flightNumber,
  className = ''
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handlePayment = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await PaymentService.initiatePayment({
        bookingId,
        userId,
        amount,
        currency
      });

      if (result.success && result.data) {
        // Redirect to Flutterwave payment page
        PaymentService.redirectToPayment(result.data.payment_url);
      } else {
        setError(result.error || 'Failed to initiate payment');
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-600">Flight:</span>
            <span className="font-medium">{flightNumber || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">Amount:</span>
            <span className="font-medium">{currency} {amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-600">Currency:</span>
            <span className="font-medium">{currency}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#18176b] hover:bg-[#18176b]/90 text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          'Pay Now'
        )}
      </button>

      <div className="text-xs text-gray-500 text-center">
        <p>• Payment is processed securely via Flutterwave</p>
        <p>• Amount and currency are locked and cannot be modified</p>
        <p>• You will be redirected to a secure payment page</p>
      </div>
    </div>
  );
} 