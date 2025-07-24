'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitializeStoragePage() {
  const [initializing, setInitializing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInitializeStorage = async () => {
    setInitializing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/storage/initialize');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize storage');
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Error initializing storage:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Initialize Supabase Storage</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600 mb-6">
          This utility will set up the necessary storage buckets and folders for the application. 
          Use this only during initial setup or when you need to reset storage configurations.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleInitializeStorage}
            disabled={initializing}
            className={`px-4 py-2 rounded-md ${
              initializing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            {initializing ? 'Initializing...' : 'Initialize Storage'}
          </button>
          
          <button
            onClick={() => router.push('/storage-demo')}
            className="ml-4 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Go to Storage Demo
          </button>
        </div>
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-medium text-red-700 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-medium text-green-700 mb-2">
              Storage Initialized Successfully!
            </h3>
            
            <div className="mt-4">
              <h4 className="font-medium text-green-600">Details:</h4>
              <ul className="mt-2 list-disc list-inside text-green-600">
                <li>Bucket: {result.bucketName}</li>
                <li>
                  Folders Created:
                  <ul className="ml-6 list-circle list-inside">
                    {result.folders?.map((folder: string) => (
                      <li key={folder}>{folder}</li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
