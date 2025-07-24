"use client";
import { useEffect, useState } from "react";

export default function FlightDebugPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const res = await fetch("/api/flights");
        if (!res.ok) {
          throw new Error(`Error fetching flights: ${res.statusText}`);
        }
        const data = await res.json();
        setFlights(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch flights");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18176b] mx-auto mb-4"></div>
          <p className="text-[#18176b] font-semibold text-lg">Loading Flight Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-[#18176b] text-white px-6 py-2 rounded-lg hover:bg-[#18176b]/90 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!flights.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Flights Found</h2>
          <p className="text-gray-600">There are no flights available in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="bg-gradient-to-r from-[#4f1032] to-[#4f1032]/90 text-white py-6 px-8 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold">Flight Data Structure Debug</h1>
        <p className="text-gray-200 mt-1">Displaying the raw flight data structure from the API</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">First Flight Object Structure</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-black font-medium border border-gray-300 shadow-inner">
          {JSON.stringify(flights[0], null, 2)}
        </pre>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Departure Location Structure</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-black font-medium border border-gray-300 shadow-inner">
          {JSON.stringify(flights[0]?.departure_location, null, 2)}
        </pre>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Arrival Location Structure</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-black font-medium border border-gray-300 shadow-inner">
          {JSON.stringify(flights[0]?.arrival_location, null, 2)}
        </pre>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4 text-[#4f1032]">All Flights</h2>
        <div className="grid grid-cols-1 gap-4">
          {flights.map((flight, index) => (
            <div key={flight.id} className="border border-gray-300 rounded-lg p-5 bg-white shadow-md hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-lg text-[#4f1032] mb-2">Flight #{index + 1}: {flight.flight_number}</h3>
              <div className="text-black font-medium mb-1">
                <span className="font-semibold">Departure:</span> {flight.departure_location?.city ? `${flight.departure_location.city}, ${flight.departure_location.country}` : 'Not available'}
              </div>
              <div className="text-black font-medium">
                <span className="font-semibold">Arrival:</span> {flight.arrival_location?.city ? `${flight.arrival_location.city}, ${flight.arrival_location.country}` : 'Not available'}
              </div>
              
              {flight.airline && (
                <div className="mt-2 text-black font-medium">
                  <span className="font-semibold">Airline:</span> {flight.airline.name || 'Unknown'}
                </div>
              )}
              
              <div className="mt-2 text-black font-medium">
                <span className="font-semibold">Price:</span> ${Number(flight.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
