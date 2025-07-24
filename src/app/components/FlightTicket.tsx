import React, { forwardRef } from 'react';

interface FlightTicketProps {
  passengerName: string;
  flightNumber: string;
  airlineName: string;
  airlineLogo: string; // URL
  departure: string;
  arrival: string;
  date: string;
  time: string;
  trackingNumber: string;
  trip: string;
  tourtype: string;
  passengerclass: string;
}

const FlightTicket = forwardRef<HTMLDivElement, FlightTicketProps>(({
  passengerName,
  flightNumber,
  airlineName,
  airlineLogo,
  departure,
  arrival,
  date,
  time,
  trackingNumber,
  trip,
  tourtype,
  passengerclass,
}, ref) => {
  return (
    <div ref={ref} id="ticket" style={{ 
      width: '100%',
      maxWidth: '900px',
      margin: '2rem auto', 
      backgroundColor: '#ffffff', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
      borderRadius: '1rem', 
      padding: '2rem',
      border: '1px solid #e5e7eb'
    }}>
      {/* Header with Airline Info */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #f3f4f6',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={airlineLogo} alt="Airline Logo" style={{ height: '4rem', width: '4rem', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#18176b', marginBottom: '0.25rem' }}>{airlineName}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Flight No: {flightNumber}</div>
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#18176b', 
          color: '#ffffff', 
          padding: '0.5rem 1rem', 
          borderRadius: '9999px', 
          fontSize: '0.875rem', 
          fontWeight: '600' 
        }}>CONFIRMED</div>
      </div>

      {/* Route Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#18176b', marginBottom: '1rem' }}>Route Information</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* From Card */}
          <div style={{ 
            flex: '1',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>From</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{departure}</div>
          </div>
          
          <div style={{ fontSize: '1.5rem', color: '#18176b', fontWeight: 'bold' }}>→</div>
          
          {/* To Card */}
          <div style={{ 
            flex: '1',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>To</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{arrival}</div>
          </div>
        </div>
      </div>

      {/* Passenger Information Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#18176b', marginBottom: '1rem' }}>Passenger Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Passenger Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Passenger</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{passengerName}</div>
          </div>

          {/* Class Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Class</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{passengerclass}</div>
          </div>

          {/* Trip Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Trip</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{trip}</div>
          </div>

          {/* Tour Type Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Tour Type</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{tourtype}</div>
          </div>
        </div>
      </div>

      {/* Flight Details Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#18176b', marginBottom: '1rem' }}>Flight Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Date Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Date</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{date}</div>
          </div>

          {/* Time Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Time</div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '1rem' }}>{time}</div>
          </div>

          {/* Tracking Card */}
          <div style={{ 
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '600' }}>Tracking</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#18176b', fontWeight: '600' }}>{trackingNumber}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.875rem', 
        color: '#6b7280', 
        marginTop: '1.5rem', 
        borderTop: '1px solid #e5e7eb', 
        paddingTop: '1rem',
        fontStyle: 'italic'
      }}>
        Please present this ticket at check-in
      </div>
    </div>
  );
});

export default FlightTicket; 