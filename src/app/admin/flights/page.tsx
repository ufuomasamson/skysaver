"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function CreatedFlightsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const router = useRouter();

  const fetchFlights = async () => {
    try {
      const res = await fetch("/api/flights");
      const flightsData = await res.json();
      setFlights(flightsData || []);
    } catch (error) {
      console.error("Error fetching flights:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Cookie-based admin check (same as dashboard)
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!cookie) {
      router.replace('/login');
      return;
    }
    try {
      const userObj = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      if (userObj.role !== 'admin') {
        router.replace('/search');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }
    fetchFlights();
  }, [router]);

  const handleDelete = async (flightId: string) => {
    if (window.confirm("Are you sure you want to delete this flight?")) {
      try {
        const res = await fetch(`/api/flights?id=${flightId}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err);
        }
        setSelectedFlight(null);
        fetchFlights();
      } catch (error) {
        console.error("Error deleting flight:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18176b] mx-auto mb-4"></div>
          <p className="text-[#18176b] font-semibold">Loading Flights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Created Flights</h1>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-[#cd7e0f] text-white px-6 py-2 rounded-lg hover:bg-[#cd7e0f]/90 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flights.map((flight) => (
              <div
                key={flight.id}
                className="p-6 border rounded-lg cursor-pointer hover:shadow-md"
                onClick={() => setSelectedFlight(flight)}
              >
                <h3 className="text-lg font-semibold text-[#18176b] mb-2">
                  {(flight.airline?.name || 'Airline ID: ' + flight.airline_id) + ' - ' + flight.flight_number}
                </h3>
                <p className="text-gray-600">
                  {(flight.departure_location?.city || 'Location ID: ' + flight.departure_location_id) + 
                   ' to ' + 
                   (flight.arrival_location?.city || 'Location ID: ' + flight.arrival_location_id)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedFlight && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-[#18176b]">Flight Details</h2>
                <p className="text-gray-500">Complete information for the selected flight.</p>
              </div>
              <button 
                onClick={() => setSelectedFlight(null)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Redesigned Flight Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-gray-800">
              <div className="flex items-center gap-6 mb-6">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </div>
                <div>
                  <div className="font-bold text-2xl text-[#18176b]">{selectedFlight.airline?.name || 'Airline ID: ' + selectedFlight.airline_id}</div>
                  <div className="text-gray-600">Flight No: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{selectedFlight.flight_number}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Route:</span>
                  <span className="text-right">
                    {(selectedFlight.departure_location?.city || 'Location ID: ' + selectedFlight.departure_location_id) + 
                     ' → ' + 
                     (selectedFlight.arrival_location?.city || 'Location ID: ' + selectedFlight.arrival_location_id)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Date & Time:</span>
                  <span className="text-right">{selectedFlight.date} at {selectedFlight.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Price:</span>
                  <span className="text-xl font-bold text-[#cd7e0f]">${Number(selectedFlight.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Trip:</span>
                  <span className="text-right">{selectedFlight.trip || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tour Type:</span>
                  <span className="text-right">{selectedFlight.tour_type || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Passenger/Class:</span>
                  <span className="text-right">
                    {selectedFlight.passenger_class
                      || ((selectedFlight.passenger_count ? `${selectedFlight.passenger_count} Passenger${selectedFlight.passenger_count > 1 ? 's' : ''}` : '')
                        + (selectedFlight.class ? ` ${selectedFlight.class}` : '')).trim()
                      || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Passenger Name:</span>
                  <span className="text-right">{selectedFlight.passenger_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Tracking Number:</span>
                  <span className="text-right font-mono bg-gray-100 px-2 py-1 rounded">{selectedFlight.tracking_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleDelete(selectedFlight.id)}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Delete Flight
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}