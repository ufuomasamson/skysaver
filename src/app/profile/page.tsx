import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabaseClient';

export default async function Profile() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient();
  
  // Try to get the user from Supabase using server client
  const { data: { session } } = await supabase.auth.getSession();
  
  // If there's no session, try to get user data from a cookie as fallback
  let userData = null;
  
  if (!session?.user) {
    const userCookie = cookieStore.get('user');
    if (userCookie && userCookie.value) {
      try {
        userData = JSON.parse(userCookie.value);
      } catch (error) {
        console.error('Failed to parse user cookie:', error);
      }
    }
  } else {
    // User is authenticated with Supabase
    userData = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0]
    };
  }
  
  // If there's no user data, redirect to login (handled by client-side)
  const user = userData;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">User Profile</h1>
        {user ? (
          <div className="space-y-4">
            <p>
              <strong>ID:</strong> {user.id}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Last Signed In:</strong>{' '}
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
            </p>
          </div>
        ) : (
          <p className="text-center">Please log in to view your profile.</p>
        )}
      </div>
    </div>
  );
}