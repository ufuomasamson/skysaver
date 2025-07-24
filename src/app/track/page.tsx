
"use client";
import { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal";
import FlightTicket from "../components/FlightTicket";
import { downloadTicket } from "@/lib/downloadTicket";
import { useCurrencyStore } from "@/lib/currencyManager";
import { useSearchParams } from "next/navigation";
import InlinePaymentModal from "@/components/InlinePaymentModal";
import { convertToNGN, logConversion } from "@/lib/currencyConversion";

export default function TrackFlightPage() {
  // Payment modal state and handlers must be inside the component
  const [wallets, setWallets] = useState<any[]>([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showWalletsModal, setShowWalletsModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInlinePaymentModal, setShowInlinePaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [proofFile, setProofFile] = useState<File|null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [availableGateways, setAvailableGateways] = useState<{
    crypto: boolean;
    paystack: boolean;
  }>({ crypto: true, paystack: true }); // Set paystack to true by default

  // Fetch wallets only when needed
  const handleOpenPaymentModal = async () => {
    setShowPaymentMethodModal(true);
    
    // Always show both payment methods since they're implemented
    // We can add more sophisticated checking later if needed
    setAvailableGateways({
      crypto: true,
      paystack: true
    });
  };

  const handleSelectPaymentMethod = (method: string) => {
    setShowPaymentMethodModal(false);
    
    if (method === 'crypto') {
      handleOpenWalletsModal();
    } else if (method === 'paystack') {
      // Open inline payment modal instead of redirecting
      setShowInlinePaymentModal(true);
    }
  };

  const handleOpenWalletsModal = async () => {
    setShowWalletsModal(true);
    if (wallets.length === 0) {
      try {
        const res = await fetch("/api/crypto-wallets");
        const data = await res.json();
        setWallets(data);
      } catch {}
    }
  };

  const handlePaystackPayment = async () => {
    if (!booking?.id || !flight?.price) {
      setError("Booking or flight information not available");
      return;
    }

    setPaymentLoading(true);
    try {
      const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
      let userObj = null;
      if (userCookie) {
        userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
      }

      if (!userObj?.email) {
        setError("User email not found. Please log in again.");
        setPaymentLoading(false);
        return;
      }

      // Get current selected currency from store
      const { currency } = useCurrencyStore.getState();
      
      // Convert flight price to NGN for Paystack processing using centralized utility
      const conversion = convertToNGN(flight.price, 'EUR'); // flight.price is in EUR base currency
      
      // Log conversion for debugging
      logConversion(conversion, 'Track Page Payment');

      const response = await fetch('/api/payment/paystack/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          userId: userObj.id,
          amount: conversion.amountInKobo,
          currency: 'NGN' // Always use NGN for Paystack
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.payment_url) {
        // Redirect to Paystack payment page
        window.location.href = data.data.payment_url;
      } else {
        const errorMessage = data.error || 'Failed to initialize payment';
        if (errorMessage.includes('not configured')) {
          setError('Paystack payment is currently unavailable. Please contact support or try crypto payment.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle inline payment success
  const handlePaymentSuccess = async (reference: string) => {
    console.log('Payment successful with reference:', reference);
    setSuccess('Payment successful! Your flight is confirmed and approved!');
    setError('');
    
    // Give the API a moment to update the booking status
    setTimeout(async () => {
      // Refresh booking data to show updated payment status
      const trackNum = searchParams.get("tracking_number");
      if (trackNum) {
        await handleTrackFlight(trackNum);
      }
    }, 2000);
  };

  // Handle inline payment error
  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setError(`Payment failed: ${error}`);
    setSuccess('');
  };

  const handleSelectWallet = (wallet: any) => {
    setSelectedWallet(wallet);
    setShowWalletsModal(false);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedWallet(null);
    setPaymentAmount("");
    setProofFile(null);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  // Submit payment proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleSubmitProof booking:', booking);
    if (!selectedWallet || !paymentAmount || !proofFile || !booking || !booking.id) {
      setError("Booking not found or invalid. Please book the flight first.");
      return;
    }
    setSubmittingProof(true);
    // Get user info from cookie
    const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    let userObj = null;
    if (userCookie) {
      userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
    }
    
    if (!userObj || !userObj.id) {
      setError("User information not found. Please log in again.");
      setSubmittingProof(false);
      return;
    }
    
    const formData = new FormData();
    formData.append("booking_id", booking.id);
    formData.append("amount", paymentAmount);
    formData.append("payment_proof", proofFile); // Renamed from proof to payment_proof
    formData.append("payment_method", "crypto"); // Add payment method
    formData.append("currency", "USD"); // Add default currency
    formData.append("user_id", userObj.id); // Add user ID
    formData.append("user_email", userObj.email || ""); // Add user email if available
    
    console.log('[DEBUG] Submitting payment proof with data:', {
      booking_id: booking.id,
      amount: paymentAmount,
      payment_method: "crypto",
      user_id: userObj.id
    });
    
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        handleClosePaymentModal();
        setShowWalletsModal(false);
        setSuccess("Payment proof submitted successfully! Your booking is awaiting admin approval.");
        // Always re-fetch booking from backend to get latest status
        // Use current flight.id and user id from cookie
        try {
          const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
          let userObj = null;
          if (userCookie) {
            userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          }
          if (userObj && flight && flight.id) {
            const bookingRes = await fetch(`/api/bookings?user_id=${userObj.id}&flight_id=${flight.id}`);
            let bookingData = await bookingRes.json();
            let bookingObj = null;
            if (Array.isArray(bookingData)) {
              bookingObj = bookingData.length > 0 ? bookingData[0] : null;
            } else if (bookingData && typeof bookingData === 'object') {
              bookingObj = bookingData;
            }
            console.log('[DEBUG] After proof upload, fetched booking:', bookingObj);
            if (bookingRes.ok && bookingObj) {
              // Update the booking status to "awaiting_approval" after payment submission
              if (bookingObj.status !== 'approved') {
                const updateBookingRes = await fetch(`/api/bookings/${bookingObj.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'awaiting_approval' })
                });
                if (updateBookingRes.ok) {
                  bookingObj.status = 'awaiting_approval';
                }
              }
              setBooking(bookingObj);
              console.log('[DEBUG] After proof upload, passenger_name:', bookingObj.passenger_name);
            }
          }
        } catch (err) {
          console.log('[DEBUG] Error fetching booking after proof upload:', err);
        }
      } else {
        setError("Failed to submit proof. Try again.");
      }
    } catch (err) {
      setError("Failed to submit proof. Try again.");
      console.log('[DEBUG] Error in handleSubmitProof:', err);
    }
    setSubmittingProof(false);
  };
  const [trackingNumber, setTrackingNumber] = useState("");
  const [flight, setFlight] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const searchParams = useSearchParams();
  const formatPrice = useCurrencyStore((s) => s.formatPrice);
  const currency = useCurrencyStore((s) => s.currency);
  // DEBUG LOGGING
  useEffect(() => {
    if (flight) {
      // Log the full flight object and key fields
      console.log('[DEBUG] Flight object:', flight);
      console.log('[DEBUG] Airline:', flight.airline);
      console.log('[DEBUG] Departure:', flight.departure);
      console.log('[DEBUG] Arrival:', flight.arrival);
      console.log('[DEBUG] Tracking Number:', flight.tracking_number);
      console.log('[DEBUG] Raw Price:', flight.price);
      try {
        const formatted = formatPrice(flight.price);
        console.log('[DEBUG] Formatted Price:', formatted);
      } catch (e) {
        console.log('[DEBUG] formatPrice error:', e);
      }
    }
    if (booking) {
      // Log the full booking object and key fields
      console.log('[DEBUG] Booking object:', booking);
      console.log('[DEBUG] Passenger Name:', booking.passenger_name);
      console.log('[DEBUG] Paid:', booking.paid);
    }
  }, [flight, booking]);

  useEffect(() => {
    // Optionally auto-track if tracking number is in query params
    const trackNum = searchParams.get("tracking_number");
    if (trackNum) {
      handleTrackFlight(trackNum);
    }
  }, [searchParams]);

  const handleTrackFlight = async (trackNumber: string) => {
    setError("");
    setFlight(null);
    setBooking(null);
    setLoading(true);
    try {
      console.log('Tracking flight with number:', trackNumber);
      // Fetch flight info from API
      const response = await fetch(`/api/flights?tracking_number=${trackNumber}`);
      const flightData = await response.json();
      console.log('Flight data response:', flightData);
      
      if (!response.ok || !flightData) {
        setError("Flight not found with this tracking number");
        setLoading(false);
        return;
      }
      // Map nested fields to UI-compatible format
      const mappedFlight = {
        ...flightData,
        airline: flightData.airline ? {
          name: flightData.airline.name,
          logo_url: flightData.airline.logo_url
        } : undefined,
        departure: flightData.departure_location ? {
          city: flightData.departure_location.city,
          country: flightData.departure_location.country
        } : undefined,
        arrival: flightData.arrival_location ? {
          city: flightData.arrival_location.city,
          country: flightData.arrival_location.country
        } : undefined
      };
      setFlight(mappedFlight);
      // Fetch booking info for logged-in user (from cookie)
      const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
      if (userCookie) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
          const bookingRes = await fetch(`/api/bookings?user_id=${userObj.id}&flight_id=${flightData.id}`);
          let bookingData = await bookingRes.json();
          // Always set booking to an object or null, never an array
          let bookingObj = null;
          if (Array.isArray(bookingData)) {
            bookingObj = bookingData.length > 0 ? bookingData[0] : null;
          } else if (bookingData && typeof bookingData === 'object') {
            bookingObj = bookingData;
          }
          // Only set booking if it matches the current flight
          if (bookingRes.ok && bookingObj && bookingObj.flight_id === flightData.id) {
            setBooking(bookingObj);
            console.log('[DEBUG] setBooking (object):', bookingObj);
          } else {
            setBooking(null);
            console.log('[DEBUG] setBooking: null (no booking found for this flight)');
          }
        } catch (err) {
          setBooking(null);
          console.log('[DEBUG] setBooking: null (error)', err);
        }
      } else {
        setBooking(null);
        console.log('[DEBUG] setBooking: null (no user cookie)');
      }
    } catch (err) {
      setError("Flight not found with this tracking number");
    }
    setLoading(false);
  };

    const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTrackFlight(trackingNumber);
  };

  // Payment and proof upload logic will be handled via UI and admin approval

  const handleBookFlight = async () => {
    if (!flight) return;
    
    setBookingLoading(true);
    setError("");
    setSuccess("");
    
    // Get user from cookie
    const userCookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!userCookie) {
      setError("You must be logged in to book a flight.");
      setBookingLoading(false);
      return;
    }
    
    let userObj;
    try {
      userObj = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
    } catch {
      setError("Invalid user session. Please log in again.");
      setBookingLoading(false);
      return;
    }
    
    // Use passenger name from the tracked flight if available, otherwise fallback to user info
    let passengerName = flight.passenger_name || userObj.full_name || userObj.name || userObj.email || "N/A";
    console.log('[DEBUG] handleBookFlight userObj:', userObj);
    console.log('[DEBUG] handleBookFlight passengerName:', passengerName);
    
    try {
      // Check if booking already exists
      const bookingRes = await fetch(`/api/bookings?user_id=${userObj.id}&flight_id=${flight.id}`);
      let existingBooking = await bookingRes.json();
      let bookingObj = null;
      
      if (Array.isArray(existingBooking)) {
        bookingObj = existingBooking.length > 0 ? existingBooking[0] : null;
      } else if (existingBooking && typeof existingBooking === 'object') {
        bookingObj = existingBooking;
      }
      
      // Only set booking if it matches the current flight
      if (bookingRes.ok && bookingObj && bookingObj.flight_id === flight.id) {
        setBooking(bookingObj);
        setSuccess("Booking already exists for this flight!");
        setBookingLoading(false);
        return;
      }
      
      setBooking(null); // No valid booking for this flight
      
      // Create new booking with all required fields
      const bookingData = {
        user_id: userObj.id,
        flight_id: flight.id,
        passenger_name: passengerName,
        paid: false,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[DEBUG] Creating booking with data:', bookingData);
      
      // Create booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('[DEBUG] Booking creation failed:', errorData);
        setError(errorData.error || "Failed to book flight.");
      } else {
        let bookingResponse = await res.json();
        let newBookingObj = null;
        
        if (Array.isArray(bookingResponse)) {
          newBookingObj = bookingResponse.length > 0 ? bookingResponse[0] : null;
        } else if (bookingResponse && typeof bookingResponse === 'object') {
          newBookingObj = bookingResponse;
        }
        
        console.log('[DEBUG] Booking created successfully:', newBookingObj);
        setBooking(newBookingObj);
        setSuccess("Flight booked successfully! You can now proceed with payment.");
      }
    } catch (error) {
      console.error('[DEBUG] Error in handleBookFlight:', error);
      setError("An error occurred while booking the flight. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const ticketRef = useRef<HTMLDivElement>(null);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Track Your Flight</h1>
          <p className="text-xl mb-8">Enter your tracking number to view flight details and manage your booking</p>
          
          <form onSubmit={handleTrack} className="max-w-md mx-auto">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter Tracking Number"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                className="flex-1 p-3 rounded text-gray-900"
                required
              />
              <button
                type="submit"
                className="bg-[#cd7e0f] text-white px-6 py-3 rounded hover:bg-[#cd7e0f]/90 transition"
                disabled={loading}
              >
                {loading ? "Searching..." : "Track"}
              </button>
            </div>
            {error && <div className="text-red-200 mt-4 font-semibold">{error}</div>}
            {success && <div className="text-green-200 mt-4 font-semibold">{success}</div>}
          </form>
        </div>
      </section>

      {/* Flight Details */}
      {flight && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-[#18176b] mb-6">Flight Details</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Flight Information */}
                <div className="space-y-6">
                  {/* Airline Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {flight.airline?.logo_url ? (
                      <img src={flight.airline.logo_url} alt={flight.airline.name} className="w-16 h-16 object-contain rounded" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 flex items-center justify-center rounded">
                        <span className="text-gray-500">Logo</span>
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-xl text-[#18176b]">{flight.airline?.name || "Airline"}</div>
                      <div className="text-gray-600">Flight No: <span className="font-mono">{flight.flight_number}</span></div>
                    </div>
                  </div>
                  
                  {/* Route Information */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg text-[#18176b] mb-4">Route Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-[#18176b]">Departure</div>
                          <div className="text-gray-600">{flight.departure?.city}, {flight.departure?.country}</div>
                        </div>
                        <div className="text-2xl text-[#cd7e0f]">→</div>
                        <div className="text-right">
                          <div className="font-semibold text-[#18176b]">Destination</div>
                          <div className="text-gray-600">{flight.arrival?.city}, {flight.arrival?.country}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date and Time */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg text-[#18176b] mb-4">Schedule</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-semibold text-[#18176b]">Date</div>
                        <div className="text-gray-600">{flight.date}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#18176b]">Time</div>
                        <div className="text-gray-600">{flight.time}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="p-4 bg-[#18176b] text-white rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatPrice(flight.price)}</div>
                      <div>Total Price</div>
                    </div>
                  </div>
                </div>
                
                {/* Booking Status and Actions */}
                <div className="space-y-6">
                  {/* Passenger Information */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg text-[#18176b] mb-4">Passenger Information</h3>
                    <div>
                      <div className="font-semibold text-[#18176b]">Passenger Name</div>
                      <div className="text-gray-600">
                        {(booking && booking.passenger_name) ? booking.passenger_name : (flight.passenger_name || "N/A")}
                      </div>
                    </div>
                  </div>
                  
                  {/* Booking Status */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-bold text-lg text-[#18176b] mb-4">Booking Status</h3>
                    {booking ? (
                      <div>
                        {/* Status indicator */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`w-3 h-3 rounded-full 
                            ${booking.status === 'approved' && booking.paid ? 'bg-green-500' : 
                              booking.status === 'awaiting_approval' ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                          <span className="font-semibold">
                            {booking.status === 'approved' && booking.paid ? 'Approved' :
                              booking.status === 'awaiting_approval' ? 'Awaiting Approval' :
                              'Pending'}
                          </span>
                        </div>
                        {/* Show Download Ticket only if approved and paid */}
                        {booking.status === 'approved' && booking.paid ? (
                          <div className="space-y-3">
                            <div className="text-green-600 font-semibold">✓ Your flight is confirmed and approved!</div>
                            <div className="my-6">
                              <FlightTicket
                                ref={ticketRef}
                                passengerName={booking.passenger_name}
                                flightNumber={flight.flight_number}
                                airlineName={flight.airline?.name || "-"}
                                airlineLogo={flight.airline?.logo_url || "/globe.svg"}
                                departure={flight.departure?.city || "-"}
                                arrival={flight.arrival?.city || "-"}
                                date={flight.date || "-"}
                                time={flight.time || "-"}
                                trackingNumber={flight.tracking_number || booking.id}
                                trip={flight.trip || "-"}
                                tourtype={flight.tour_type || "-"}
                                passengerclass={booking.passenger_class || "Economy"}
                              />
                            </div>
                            <button
                              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-center block"
                              onClick={() => downloadTicket(ticketRef)}
                            >
                              Download Ticket (PDF)
                            </button>
                          </div>
                        ) : booking.status === 'awaiting_approval' ? (
                          <div className="space-y-3">
                            <div className="text-yellow-600 font-semibold">Your payment proof has been submitted. Awaiting admin approval.</div>
                          </div>
                        ) : booking.status === 'approved' ? (
                          <div className="space-y-3">
                            <div className="text-green-600 font-semibold">Payment confirmed! Your booking has been approved.</div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-yellow-600 font-semibold">Payment required to confirm your booking</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-600">
                        <p>No booking found for this flight.</p>
                        <p className="mt-2">Please log in and book this flight to manage your ticket.</p>
                        <button
                          className="mt-4 w-full bg-[#18176b] text-white py-3 rounded-lg hover:bg-[#cd7e0f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleBookFlight}
                          disabled={bookingLoading}
                        >
                          {bookingLoading ? "Booking..." : "Book This Flight"}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Tracking Information */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-[#18176b]">Tracking Information</h4>
                    <div className="text-sm text-gray-600">
                      <p>Tracking Number: <span className="font-mono font-semibold">{flight.tracking_number}</span></p>
                      <p className="mt-2">Use this number to track your flight status anytime.</p>
                    </div>
                  </div>

                  {/* Payment Section for Tracked Flights */}
                  {!booking?.paid && (
                    <div className="space-y-4 mt-6">
                      <h4 className="font-bold text-lg text-[#18176b]">Pay For Flight</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <div className="text-sm text-green-800">
                          <strong>💳 Live Payment:</strong> You will be charged the actual flight price: {flight ? formatPrice(flight.price, flight.currency) : 'Loading...'}
                        </div>
                      </div>
                      <button
                        className="w-full bg-[#18176b] text-white py-3 rounded-lg hover:bg-[#cd7e0f] transition"
                        onClick={handleOpenPaymentModal}
                        disabled={paymentLoading}
                      >
                        {paymentLoading ? "Processing..." : `Pay For Flight - ${flight ? formatPrice(flight.price, flight.currency) : 'Loading...'}`}
                      </button>
                    </div>
                  )}
      {/* Payment Method Selection Modal */}
      <Modal open={showPaymentMethodModal} onClose={() => setShowPaymentMethodModal(false)} title="Choose Payment Method">
        <div className="space-y-4">
          <div className="text-gray-900 mb-4 font-medium">
            Select your preferred payment method:
          </div>
          
          {availableGateways.crypto && (
            <button
              onClick={() => handleSelectPaymentMethod('crypto')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#18176b] hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-[#18176b]">Crypto Wallet</div>
                  <div className="text-sm text-gray-700">Pay with cryptocurrency</div>
                </div>
                <div className="text-2xl">₿</div>
              </div>
            </button>
          )}

          {availableGateways.paystack && (
            <button
              onClick={() => handleSelectPaymentMethod('paystack')}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#18176b] hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-gray-900 group-hover:text-[#18176b]">Paystack</div>
                  <div className="text-sm text-gray-700">Pay with card or bank transfer</div>
                  {currency && !['NGN', 'USD'].includes(currency) && (
                    <div className="text-xs text-amber-600 mt-1">
                      Note: Will be converted to NGN for payment
                    </div>
                  )}
                </div>
                <div className="text-2xl">💳</div>
              </div>
            </button>
          )}

          {!availableGateways.crypto && !availableGateways.paystack && (
            <div className="text-center py-8 text-gray-700">
              No payment methods available at the moment.
              <br />
              Please contact support for assistance.
            </div>
          )}
        </div>
      </Modal>

      {/* Wallets Modal */}
      <Modal open={showWalletsModal} onClose={() => setShowWalletsModal(false)} title="Select a Crypto Wallet">
        <div className="space-y-4">
          {wallets.length === 0 && <div className="text-gray-800">Loading wallets...</div>}
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              className="w-full border border-gray-300 rounded-lg p-4 flex flex-col items-start hover:bg-gray-50 hover:border-[#18176b] transition-all duration-200"
              onClick={() => handleSelectWallet(wallet)}
            >
              <div className="font-bold text-lg text-gray-900">{wallet.name}</div>
              <div className="text-gray-700 text-sm font-medium">Network: {wallet.network}</div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPaymentModal} onClose={handleClosePaymentModal} title="Pay With Crypto">
        {selectedWallet && (
          <div className="max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmitProof} className="space-y-4">
              {/* Wallet Info - Compact */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-base text-gray-900">{selectedWallet.name}</div>
                  <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">{selectedWallet.network}</span>
                </div>
                
                <div className="text-gray-800 text-sm mb-2">
                  <span className="font-medium">Address:</span>
                </div>
                <div className="font-mono text-xs break-all text-gray-900 bg-gray-100 p-2 rounded border mb-3">
                  {selectedWallet.wallet_address}
                </div>
                
                {/* QR Code - Smaller and centered */}
                {selectedWallet.qr_code_url && (
                  <div className="flex justify-center mb-3">
                    <img 
                      src={selectedWallet.qr_code_url} 
                      alt="QR Code" 
                      className="w-24 h-24 object-contain border rounded" 
                    />
                  </div>
                )}
                
                {/* Instructions - Compact */}
                <div className="text-blue-800 text-sm font-medium p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                  💡 Send the exact amount to this address and upload proof below.
                </div>
              </div>

              {/* Form Fields - Compact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-900 text-sm">Amount Paid</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm focus:ring-2 focus:ring-[#18176b] focus:border-[#18176b]"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                
                <div>
                  <label className="block font-semibold mb-1 text-gray-900 text-sm">Proof of Payment</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofFileChange}
                    className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#18176b] file:text-white hover:file:bg-[#cd7e0f] file:cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#18176b] text-white py-3 rounded-lg hover:bg-[#cd7e0f] transition font-semibold text-sm"
                  disabled={submittingProof}
                >
                  {submittingProof ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Payment Proof"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Inline Payment Modal */}
      <InlinePaymentModal
        isOpen={showInlinePaymentModal}
        onClose={() => setShowInlinePaymentModal(false)}
        paymentData={{
          bookingId: booking?.id || '',
          userId: booking?.user_id || '',
          amount: flight?.price || 0, // Use actual flight price for live payments
          currency: flight?.currency || 'EUR', // Use flight currency
          flightNumber: flight?.flight_number || '',
          passengerName: booking?.passenger_name || ''
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}