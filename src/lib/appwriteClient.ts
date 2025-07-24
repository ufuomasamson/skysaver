import { Client, Databases, Account, Storage, ID, Teams } from "appwrite";

// Initialize the Appwrite client
const client = new Client();

// Check if we're running on the client side before using window
const isClient = typeof window !== 'undefined';

// Set up the client with your Appwrite credentials
if (isClient) {
  client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687c16800035a59a1f8e');
}

// Initialize Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

// Database and collection constants
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';

// Collection IDs - using environment variables
export const COLLECTIONS = {
  FLIGHTS: process.env.NEXT_PUBLIC_COLLECTION_FLIGHTS || '',
  LOCATIONS: process.env.NEXT_PUBLIC_COLLECTION_LOCATIONS || '',
  AIRLINES: process.env.NEXT_PUBLIC_COLLECTION_AIRLINES || '',
  PROFILES: process.env.NEXT_PUBLIC_COLLECTION_USERS || '', // Using users collection for profiles
  BOOKINGS: process.env.NEXT_PUBLIC_COLLECTION_BOOKINGS || '',
  CURRENCIES: process.env.NEXT_PUBLIC_COLLECTION_CURRENCIES || '',
  PAYMENT_GATEWAYS: process.env.NEXT_PUBLIC_COLLECTION_PAYMENT_GATEWAYS || '',
  USER_PREFERENCES: process.env.NEXT_PUBLIC_COLLECTION_USER_PREFERENCES || '',
  CRYPTO_WALLETS: process.env.NEXT_PUBLIC_COLLECTION_CRYPTO_WALLETS || '',
  PAYMENTS: process.env.NEXT_PUBLIC_COLLECTION_PAYMENTS || ''
};

// Storage bucket IDs - using the bucket ID from environment variable
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || '';

export const BUCKETS = {
  AIRLINE_LOGOS: BUCKET_ID,
  TICKETS: BUCKET_ID,
  QR_CODES: BUCKET_ID
};

// Helper function to generate a unique ID
export const uniqueId = () => ID.unique();

// Helper function to check if user is an admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const user = await account.get();
    return user.prefs?.role === 'admin';
  } catch (error) {
    return false;
  }
};
