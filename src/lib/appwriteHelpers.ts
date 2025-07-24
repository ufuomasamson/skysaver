import { AppwriteException } from 'appwrite';

/**
 * Helper function to handle Appwrite errors
 * @param error The error object thrown by Appwrite
 * @returns A formatted error message
 */
export function handleAppwriteError(error: unknown): string {
  if (error instanceof AppwriteException) {
    return `[${error.code}] ${error.message}`;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return 'An unknown error occurred';
  }
}

/**
 * Check if all required environment variables are set
 * @returns An object with status and any missing variables
 */
export function checkAppwriteEnvVariables(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'NEXT_PUBLIC_APPWRITE_ENDPOINT',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_DATABASE_ID',
    'NEXT_PUBLIC_APPWRITE_BUCKET_ID',
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

  const missing = requiredVars.filter(
    varName => !process.env[varName as keyof NodeJS.ProcessEnv]
  );

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Format Appwrite document timestamps into readable format
 * @param timestamp Appwrite document timestamp
 * @returns Formatted date string
 */
export function formatAppwriteTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}
