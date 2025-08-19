'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboardTest() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const endpoints = [
    { name: 'Locations', path: '/api/locations' },
    { name: 'Users', path: '/api/users' },
    { name: 'Crypto Wallets', path: '/api/crypto-wallets' },
    { name: 'Payments', path: '/api/payments?status=approved' },
    { name: 'Direct API Test', path: '/api/test-direct-api' },
    { name: 'Database Query Test', path: '/api/database?collection=flights&limit=5' }
  ];

  const testEndpoint = async (endpoint: string, name: string) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: null }));
    
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      setResults(prev => ({ 
        ...prev, 
        [name]: {
          status: response.status,
          data,
          timestamp: new Date().toISOString()
        }
      }));
      
      if (!response.ok) {
        setErrors(prev => ({ 
          ...prev, 
          [name]: `Error ${response.status}: ${data.message || data.error || 'Unknown error'}` 
        }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [name]: err.message || 'An error occurred' }));
      setResults(prev => ({ 
        ...prev, 
        [name]: {
          status: 'error',
          error: err.toString(),
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const testAllEndpoints = () => {
    endpoints.forEach(({ name, path }) => {
      testEndpoint(path, name);
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard API Test</h1>
      <p className="mb-6">
        Test all API endpoints that were converted to use the Direct API approach to bypass region access issues.
      </p>
      
      <div className="mb-6">
        <button
          onClick={testAllEndpoints}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test All Endpoints
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {endpoints.map(({ name, path }) => (
          <div key={name} className="border rounded shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{name}</h2>
              <button
                onClick={() => testEndpoint(path, name)}
                disabled={loading[name]}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                {loading[name] ? 'Testing...' : 'Test'}
              </button>
            </div>
            
            <div className="text-sm opacity-70 mb-2">Endpoint: {path}</div>
            
            {errors[name] && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {errors[name]}
              </div>
            )}
            
            {results[name] && (
              <div>
                <div className="flex space-x-2 mb-2">
                  <span className="font-medium">Status:</span>
                  <span className={results[name].status >= 200 && results[name].status < 300 ? 'text-green-600' : 'text-red-600'}>
                    {results[name].status}
                  </span>
                </div>
                
                <div className="mb-2">
                  <span className="font-medium">Timestamp:</span>{' '}
                  {results[name].timestamp && new Date(results[name].timestamp).toLocaleTimeString()}
                </div>
                
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Response Data
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-3 rounded overflow-auto text-xs max-h-64">
                    {JSON.stringify(results[name].data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
