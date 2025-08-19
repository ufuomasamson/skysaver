import { Client, Databases, Storage, ID } from 'appwrite';

// This file is exclusively for server-side API routes
// It uses environment variables without the NEXT_PUBLIC_ prefix

// Initialize Appwrite client for server-side usage
export const initServerClient = () => {
  // Create a new client instance specifically for server-side usage
  const client = new Client();
  
  // We'll use server-specific endpoint and project ID
  const endpoint = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687c16800035a59a1f8e';
  
  // Set up the client for server-side API operations
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
  
  // CRITICAL FIX: Add server-specific configuration
  // The issue may be in how we're configuring the client for server-side use
  
  // For Node.js server-side environment
  // @ts-ignore - Adding Node.js specific configuration
  client.selfSigned = false; // Don't use self-signed certificates
  
  // Log the current configuration for debugging
  console.log(`Configuring Appwrite client: endpoint=${endpoint}, projectId=${projectId.substring(0, 8)}...`);
  
  // Use API key if available (recommended for server-side operations)
  if (process.env.APPWRITE_API_KEY) {
    try {
      // Different approaches based on SDK version:
      
      // Approach 1: Try direct assignment to headers
      // @ts-ignore - Access headers property
      if (typeof client.headers !== 'undefined') {
        // @ts-ignore - Set API key directly in headers
        client.headers = {
          ...client.headers,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
          'X-Appwrite-Project': projectId,
          'Content-Type': 'application/json',
          'User-Agent': 'NodeAppwriteServer/1.0'
        };
        console.log('Appwrite API key configured via direct headers assignment');
      }
      // Approach 2: Try using the setKey method (for newer SDK versions)
      else if (typeof client.setKey === 'function') {
        // @ts-ignore - Try setKey if available
        client.setKey(process.env.APPWRITE_API_KEY);
        console.log('Appwrite API key configured via setKey method');
      }
      else {
        console.warn('Could not configure API key - no supported method available');
      }
    } catch (error) {
      console.error('Failed to set API key:', error);
    }
  } else {
    console.warn('No Appwrite API key found - server-side operations may fail with region access errors');
  }
  
  const databases = new Databases(client);
  const storage = new Storage(client);
  
  return { client, databases, storage };
};

// Database and collection constants - using server-specific variables when available
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';

// Collection IDs
export const COLLECTIONS = {
  FLIGHTS: process.env.NEXT_PUBLIC_COLLECTION_FLIGHTS!,
  AIRLINES: process.env.NEXT_PUBLIC_COLLECTION_AIRLINES!,
  BOOKINGS: process.env.NEXT_PUBLIC_COLLECTION_BOOKINGS!,
  CRYPTO_WALLETS: process.env.NEXT_PUBLIC_COLLECTION_CRYPTO_WALLETS!,
  CURRENCIES: process.env.NEXT_PUBLIC_COLLECTION_CURRENCIES!,
  LOCATIONS: process.env.NEXT_PUBLIC_COLLECTION_LOCATIONS!,
  PAYMENT_GATEWAYS: process.env.NEXT_PUBLIC_COLLECTION_PAYMENT_GATEWAYS!,
  PAYMENTS: process.env.NEXT_PUBLIC_COLLECTION_PAYMENTS!,
  USER_PREFERENCES: process.env.NEXT_PUBLIC_COLLECTION_USER_PREFERENCES!,
  USERS: process.env.NEXT_PUBLIC_COLLECTION_USERS!
};

// Storage bucket ID
export const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

// Helper function to generate a unique ID
export const uniqueId = () => ID.unique();

// Error handling helper
export const handleAppwriteError = (error: any) => {
  console.error('Appwrite Error:', error);
  
  const errorMessage = error.message || 'Unknown error occurred';
  const errorCode = error.code || 500;
  
  return {
    message: errorMessage,
    code: errorCode,
    original: error
  };
};
