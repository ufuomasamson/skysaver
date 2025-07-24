"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, TABLES } from "@/lib/supabaseClient";
import FlightTicket from "@/app/components/FlightTicket";
import { downloadTicket } from "@/lib/downloadTicket";

export default function TicketPage() {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [airlineLogo, setAirlineLogo] = useState<string>("");
  const [error, setError] = useState("");
  const router = useRouter();
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      
      try {
        // Get user from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setError("You must be logged in to view your ticket.");
          setLoading(false);
          return;
        }
        
        const userId = session.user.id;
        
        // Use Supabase to fetch booking data
        const bookingsList = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.BOOKINGS,
          [
            Query.equal("user_id", userId),
            Query.equal("payment_status", "paid"),
            Query.orderDesc("payment_date"),
            Query.limit(1)
          ]
        );
        
        const booking = bookingsList.documents[0];
        
        if (!booking) {
          throw new Error("No paid booking found");
        }
        
        // Get the flight information
        const flight = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.FLIGHTS,
          booking.flight_id
        );
        
        // Get airline information
        const airline = await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.AIRLINES,
          flight.airline_id
        );
        
        // Combine the data for compatibility with existing component
        const bookingData = {
          ...booking,
          flights: {
            ...flight,
            airline: airline
          }
        };
          
        // Set the booking data
        setBooking(bookingData);
        
        // Fetch airline logo if available
        if (airline && airline.logo_url) {
          setAirlineLogo(airline.logo_url);
        } else {
          setAirlineLogo("/globe.svg"); // fallback logo
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching ticket:", error);
        setError("Failed to load ticket information");
        setLoading(false);
      }
    };
    fetchTicket();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]">Loading ticket...</div>;
  }
  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-600 font-semibold">{error}</div>;
  }
  if (!booking) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
      <FlightTicket
        ref={ticketRef}
        passengerName={booking.passenger_name}
        flightNumber={booking.flights?.flight_number || "-"}
        airlineName={booking.flights?.airline?.name || "-"}
        airlineLogo={airlineLogo}
        departure={booking.flights?.departure_city || "-"}
        arrival={booking.flights?.arrival_city || "-"}
        date={booking.flights?.date || "-"}
        time={booking.flights?.time || "-"}
        trackingNumber={booking.tracking_number || booking.id}
        trip={booking.flights?.trip || "-"}
        tourtype={booking.flights?.tour_type || "-"}
        passengerclass={booking.passenger_class || "Economy"}
      />
      <button
        onClick={() => downloadTicket(ticketRef)}
        className="mt-4 px-6 py-2 bg-[#18176b] text-white rounded-lg font-semibold shadow hover:bg-[#1f1e89] transition"
      >
        Download Ticket
      </button>
    </div>
  );
} 