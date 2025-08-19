import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    let user;
    
    // Handle different payload formats
    if (requestData.session?.user) {
      // Format from Supabase auth response
      user = requestData.session.user;
    } else if (requestData.user) {
      // Direct user object
      user = requestData.user;
    } else {
      return NextResponse.json({ error: "No valid user data provided" }, { status: 400 });
    }
    
    // Get user role from metadata or default to 'user'
    const role = user.user_metadata?.role || user.role || 'user';
    
    // Format user info for cookie
    const userInfo = { 
      id: user.id, 
      email: user.email, 
      role,
      fullName: user.user_metadata?.full_name || user.fullName || user.email?.split('@')[0] || ''
    };

    console.log("Setting user cookie for:", userInfo.email);
    
    // Set cookie for persistent login
    const response = NextResponse.json({ success: true });
    response.cookies.set('user', JSON.stringify(userInfo), {
      httpOnly: false, // Make cookie readable by client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
  } catch (err) {
    console.error("Error setting user cookie:", err);
    return NextResponse.json({ error: "Failed to set user cookie" }, { status: 500 });
  }
}
