"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupabaseSignupDebug() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<'client' | 'server' | 'minimal'>('minimal');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (method === 'client') {
        // Client-side signup with Supabase SDK
        const { supabase } = await import('@/lib/supabaseClient');
        console.log("Client-side signup with SDK");
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw new Error(error.message);
        setResult({
          method: 'Client SDK',
          user: data.user
        });
      }
      else if (method === 'server') {
        // Server-side signup via API
        console.log("Server-side signup via API");
        const response = await fetch('/api/server-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setResult({
          method: 'Server API',
          response: data
        });
      }
      else {
        // Minimal client-side signup
        const { supabase } = await import('@/lib/supabaseClient');
        console.log("Minimal client-side signup (email/pass only)");
        
        // Most minimal signup possible
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) throw new Error(error.message);
        setResult({
          method: 'Minimal',
          user: data.user
        });
      }
    } catch (err) {
      console.error("Signup test error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Supabase Signup Debug</h1>
      
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Signup Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as 'client' | 'server' | 'minimal')}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="minimal">Minimal (email/password only)</option>
            <option value="client">Client SDK (with metadata)</option>
            <option value="server">Server API (more reliable)</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Testing..." : "Try Signup"}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 font-medium">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-green-700 font-medium">Success with {result.method}</p>
          <pre className="mt-2 overflow-x-auto bg-white p-2 border rounded text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <a 
          href="/signup" 
          className="text-blue-600 hover:text-blue-800"
        >
          Back to normal signup
        </a>
      </div>
    </div>
  );
}
