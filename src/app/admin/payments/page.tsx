"use client";
// Admin Payments Approval Page
import React, { useEffect, useState } from "react";

export default function PaymentsApprovalPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<number|null>(null);
  const [flights, setFlights] = useState<any[]>([]);
  // Calculate total revenue from approved payments
  const totalRevenue = payments
    .filter((p) => p.booking_status === 'approved')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  // Calculate total flight value, defaulting to 0 for invalid/missing prices
  const totalFlightValue = flights.reduce((sum, f) => {
    let price = f.price;
    // Robustly handle string, number, null, undefined
    if (price == null || price === '') return sum;
    // Consistently parse the price to a number with 2 decimal places
    const num = parseFloat(parseFloat(String(price)).toFixed(2));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      setPayments(data);
    } catch {
      setError("Failed to fetch payments");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
    // Fetch all flights for total value
    fetch("/api/flights")
      .then(res => res.json())
      .then(data => setFlights(Array.isArray(data) ? data : []))
      .catch(() => setFlights([]));
  }, []);

  const handleApprove = async (paymentId: number) => {
    setApproving(paymentId);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId })
      });
      if (res.ok) {
        fetchPayments();
      } else {
        setError("Failed to approve payment");
      }
    } catch {
      setError("Failed to approve payment");
    }
    setApproving(null);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Payments Awaiting Approval</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : payments.length === 0 ? (
        <div className="bg-green-50 border border-green-200 p-4 rounded">No pending payments.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((p) => (
            <div key={p.payment_id} className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-bold text-lg text-[#18176b]">Passenger: {p.passenger_name}</div>
                  <div className="text-gray-600 text-sm">Flight No: <span className="font-mono">{p.flight_number}</span></div>
                  <div className="text-gray-600 text-sm">Amount: <span className="font-mono">${Number(p.amount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
                  <div className="text-gray-600 text-sm">Status: <span className="font-semibold">
                    {p.booking_status === 'awaiting_approval' ? 'Awaiting Approval' : p.booking_status === 'approved' ? 'Approved' : 'Pending'}
                  </span></div>
                </div>
                {p.proof_url && (
                  <a href={p.proof_url} target="_blank" rel="noopener noreferrer">
                    <img src={p.proof_url} alt="Proof" className="w-20 h-20 object-contain border rounded" />
                  </a>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                  onClick={() => handleApprove(p.payment_id)}
                  disabled={approving === p.payment_id}
                >
                  {approving === p.payment_id ? "Approving..." : "Approve"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
