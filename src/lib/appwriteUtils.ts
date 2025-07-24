import { Client, Databases, Account, Storage } from 'appwrite';

/**
 * Initialize Appwrite client and services
 * @returns Object containing Appwrite client and services
 */
export function initAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
  
  const databases = new Databases(client);
  const account = new Account(client);
  const storage = new Storage(client);
  
  return { client, databases, account, storage };
}

/**
 * Handles Appwrite errors with descriptive messages
 * @param error The error object from Appwrite
 * @returns A standardized error object
 */
export function handleAppwriteError(error: any) {
  console.error('Appwrite Error:', error);
  
  // Define common Appwrite error types
  const errorMap: Record<string, {message: string, code: number}> = {
    'user_unauthorized': { 
      message: 'Authentication error. Please log in again.', 
      code: 401 
    },
    'user_invalid_credentials': { 
      message: 'Invalid credentials. Please check your email and password.', 
      code: 401 
    },
    'user_already_exists': { 
      message: 'A user with this email already exists.', 
      code: 409 
    },
    'document_not_found': { 
      message: 'Document not found. It may have been deleted.', 
      code: 404 
    },
    'collection_not_found': { 
      message: 'Collection not found. Check your collection IDs.', 
      code: 404 
    },
    'general_rate_limit': { 
      message: 'Too many requests. Please try again later.', 
      code: 429 
    },
    'general_argument_invalid': { 
      message: 'Invalid data provided. Please check your input.', 
      code: 400 
    }
  };

  // Get error type or default to 'unknown'
  const errorType = error.type || 'unknown';
  
  // Return mapped error or default error
  return {
    success: false,
    message: errorMap[errorType]?.message || error.message || 'An unknown error occurred',
    status: errorMap[errorType]?.code || error.code || 500,
    type: errorType,
    original: error
  };
}

/**
 * Verify required Appwrite environment variables are set
 * @returns Object with validation status and any missing variables
 */
export function verifyAppwriteEnvironment() {
  const requiredVariables = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID'
  ];
  
  const collectionVariables = [
    'NEXT_PUBLIC_COLLECTION_FLIGHTS',
    'NEXT_PUBLIC_COLLECTION_AIRLINES',
    'NEXT_PUBLIC_COLLECTION_BOOKINGS',
    'NEXT_PUBLIC_COLLECTION_CRYPTO_WALLETS',
    'NEXT_PUBLIC_COLLECTION_CURRENCIES',
    'NEXT_PUBLIC_COLLECTION_LOCATIONS',
    'NEXT_PUBLIC_COLLECTION_PAYMENT_GATEWAYS',
    'NEXT_PUBLIC_COLLECTION_PAYMENTS',
    'NEXT_PUBLIC_COLLECTION_USER_PREFERENCES',
    'NEXT_PUBLIC_COLLECTION_USERS'
  ];
  
  const missingRequired = requiredVariables.filter(
    variable => !process.env[variable]
  );
  
  const missingCollections = collectionVariables.filter(
    variable => !process.env[variable]
  );
  
  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingCollections,
    hasAllCollections: missingCollections.length === 0
  };
}
