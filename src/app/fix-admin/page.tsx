"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function FixAdminRole() {
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('samsonenzo1111@gmail.com');
  const [loading, setLoading] = useState(false);

  const fixRole = async () => {
    if (!email) {
      setStatus('Please enter an email address');
      return;
    }

    setLoading(true);
    setStatus('Setting admin role for ' + email + '...');

    try {
      // 1. Sign out first to ensure we're starting fresh
      await supabase.auth.signOut();
      
      // 2. Sign in as the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: prompt('Enter your password:') || '' // Simple password prompt
      });
      
      if (signInError) {
        throw new Error('Authentication failed: ' + signInError.message);
      }
      
      if (!signInData.user) {
        throw new Error('No user returned after sign in');
      }
      
      setStatus('Signed in successfully. User ID: ' + signInData.user.id);
      
      // 3. Update user metadata directly (client-side)
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      });
      
      if (updateError) {
        throw new Error('Failed to update user metadata: ' + updateError.message);
      }
      
      setStatus(prev => prev + '\nMetadata updated successfully');
      
      // 4. Set the user cookie with admin role
      const cookieResponse = await fetch('/api/set-user-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session: signInData
        }),
      });
      
      if (!cookieResponse.ok) {
        throw new Error('Failed to set user cookie: ' + await cookieResponse.text());
      }
      
      setStatus(prev => prev + '\nUser cookie updated successfully');
      
      // 5. Final verification
      const { data: currentUser } = await supabase.auth.getUser();
      setStatus(prev => prev + '\n\nFinal user data: ' + JSON.stringify({
        id: currentUser?.user?.id,
        email: currentUser?.user?.email,
        role: currentUser?.user?.user_metadata?.role || 'unknown'
      }, null, 2));
      
      // Success message
      setStatus(prev => prev + '\n\n✅ Admin role set successfully! Please refresh the page or go to home page to see changes.');
      
    } catch (error) {
      setStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Fix Admin Role</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={fixRole}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Set Admin Role'}
          </button>
          
          {status && (
            <div className="mt-4">
              <h2 className="font-semibold mb-2">Status:</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs whitespace-pre-wrap">
                {status}
              </pre>
            </div>
          )}
          
          <div className="mt-6 space-y-2">
            <a
              href="/debug-role"
              className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-center"
            >
              Check Role Status
            </a>
            
            <a
              href="/"
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-center"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
