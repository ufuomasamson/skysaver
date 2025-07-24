"use client";

import { useState, useEffect } from "react";

export default function SupabaseDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { supabase } = await import('@/lib/supabaseClient');
        
        // Test connection with a simple query
        const { data, error } = await supabase.auth.getSession();
        
        setDebugInfo({
          supabaseInitialized: !!supabase,
          session: data?.session ? {
            user: data.session.user.email,
            expires: new Date(data.session.expires_at! * 1000).toLocaleString()
          } : null,
          error: error ? {
            message: error.message,
            details: JSON.stringify(error)
          } : null,
          environment: {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Available" : "Missing",
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Available" : "Missing",
          }
        });
      } catch (err) {
        console.error("Debug error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    checkSupabase();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Debug Information</h1>
      
      {loading && <p>Loading debug information...</p>}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}
      
      {debugInfo && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Supabase Connection
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Client Initialized</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {debugInfo.supabaseInitialized ? "✅ Yes" : "❌ No"}
                </dd>
              </div>
              
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Environment Variables</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul>
                    <li>NEXT_PUBLIC_SUPABASE_URL: {debugInfo.environment.supabaseUrl}</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {debugInfo.environment.supabaseAnonKey}</li>
                  </ul>
                </dd>
              </div>
              
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Current Session</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {debugInfo.session ? (
                    <div>
                      <p>User: {debugInfo.session.user}</p>
                      <p>Expires: {debugInfo.session.expires}</p>
                    </div>
                  ) : (
                    "No active session"
                  )}
                </dd>
              </div>
              
              {debugInfo.error && (
                <div className="bg-red-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Error</dt>
                  <dd className="mt-1 text-sm text-red-700 sm:mt-0 sm:col-span-2">
                    <p>{debugInfo.error.message}</p>
                    <pre className="mt-2 overflow-x-auto text-xs">
                      {debugInfo.error.details}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Debug Info
        </button>
      </div>
    </div>
  );
}
