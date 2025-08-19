"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MigrateFlights() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const migrateFlights = async () => {
    setLoading(true);
    setStatus('Starting migration of flights from MySQL to Supabase...');

    try {
      // 1. First, fetch all flights from MySQL
      const mysqlResponse = await fetch('/api/flights');
      if (!mysqlResponse.ok) {
        throw new Error(`Failed to fetch flights from MySQL: ${await mysqlResponse.text()}`);
      }
      
      const flights = await mysqlResponse.json();
      setStatus(`Found ${flights.length} flights in MySQL database.`);
      
      if (flights.length === 0) {
        setStatus('No flights found in MySQL database to migrate.');
        setLoading(false);
        return;
      }
      
      // 2. Insert each flight into Supabase
      setStatus(`Preparing to insert ${flights.length} flights into Supabase...`);
      
      let successCount = 0;
      let failureCount = 0;
      
      for (const flight of flights) {
        try {
          // Map MySQL flight to Supabase format
          const supabaseFlight = {
            flight_number: flight.flight_number || `FL-${Math.floor(Math.random() * 10000)}`,
            airline_id: flight.airline_id,
            departure_location_id: flight.departure_location_id,
            arrival_location_id: flight.arrival_location_id,
            date: flight.date,
            time: flight.time || '12:00',
            price: flight.price,
            passenger_name: flight.passenger_name,
            tracking_number: flight.tracking_number || Math.random().toString(36).substring(2, 10).toUpperCase(),
            created_at: new Date().toISOString(),
            status: flight.status || 'scheduled'
          };
          
          // Insert into Supabase
          const { error } = await supabase
            .from('flights')
            .insert(supabaseFlight);
          
          if (error) {
            throw error;
          }
          
          successCount++;
          setStatus(`Successfully migrated ${successCount}/${flights.length} flights to Supabase.`);
        } catch (error) {
          failureCount++;
          console.error(`Failed to migrate flight ${flight.id || 'unknown'}:`, error);
          setStatus(`Error migrating flight ${flight.id || 'unknown'}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      setStatus(`Migration complete. Successfully migrated ${successCount} flights. Failed: ${failureCount}`);
      
    } catch (error) {
      setStatus(`Migration failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">MySQL to Supabase Flight Migration</h1>
        
        <p className="mb-6 text-gray-700">
          This tool will migrate all flights from your MySQL database to Supabase.
          Make sure you have configured Supabase correctly before proceeding.
        </p>
        
        <button
          onClick={migrateFlights}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Migrating...' : 'Migrate Flights to Supabase'}
        </button>
        
        {status && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="font-semibold mb-2">Status:</h2>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Important Note</h3>
            <p className="mt-2 text-sm text-yellow-700">
              Your application is currently using MySQL to store flights, but you're looking at Supabase.
              This migration will copy data from MySQL to Supabase, but future flights will still be created in MySQL
              unless you update your API endpoints.
            </p>
          </div>
          
          <div className="flex justify-center">
            <a href="/admin/flights" className="text-blue-600 hover:text-blue-800 font-medium">
              Back to Flight Management
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
