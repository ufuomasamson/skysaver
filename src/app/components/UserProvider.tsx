'use client';

import { useState, useEffect } from 'react';

// Client-side User Provider component
export default function UserProvider() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  useEffect(() => {
    // Client-side cookie reading
    try {
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user='));
        
      if (userCookie) {
        const userValue = userCookie.split('=')[1];
        const userData = JSON.parse(decodeURIComponent(userValue));
        setUser(userData);
        setUserRole(userData.role);
      }
    } catch (err) {
      console.error('Error parsing user cookie:', err);
    }
  }, []);
  
  return { user, userRole };
}
