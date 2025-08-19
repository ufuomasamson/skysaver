"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AdminRoleSetter() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if the current user is an admin
  const checkAdminStatus = async () => {
    setLoading(true);
    setStatus('Checking admin status...');
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setStatus('Error: You must be logged in to use this tool.');
        setLoading(false);
        return false;
      }
      
      // Get user role from metadata
      const user = session.user;
      const userRole = user.user_metadata?.role;
      
      setCurrentUser({
        email: user.email,
        role: userRole || 'user',
        id: user.id
      });
      
      if (userRole !== 'admin') {
        setStatus('Error: You must be an admin to use this tool.');
        setLoading(false);
        return false;
      }
      
      setStatus('Admin status confirmed. You can update user roles.');
      setLoading(false);
      return true;
    } catch (error) {
      setStatus(`Error checking admin status: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
      return false;
    }
  };

  // Look up a user by email
  const lookupUser = async () => {
    if (!email) {
      setStatus('Please enter an email address.');
      return;
    }
    
    setLoading(true);
    setStatus(`Looking up user: ${email}...`);
    
    try {
      // Admin function to look up a user by email
      const response = await fetch('/api/admin/lookup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setStatus(`Error looking up user: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      if (!data.user) {
        setStatus(`No user found with email: ${email}`);
        setLoading(false);
        return;
      }
      
      setStatus(`User found: ${data.user.email}\nCurrent role: ${data.user.role || 'user'}`);
      setShowConfirm(true);
    } catch (error) {
      setStatus(`Error looking up user: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Update user role
  const updateUserRole = async () => {
    setLoading(true);
    setStatus(`Updating role for ${email} to ${role}...`);
    
    try {
      // Admin function to update a user's role
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setStatus(`Error updating role: ${data.error || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      setStatus(`Successfully updated role for ${email} to ${role}`);
      setShowConfirm(false);
    } catch (error) {
      setStatus(`Error updating role: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Check admin status when component mounts
  useState(() => {
    checkAdminStatus();
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">User Role Management</h1>
        
        {currentUser && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="font-medium">Logged in as: {currentUser.email}</p>
            <p className="text-sm">Role: {currentUser.role}</p>
            {currentUser.role !== 'admin' && (
              <p className="text-sm mt-2 text-red-600">
                Note: You need admin permissions to use this tool.
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          
          {!showConfirm ? (
            <button
              onClick={lookupUser}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Look Up User'}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                  className="w-1/2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserRole}
                  disabled={loading}
                  className="w-1/2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Update Role
                </button>
              </div>
            </div>
          )}
          
          {status && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Status:</h2>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm whitespace-pre-wrap">
                {status}
              </pre>
            </div>
          )}
          
          <div className="mt-6">
            <a 
              href="/admin/dashboard" 
              className="block text-center w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              Back to Admin Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metadata cannot be exported from client components
// export const metadata = {
//   title: 'User Role Management',
// };
