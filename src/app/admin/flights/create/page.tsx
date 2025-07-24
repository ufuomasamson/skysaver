"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFlightPage() {
  const [form, setForm] = useState({
    airline_id: "",
    departure_airport: "",
    arrival_airport: "",
    price: "",
    passenger_name: "",
    date: "",
    time: "",
    flight_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess("Flight created successfully!");
      setForm({ 
        airline_id: "", 
        departure_airport: "", 
        arrival_airport: "", 
        price: "", 
        passenger_name: "", 
        date: "",
        time: "",
        flight_number: ""
      });
      setTimeout(() => router.push("/admin/flights"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create flight");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
      <form className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-[#4f1032] mb-6">Create Flight</h1>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">{success}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Flight Number</label>
          <input name="flight_number" value={form.flight_number} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Airline ID</label>
          <input name="airline_id" value={form.airline_id} onChange={handleChange} className="w-full border rounded px-3 py-2" required type="number" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Departure Location</label>
          <input name="departure_airport" value={form.departure_airport} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Arrival Location</label>
          <input name="arrival_airport" value={form.arrival_airport} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Price</label>
          <input name="price" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" required type="number" min="0" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Passenger Name</label>
          <input name="passenger_name" value={form.passenger_name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Date</label>
          <input name="date" value={form.date} onChange={handleChange} className="w-full border rounded px-3 py-2" required type="date" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Time</label>
          <input name="time" value={form.time} onChange={handleChange} className="w-full border rounded px-3 py-2" required type="time" />
        </div>
        <button type="submit" className="bg-[#4f1032] text-white px-6 py-2 rounded-lg font-semibold" disabled={loading}>
          {loading ? "Creating..." : "Create Flight"}
        </button>
      </form>
    </div>
  );
}
