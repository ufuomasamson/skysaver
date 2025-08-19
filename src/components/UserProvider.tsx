'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// Define custom user type with role
type SupabaseUserWithRole = User & {
  role?: string;
}

export default function UserProvider() {
  const [user, setUser] = useState<SupabaseUserWithRole | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Get initial session
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get the user data
          const currentUser = session.user;
          setUser(currentUser);
          
          // Get user role from metadata or user_roles table
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
            
          if (roleData?.role) {
            setUserRole(roleData.role);
          } else if (currentUser.user_metadata?.role) {
            setUserRole(currentUser.user_metadata.role);
          }
      } catch (error) {
        // No active session
        console.log('No active session');
        setUser(null);
        setUserRole(null);
      }
    };
    
    fetchUser();
    
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const currentUser = session.user;
          setUser(currentUser);
          
          // Get user role
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', currentUser.id)
            .single();
            
          if (roleData?.role) {
            setUserRole(roleData.role);
          } else if (currentUser.user_metadata?.role) {
            setUserRole(currentUser.user_metadata.role);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRole(null);
        }
      }
    );
    
    return () => {
      // Clean up Supabase auth subscription
      subscription?.unsubscribe();
    };
  }, []);
  
  return { user, userRole };
}
