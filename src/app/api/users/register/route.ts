import { NextRequest, NextResponse } from 'next/server';
import { AppwriteServerAPI, DATABASE_ID, COLLECTIONS } from '@/lib/appwriteDirectAPI';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, name, password, preferences = {} } = body;
    
    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email, name, and password are required'
      }, { status: 400 });
    }
    
    // Create user document using direct API
    const userData = {
      email,
      name,
      created_at: new Date().toISOString(),
      role: 'user',
      status: 'active'
      // Note: We don't store the password in the database
      // In a real app, use Appwrite's account API for proper auth
      // This is just a demo of the direct API approach
    };
    
    const userResult = await AppwriteServerAPI.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      userData
    );
    
    // If user creation was successful, create user preferences
    if (userResult.success && userResult.data?.$id) {
      const userId = userResult.data.$id;
      
      // Create user preferences
      const preferencesData = {
        user_id: userId,
        currency: preferences.currency || 'USD',
        language: preferences.language || 'en',
        notifications: preferences.notifications || true,
        theme: preferences.theme || 'light',
        created_at: new Date().toISOString()
      };
      
      const preferencesResult = await AppwriteServerAPI.createDocument(
        DATABASE_ID,
        COLLECTIONS.USER_PREFERENCES,
        preferencesData
      );
      
      // Return success response with user ID and preferences
      return NextResponse.json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          name
        },
        preferences: preferencesResult.success ? preferencesResult.data : null
      });
    } else {
      // Something went wrong creating the user
      return NextResponse.json({
        success: false,
        message: 'Failed to register user',
        error: userResult.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error registering user',
      error: error.message
    }, { status: 500 });
  }
}
