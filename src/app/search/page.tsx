"use client";
import { useState, useEffect } from "react";
import { useCurrencyStore } from "@/lib/currencyManager";

export default function SearchPage() {
  const { formatPrice } = useCurrencyStore();
  const [departureCountry, setDepartureCountry] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalCountry, setArrivalCountry] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [tripType, setTripType] = useState("one-way");
  const [passengers, setPassengers] = useState("1");
  const [classType, setClassType] = useState("economy");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [airlines, setAirlines] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    // Fetch airlines and locations for dropdowns
    const fetchData = async () => {
      try {
        const [airlinesRes, locationsRes] = await Promise.all([
          fetch("/api/airlines"),
          fetch("/api/locations")
        ]);
        const airlinesData = await airlinesRes.json();
        const locationsData = await locationsRes.json();
        setAirlines(airlinesData || []);
        setLocations(locationsData || []);
      } catch (err) {
        setAirlines([]);
        setLocations([]);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResults([]);
    
    // Query flights from API
    try {
      const response = await fetch("/api/flights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departureCity,
          departureCountry,
          arrivalCity,
          arrivalCountry,
          flightDate
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Error fetching flights");
        setLoading(false);
        return;
      }
      setResults(data || []);
    } catch (err) {
      setError("Error fetching flights");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Perfect Flight</h1>
          <p className="text-xl">Search, compare, and book flights to destinations worldwide</p>
        </div>
      </section>

      {/* Search Form */}
      <section className="relative -mt-10 z-30 mb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-[#18176b] mb-6 text-center">Search Flights</h2>
            
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Trip Type */}
              <div className="flex gap-4 justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tripType"
                    value="one-way"
                    checked={tripType === "one-way"}
                    onChange={(e) => setTripType(e.target.value)}
                    className="text-[#cd7e0f]"
                  />
                  <span>One Way</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tripType"
                    value="round-trip"
                    checked={tripType === "round-trip"}
                    onChange={(e) => setTripType(e.target.value)}
                    className="text-[#cd7e0f]"
                  />
                  <span>Round Trip</span>
                </label>
              </div>

              {/* Route Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <input
                    type="text"
                    placeholder="Departure City"
                    value={departureCity}
                    onChange={(e) => setDepartureCity(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input
                    type="text"
                    placeholder="Arrival City"
                    value={arrivalCity}
                    onChange={(e) => setArrivalCity(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] text-gray-900"
                  />
                </div>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Departure Date</label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] text-gray-900"
                  />
                </div>
                {tripType === "round-trip" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f]"
                    />
                  </div>
                )}
              </div>

              {/* Passengers and Class */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] text-gray-900"
                  >
                    <option value="1">1 Passenger</option>
                    <option value="2">2 Passengers</option>
                    <option value="3">3 Passengers</option>
                    <option value="4">4 Passengers</option>
                    <option value="5">5+ Passengers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    value={classType}
                    onChange={(e) => setClassType(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] text-gray-900"
                  >
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                    <option value="first">First Class</option>
                  </select>
                </div>
              </div>

              {error && <div className="text-red-500 text-center">{error}</div>}
              
              <button
                type="submit"
                className="w-full bg-[#cd7e0f] text-white py-4 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition text-lg"
                disabled={loading}
              >
                {loading ? "Searching..." : "Search Flights"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {results.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#18176b] mb-6">Available Flights</h2>
            <div className="grid grid-cols-1 gap-6">
              {results.map((flight, idx) => (
                <div key={flight.id || idx} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {/* Airline Logo */}
                      <div className="w-20 h-20 flex items-center justify-center">
                        {flight.airline?.logo_url ? (
                          <img src={flight.airline.logo_url} alt={flight.airline.name} className="w-16 h-16 object-contain" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-sm">Logo</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Flight Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-8">
                          <div>
                            <div className="font-bold text-lg">{flight.departure_location?.city || 'Departure City'}</div>
                            <div className="text-gray-600 text-sm">{flight.departure_location?.country || ''}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl text-[#cd7e0f]">→</div>
                            <div className="text-sm text-gray-600">{flight.flight_number}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{flight.arrival_location?.city || 'Arrival City'}</div>
                            <div className="text-gray-600 text-sm">{flight.arrival_location?.country || ''}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Date: {flight.date} | Time: {flight.time} | {flight.airline?.name || 'Airline'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Price and Action */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#cd7e0f] mb-2">{formatPrice(flight.price)}</div>
                      <a
                        href={`/track?tracking_number=${flight.tracking_number}`}
                        className="bg-[#18176b] text-white px-6 py-2 rounded-lg hover:bg-[#18176b]/90 transition"
                      >
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {results.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-[#18176b] mb-2">No flights found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or dates</p>
          </div>
        )}
      </section>
    </div>
  );
} 