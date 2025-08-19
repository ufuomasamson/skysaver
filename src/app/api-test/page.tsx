'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  route: string;
  method: string;
  status: number;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>(['crypto-wallets', 'payments', 'users']);
  
  const availableTests = [
    { id: 'crypto-wallets', name: 'Crypto Wallets API' },
    { id: 'payments', name: 'Payments API' },
    { id: 'users', name: 'Users API' },
  ];
  
  const handleCheckboxChange = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    const newResults: TestResult[] = [];

    try {
      // Test crypto-wallets API if selected
      if (selectedTests.includes('crypto-wallets')) {
        // GET test
        try {
          const response = await fetch('/api/crypto-wallets');
          const data = await response.json();
          newResults.push({
            route: '/api/crypto-wallets',
            method: 'GET',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Successfully fetched wallets' : 'Failed to fetch wallets',
            data: response.ok ? data : undefined,
            error: !response.ok ? data : undefined
          });
        } catch (error: any) {
          newResults.push({
            route: '/api/crypto-wallets',
            method: 'GET',
            status: 500,
            success: false,
            message: 'Error fetching wallets',
            error: error.message
          });
        }
      }

      // Test payments API if selected
      if (selectedTests.includes('payments')) {
        // GET test
        try {
          const response = await fetch('/api/payments');
          const data = await response.json();
          newResults.push({
            route: '/api/payments',
            method: 'GET',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Successfully fetched payments' : 'Failed to fetch payments',
            data: response.ok ? data : undefined,
            error: !response.ok ? data : undefined
          });
        } catch (error: any) {
          newResults.push({
            route: '/api/payments',
            method: 'GET',
            status: 500,
            success: false,
            message: 'Error fetching payments',
            error: error.message
          });
        }
      }

      // Test users API if selected
      if (selectedTests.includes('users')) {
        // GET test
        try {
          const response = await fetch('/api/users');
          const data = await response.json();
          newResults.push({
            route: '/api/users',
            method: 'GET',
            status: response.status,
            success: response.ok,
            message: response.ok ? 'Successfully fetched users' : 'Failed to fetch users',
            data: response.ok ? data : undefined,
            error: !response.ok ? data : undefined
          });
        } catch (error: any) {
          newResults.push({
            route: '/api/users',
            method: 'GET',
            status: 500,
            success: false,
            message: 'Error fetching users',
            error: error.message
          });
        }
      }
    } finally {
      setResults(newResults);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Migration Test</h1>
      <p className="mb-4">This page tests the API routes that have been migrated from MySQL/MariaDB to Appwrite.</p>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Select API Routes to Test:</h2>
        <div className="flex flex-wrap gap-4">
          {availableTests.map(test => (
            <div key={test.id} className="flex items-center">
              <input
                type="checkbox"
                id={test.id}
                checked={selectedTests.includes(test.id)}
                onChange={() => handleCheckboxChange(test.id)}
                className="mr-2"
              />
              <label htmlFor={test.id}>{test.name}</label>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={runTests}
        disabled={loading || selectedTests.length === 0}
        className={`px-4 py-2 rounded ${
          loading || selectedTests.length === 0 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {loading ? 'Running Tests...' : 'Run Tests'}
      </button>
      
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded ${
                  result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{result.route} ({result.method})</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}>
                    {result.status} {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="mb-2">{result.message}</p>
                {result.data && (
                  <div className="mt-2">
                    <h3 className="font-semibold">Response Data:</h3>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
                {result.error && (
                  <div className="mt-2">
                    <h3 className="font-semibold text-red-600">Error:</h3>
                    <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto max-h-40">
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
