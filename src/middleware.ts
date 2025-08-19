import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define admin paths that should be protected
const ADMIN_PATHS = [
  '/admin',
  '/admin/dashboard',
  '/admin/flights',
  '/admin/airlines',
  '/admin/locations',
  '/admin/users',
];

// This function can be used as middleware to protect admin routes
export function middleware(request: NextRequest) {
  // Extract the user cookie (contains role information)
  const userCookie = request.cookies.get('user')?.value;
  
  // Check if the path is an admin path
  const isAdminPath = ADMIN_PATHS.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );
  
  // If it's not an admin path, continue as normal
  if (!isAdminPath) {
    return NextResponse.next();
  }
  
  try {
    // Try to parse the user cookie
    const user = userCookie ? JSON.parse(userCookie) : null;
    
    // If there's no user or the user is not an admin, redirect to login
    if (!user || user.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // User is an admin, allow access
    return NextResponse.next();
  } catch (error) {
    // If there's an error parsing the cookie, redirect to login
    console.error('Error parsing user cookie:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure the middleware to run on specific paths
export const config = {
  // All admin paths and their subpaths
  matcher: ['/admin/:path*'],
};
