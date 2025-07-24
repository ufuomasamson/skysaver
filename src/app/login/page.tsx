"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // Import Supabase client
      const { supabase } = await import('@/lib/supabaseClient');
      console.log("Signing in with Supabase directly from client");
      
      // Sign in directly with Supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        setError(error.message || "Login failed");
        setLoading(false);
        return;
      }
      
      console.log("Login successful:", data);
      
      // Get user metadata (including role)
      const userData = data.user.user_metadata;
      const role = userData?.role || 'user';
      
      // Set user cookie for server components
      try {
        const cookieResponse = await fetch('/api/set-user-cookie', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session: data }),
        });
        
        if (!cookieResponse.ok) {
          console.error('Failed to set user cookie');
        } else {
          console.log('User cookie set successfully');
        }
      } catch (cookieError) {
        console.error('Error setting user cookie:', cookieError);
      }
      
      setSuccess(`Welcome back! Redirecting...`);
      setTimeout(() => {
        // Force reload so server components re-read cookies
        if (role === "admin") {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/search";
        }
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#18176b] mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-[#cd7e0f] text-white py-3 rounded-lg font-semibold hover:bg-[#cd7e0f]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a href="/signup" className="text-[#cd7e0f] hover:text-[#cd7e0f]/90 font-semibold">
                Sign up here
              </a>
            </p>
          </div>
          
          {/* Debug tools */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs text-gray-500">Troubleshooting</p>
            <div className="mt-1">
              <a 
                href="/debug" 
                className="text-xs text-blue-600 hover:text-blue-800"
                target="_blank"
              >
                Open Supabase Debug Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}