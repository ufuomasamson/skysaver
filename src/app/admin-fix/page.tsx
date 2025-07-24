"use client";

import { useState } from 'react';

export default function FixAdmin() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const fixAdminAccess = async () => {
    setLoading(true);
    setStatus('Fixing admin access...');

    // Step 1: Check cookie
    let userCookie = null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'user') {
        try {
          userCookie = JSON.parse(decodeURIComponent(value));
          setStatus('Found user cookie: ' + JSON.stringify(userCookie, null, 2));
        } catch (e) {
          setStatus('Found cookie but could not parse it');
        }
        break;
      }
    }

    if (!userCookie) {
      setStatus('No user cookie found. Please log in first.');
      setLoading(false);
      return;
    }

    // Step 2: Update cookie with admin role
    try {
      // Force set the role to admin in the cookie
      const updatedCookie = {...userCookie, role: 'admin'};
      
      // Set the cookie directly
      document.cookie = `user=${encodeURIComponent(JSON.stringify(updatedCookie))};path=/;max-age=${60*60*24*7}`;
      
      setStatus('Updated cookie with admin role. Reloading page in 3 seconds...');
      
      // Wait a moment then reload
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      setStatus('Error updating cookie: ' + (error instanceof Error ? error.message : String(error)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Quick Admin Access Fix</h1>
        
        <p className="mb-6 text-gray-700">
          This will update your browser cookie to include the admin role, which should give you 
          immediate access to the admin dashboard.
        </p>
        
        <button
          onClick={fixAdminAccess}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fixing...' : 'Fix Admin Access Now'}
        </button>
        
        {status && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="font-semibold mb-2">Status:</h2>
            <pre className="whitespace-pre-wrap text-sm">{status}</pre>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
