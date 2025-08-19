"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminRoleDebug() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [cookie, setCookie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function checkUser() {
      setLoading(true);
      
      try {
        // 1. Get the current session from Supabase
        const { data: { session: supaSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setLoading(false);
          return;
        }
        
        if (!supaSession) {
          console.log("No active session");
          setLoading(false);
          return;
        }
        
        setSession({
          id: supaSession.user.id,
          email: supaSession.user.email,
          metadata: supaSession.user.user_metadata,
          role: supaSession.user.user_metadata?.role || 'user'
        });
        
        // 2. Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("User error:", userError);
        } else if (userData?.user) {
          setUser({
            id: userData.user.id,
            email: userData.user.email,
            metadata: userData.user.user_metadata,
            role: userData.user.user_metadata?.role || 'user'
          });
        }
        
        // 3. Check the cookie
        const cookies = document.cookie.split(';');
        let userCookie = null;
        
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'user') {
            try {
              userCookie = JSON.parse(decodeURIComponent(value));
              setCookie(userCookie);
            } catch (e) {
              console.error("Failed to parse user cookie:", e);
            }
            break;
          }
        }
        
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkUser();
  }, [refreshKey]);
  
  const refreshUserCookie = async () => {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("No active session to refresh");
        return;
      }
      
      // Set user cookie
      const response = await fetch('/api/set-user-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to refresh cookie: ${response.status}`);
      }
      
      alert("Cookie refreshed successfully!");
      // Force a refresh of the component
      setRefreshKey(prev => prev + 1);
      
    } catch (error) {
      alert(`Error refreshing cookie: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Admin Role Debug Tool</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {!user && !session ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">You are not logged in</p>
                <p className="mt-2">
                  <a href="/login" className="text-blue-600 hover:text-blue-800 underline">Log in</a> to see your user details.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Supabase Session Data */}
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-2">Supabase Session</h2>
                    {session ? (
                      <div className="bg-gray-50 p-4 rounded overflow-auto border border-gray-300">
                        <pre className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                          {JSON.stringify(session, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-700 font-medium">No active session</p>
                    )}
                  </div>
                  
                  {/* Supabase User Data */}
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-2">Supabase User</h2>
                    {user ? (
                      <div className="bg-gray-50 p-4 rounded overflow-auto border border-gray-300">
                        <pre className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                          {JSON.stringify(user, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-700 font-medium">No user data available</p>
                    )}
                  </div>
                </div>
                
                {/* Cookie Data */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-lg font-semibold mb-2">User Cookie</h2>
                  {cookie ? (
                    <div className="bg-gray-50 p-4 rounded overflow-auto border border-gray-300">
                        <pre className="text-sm font-medium text-gray-900 whitespace-pre-wrap">
                          {JSON.stringify(cookie, null, 2)}
                        </pre>
                    </div>
                  ) : (
                    <p className="text-gray-700 font-medium">No user cookie found</p>
                  )}
                </div>
                
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-6 shadow-sm">
                  <h3 className="font-bold text-blue-900 text-lg">Role Analysis</h3>
                  <ul className="mt-3 space-y-3 list-disc list-inside text-gray-900">
                    <li className="font-medium">
                      <span className="font-bold">Supabase session role:</span>{' '}
                      <span className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
                        {session?.role || 'Not set'}
                      </span>
                    </li>
                    <li className="font-medium">
                      <span className="font-bold">Supabase user role:</span>{' '}
                      <span className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
                        {user?.role || 'Not set'}
                      </span>
                    </li>
                    <li className="font-medium">
                      <span className="font-bold">Cookie role:</span>{' '}
                      <span className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
                        {cookie?.role || 'Not set'}
                      </span>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    {cookie?.role !== 'admin' && (session?.role === 'admin' || user?.role === 'admin') && (
                      <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 shadow-sm">
                        <p className="text-red-900 font-bold text-base">
                          ⚠️ Your cookie doesn't have the admin role but your Supabase account does.
                          Try refreshing your cookie using the button below.
                        </p>
                      </div>
                    )}
                    
                    {cookie?.role === 'admin' && (
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                        <p className="text-green-900 font-bold text-base">
                          ✅ Your cookie has the admin role. You should see admin options.
                          If you don't see the Admin Dashboard option in the navigation bar, try refreshing the page.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={refreshUserCookie}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 hover:shadow-md transition-all"
              >
                🔄 Refresh User Cookie
              </button>
              
              <button 
                onClick={reloadPage}
                className="px-6 py-3 bg-gray-700 text-white font-bold rounded-md shadow-sm hover:bg-gray-800 hover:shadow-md transition-all"
              >
                🔄 Reload Page
              </button>
              
              <a 
                href="/logout-test"
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded-md shadow-sm hover:bg-purple-700 hover:shadow-md transition-all text-center"
              >
                🧪 Logout Test Tool
              </a>
              
              <a 
                href="/"
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-md shadow-sm hover:bg-green-700 hover:shadow-md transition-all text-center"
              >
                🏠 Back to Home
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
