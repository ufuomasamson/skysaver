'use client';

import { useState, useEffect } from 'react';

export default function PaymentDebugPage() {
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const url = reference 
        ? `/api/payment/debug?reference=${reference}`
        : `/api/payment/debug`;
      
      const response = await fetch(url);
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Debug Dashboard</h1>
      
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Transaction Reference (optional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={fetchDebugData}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {debugData && (
        <div className="space-y-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Paid</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Payment Method</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {debugData.data.bookings.map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="p-2">{booking.id}</td>
                      <td className="p-2 font-mono text-sm">{booking.transaction_ref}</td>
                      <td className="p-2">{booking.flight_amount} {booking.currency}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${booking.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {booking.paid ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-2">{booking.status}</td>
                      <td className="p-2">{booking.payment_method || 'N/A'}</td>
                      <td className="p-2">{new Date(booking.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Records */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Records</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ID</th>
                    <th className="text-left p-2">Booking ID</th>
                    <th className="text-left p-2">Reference</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Transaction ID</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {debugData.data.payments.map((payment) => (
                    <tr key={payment.id} className="border-b">
                      <td className="p-2">{payment.id}</td>
                      <td className="p-2">{payment.booking_id}</td>
                      <td className="p-2 font-mono text-sm">{payment.payment_reference}</td>
                      <td className="p-2">{payment.amount} {payment.currency}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${payment.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-xs">{payment.payment_transaction_id}</td>
                      <td className="p-2">{new Date(payment.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paystack Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Paystack Configuration</h2>
            <div className="space-y-2">
              {debugData.data.paystackConfig.map((config) => (
                <div key={config.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">{config.type}</span>
                  <span className="text-sm text-gray-600">
                    {config.api_key ? `${config.api_key.substring(0, 10)}...` : 'Not configured'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Info</h3>
            <pre className="text-sm text-gray-700 overflow-x-auto">
              {JSON.stringify(debugData.data.debug, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
