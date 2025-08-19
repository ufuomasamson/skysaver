import { NextResponse } from "next/server";
import { account } from "@/lib/appwriteClient";
import { ID } from "appwrite";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Create new user in Appwrite
    const newUser = await account.create(
      ID.unique(),
      email,
      password,
      fullName
    );
    
    // Set user preferences
    await account.updatePrefs({
      role: 'user'
    });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Registration error:", err);
    
    // Check for duplicate email error
    if (err?.code === 409) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
