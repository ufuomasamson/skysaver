"use client";

import { useState } from 'react';

export default function CompleteSignout() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const handleSignOut = async () => {
    setLoading(true);
    setStatus('Signing out...');
    
    try {
      // Clear all browser storage - this is the nuclear option
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      
      // Call our logout API
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Logout API call failed');
      }
      
      setStatus('Sign out successful! Redirecting...');
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Sign Out</h1>
        
        <p className="mb-6 text-gray-600">
          Use this page to completely sign out and clear all session data. This can help fix issues
          with authentication, admin permissions, or other login-related problems.
        </p>
        
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Signing Out...' : 'Complete Sign Out'}
        </button>
        
        {status && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {status}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/" className="text-blue-600 hover:text-blue-800">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
