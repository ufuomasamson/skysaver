import { NextResponse } from "next/server";
import { account } from "@/lib/appwriteClient";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // Log in user with Appwrite
    const session = await account.createSession(email, password);
    
    // Get user account details
    const user = await account.get();
    
    // Format user info
    const userInfo = { 
      id: user.$id, 
      email: user.email, 
      role: user.prefs?.role || "user",
      fullName: user.name 
    };

    // Set cookie for persistent login (using the same format as before)
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
    console.error("/api/login error:", err);
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
}
