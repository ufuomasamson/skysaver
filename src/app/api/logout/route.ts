import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST() {
  try {
    console.log("Logging out user...");
    
    // Sign out from Supabase with a more comprehensive approach
    // This clears all sessions, not just the current one
    const { error } = await supabase.auth.signOut({
      scope: 'global' // Sign out from all devices/sessions
    });
    
    if (error) {
      console.error("Supabase signout error:", error);
    } else {
      console.log("Supabase signout successful");
    }
    
    // Clear the user cookie
    const response = NextResponse.json({ success: true, message: "Successfully logged out" });
    
    // Remove the user cookie completely
    response.cookies.set('user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set expiration in the past
    });
    
    // Also clear any other auth-related cookies that might exist
    response.cookies.set('sb-auth-token', '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
    
    console.log("User cookies cleared");
    return response;
  } catch (err) {
    console.error("Logout error:", err);
    // Even if Supabase signout fails, still clear the local cookie
    const response = NextResponse.json({ 
      success: true, 
      message: "Logged out but encountered an error",
      error: err instanceof Error ? err.message : String(err)
    });
    
    // Ensure cookie is removed
    response.cookies.set('user', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0)
    });
    
    return response;
  }
}
