"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestBookingsTable() {
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('Checking Supabase connection...');

  useEffect(() => {
    async function checkTables() {
      try {
        // Test Supabase connection
        const { data, error: connError } = await supabase.from('bookings').select('id').limit(1);
        
        if (connError) {
          if (connError.message.includes('does not exist')) {
            setTableExists(false);
            setMessage('The bookings table does not exist in Supabase.');
          } else {
            setError(connError.message);
          }
        } else {
          setTableExists(true);
          setMessage('Bookings table exists in Supabase!');
        }
        
        // List available tables for reference
        const { data: tablesData, error: tablesError } = await supabase
          .rpc('get_tables');
        
        if (tablesError) {
          console.error('Error fetching tables:', tablesError);
        } else if (tablesData) {
          setTables(tablesData);
        }
      } catch (err: any) {
        setError('Error checking Supabase: ' + err.message);
      }
    }
    
    checkTables();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-[#18176b]">Supabase Bookings Table Test</h1>
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : null}
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Bookings Table Status</h2>
          <div className={`p-4 rounded-lg ${tableExists === true ? 'bg-green-100 text-green-800' : tableExists === false ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}`}>
            {message}
          </div>
          
          {tableExists === false && (
            <div className="mt-4 text-sm text-gray-700">
              <p className="font-semibold">The bookings table needs to be created in Supabase. Run the migration script:</p>
              <pre className="bg-gray-100 p-3 mt-2 rounded overflow-auto">
                {`-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id INTEGER NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
    passenger_name TEXT NOT NULL,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending'
);`}
              </pre>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-3">Available Tables in Supabase</h2>
          {tables.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {tables.map((table, index) => (
                <li key={index} className="text-gray-800">{table}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Loading tables...</p>
          )}
        </div>
      </div>
    </div>
  );
}
