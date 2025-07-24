import { NextResponse } from "next/server";
import { account } from "@/lib/appwriteClient";

// This middleware checks if the user is an admin
export async function GET() {
  try {
    // Get the current user
    const user = await account.get();
    
    // Check admin role in user preferences
    if (user.prefs?.role !== 'admin') {
      throw new Error('Not authorized');
    }
    
    return NextResponse.json({ role: 'admin' });
  } catch (err) {
    return NextResponse.json(
      { error: 'Not authorized to access admin resources' },
      { status: 403 }
    );
  }
}
