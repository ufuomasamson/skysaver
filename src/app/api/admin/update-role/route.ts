import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// API endpoint to update a user's role
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
    
    // Get email and role from request body
    const { email, role } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    if (!role || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: "Valid role is required (admin or user)" }, { status: 400 });
    }
    
    // Get the user's UUID
    const { data: adminData, error: adminError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (adminError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userId = adminData.user.id;
    
    // Update the user's metadata to include the role
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } }
    );
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to update user role",
        details: error.message
      }, { status: 500 });
    }
    
    // Also update the user's cookie if they're currently logged in
    // (They'll need to log in again to get the new role otherwise)
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully updated role for ${email} to ${role}`
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ 
      error: "Failed to update user role",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
