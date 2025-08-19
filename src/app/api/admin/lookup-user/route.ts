import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// API endpoint to look up a user by email
export async function POST(request: Request) {
  try {
    // First check if the requesting user is an admin
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const currentUser = session.user;
    const isAdmin = currentUser.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    // Get email from request body
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Look up user in Supabase
    const { data: adminData, error: adminError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (adminError) {
      // Try the user's own endpoint as fallback
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
      }
      
      // Find the user in the list
      const user = userData.users.find(u => u.email === email);
      
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      return NextResponse.json({ 
        user: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'user',
          createdAt: user.created_at
        } 
      });
    }
    
    return NextResponse.json({ 
      user: {
        id: adminData.user.id,
        email: adminData.user.email,
        role: adminData.user.user_metadata?.role || 'user',
        createdAt: adminData.user.created_at
      } 
    });
  } catch (error) {
    console.error("Error looking up user:", error);
    return NextResponse.json({ 
      error: "Failed to look up user",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
