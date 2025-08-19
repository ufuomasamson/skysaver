import { NextResponse } from "next/server";
import { account } from "@/lib/appwriteClient";

export async function GET() {
  try {
    // Get the current user's account information
    const user = await account.get();
    
    // Format user info
    const userInfo = { 
      id: user.$id, 
      email: user.email, 
      role: user.prefs?.role || "user",
      fullName: user.name 
    };
    
    return NextResponse.json(userInfo);
  } catch (err) {
    // User is not authenticated
    return NextResponse.json(null, { status: 401 });
  }
}
