"use client";
import { useState, useEffect } from "react";

export default function CheckAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [roleData, setRoleData] = useState(null);

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        // 1. Check the user cookie
        const userCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("user="));
        
        if (userCookie) {
          const userValue = userCookie.split("=")[1];
          try {
            const parsedUser = JSON.parse(decodeURIComponent(userValue));
            setUser(parsedUser);
          } catch (e) {
            console.error("Error parsing user cookie:", e);
          }
        }

        // 2. Check Supabase session
        const { supabase } = await import('@/lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // 3. Check user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          setRoleData(roleData);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-6">Loading admin status...</h1>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Status Check</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">User Cookie</h2>
        {user ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> <span className={user.role === 'admin' ? 'text-green-600 font-bold' : 'text-red-600'}>{user.role}</span></p>
            <p><strong>Full User Data:</strong></p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto mt-2">{JSON.stringify(user, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-red-600">No user cookie found. Please log in first.</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Supabase Session</h2>
        {supabaseUser ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Email:</strong> {supabaseUser.email}</p>
            <p><strong>Role from Metadata:</strong> <span className={supabaseUser.user_metadata?.role === 'admin' ? 'text-green-600 font-bold' : 'text-red-600'}>{supabaseUser.user_metadata?.role || 'not set'}</span></p>
            <p><strong>User Metadata:</strong></p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto mt-2">{JSON.stringify(supabaseUser.user_metadata, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-red-600">No active Supabase session. Please log in first.</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">User Roles Table</h2>
        {roleData ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <p><strong>Role:</strong> <span className={roleData.role === 'admin' ? 'text-green-600 font-bold' : 'text-red-600'}>{roleData.role}</span></p>
            <pre className="bg-gray-100 p-2 rounded overflow-x-auto mt-2">{JSON.stringify(roleData, null, 2)}</pre>
          </div>
        ) : (
          <p className="text-amber-600">No role found in user_roles table.</p>
        )}
      </div>
      
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold mb-4">How Admin Access Works</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>Your middleware checks for <code className="bg-gray-100 px-2 py-1 rounded">user.role === 'admin'</code> in the user cookie</li>
          <li>The role is set during login based on Supabase user metadata</li>
          <li>The isAdmin() function in supabaseClient.ts checks both the user_roles table and user metadata</li>
        </ul>
      </div>
      
      <div className="mt-8 flex justify-center">
        <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">Go to Login</a>
      </div>
    </div>
  );
}
