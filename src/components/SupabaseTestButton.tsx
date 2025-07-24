"use client";

import { useState } from "react";

export default function SupabaseTestButton() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const testSupabase = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Simple test: just check if we can get the session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setResult({
        message: "Supabase connection successful!",
        sessionData: data
      });
    } catch (err) {
      console.error("Supabase test error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-lg font-medium">Test Supabase Connection</h2>
      
      <button
        onClick={testSupabase}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
      >
        {loading ? "Testing..." : "Test Connection"}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="font-medium text-green-700">{result.message}</p>
          <pre className="mt-2 text-xs overflow-auto bg-white p-2 border rounded max-h-40">
            {JSON.stringify(result.sessionData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
