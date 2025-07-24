import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log(`Login attempt for: ${email}`);

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Supabase login error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Login successful:", data.user.email);
    
    // Get user role from metadata
    const role = data.user.user_metadata?.role || 'user';
    
    // Format user info for response
    const userInfo = { 
      id: data.user.id, 
      email: data.user.email, 
      role,
      fullName: data.user.user_metadata?.full_name || data.user.email
    };

    // Set cookie for persistent login
    const response = NextResponse.json(userInfo);
    response.cookies.set('user', JSON.stringify(userInfo), {
      httpOnly: false, // Make cookie readable by client-side JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
  } catch (err) {
    console.error("Unexpected login error:", err);
    return NextResponse.json({ error: "An unexpected error occurred during login." }, { status: 500 });
  }
}
