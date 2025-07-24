"use client";

import { useState } from 'react';

export default function LogoutTest() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Function to check the current user cookie
  const checkUserCookie = (): string => {
    const cookies = document.cookie.split(';');
    let userCookie = null;
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'user') {
        try {
          userCookie = JSON.parse(decodeURIComponent(value));
          return `Found user cookie: ${JSON.stringify(userCookie, null, 2)}`;
        } catch (e) {
          return `Found user cookie but couldn't parse: ${value}`;
        }
      }
    }
    
    return 'No user cookie found';
  };

  // Function to handle logout
  const handleLogout = async () => {
    setLoading(true);
    setStatus('Logging out...');
    
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`Logout successful: ${data.message || 'User logged out'}`);
        
        // Check if cookie was actually removed
        setTimeout(() => {
          setStatus(prev => prev + '\n' + checkUserCookie());
        }, 500);
      } else {
        setStatus(`Logout failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatus(`Error during logout: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to force a page refresh
  const refreshPage = () => {
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Logout Test Page</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Current Cookie Status:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {checkUserCookie()}
          </pre>
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Logging out...' : 'Test Logout'}
          </button>
          
          <button
            onClick={refreshPage}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Refresh Page
          </button>
          
          <a 
            href="/" 
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 text-center"
          >
            Back to Home
          </a>
        </div>
        
        {status && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Status:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
              {status}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Metadata cannot be exported from client components
// export const metadata = {
//   title: 'Logout Testing Tool',
// };
