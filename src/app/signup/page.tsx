"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// TODO: Replace Supabase logic with MySQL-based registration using API route

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      // Import Supabase client
      const { supabase } = await import('@/lib/supabaseClient');
      console.log("Signing up with Supabase directly from client");
      
      // Try a simpler signup approach without metadata
      // This avoids potential database schema issues
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      // We'll update the user metadata separately if signup succeeds
      console.log("Using simplified signup without metadata");
      
      if (error) {
        console.error("Supabase signup error:", error);
        setError(error.message || "Registration failed");
        setLoading(false);
        return;
      }
      
      console.log("Signup successful:", data);
      
      // If signup was successful and we have a user ID, try to update metadata
      if (data.user?.id) {
        try {
          // Call our API to update user metadata
          const metadataResponse = await fetch("/api/update-user-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              userId: data.user.id,
              fullName: fullName 
            }),
          });
          
          console.log("Metadata update response:", await metadataResponse.json());
          
          // Set user cookie for server components
          try {
            const cookieResponse = await fetch('/api/set-user-cookie', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                session: {
                  user: {
                    ...data.user,
                    user_metadata: { full_name: fullName, role: 'user' }
                  }
                } 
              }),
            });
            
            if (!cookieResponse.ok) {
              console.error('Failed to set user cookie');
            } else {
              console.log('User cookie set successfully');
            }
          } catch (cookieError) {
            console.error('Error setting user cookie:', cookieError);
          }
        } catch (metadataError) {
          // Log but don't fail if metadata update fails
          console.warn("Couldn't update user metadata, but signup succeeded:", metadataError);
        }
      }
      
      setSuccess("Account created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/search";
      }, 2000);
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
            <h1 className="text-3xl font-bold text-[#18176b] mb-2">Create Account</h1>
            <p className="text-gray-600">Join us and start booking your flights</p>
          </div>
          
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                required
              />
            </div>
            
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
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#cd7e0f] focus:border-[#cd7e0f] transition text-gray-900"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-[#cd7e0f] hover:text-[#cd7e0f]/90 font-semibold">
                Sign in here
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
              <br />
              <a 
                href="/api/fix-database" 
                className="text-xs text-blue-600 hover:text-blue-800"
                target="_blank"
              >
                Fix Database Schema
              </a>
              <br />
              <a 
                href="/direct-signup" 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Try Alternative Signup Method
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 