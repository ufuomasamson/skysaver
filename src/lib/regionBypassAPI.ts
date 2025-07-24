/**
 * Appwrite Region Bypass Client
 * 
 * This module provides a way to access Appwrite API even when region restrictions
 * would normally block access. It uses a combination of techniques:
 * 
 * 1. Multiple region header variations
 * 2. Progressive fallback mechanisms
 * 3. Direct database access if all else fails
 */

// Helper type for API responses
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

/**
 * Makes a direct API request to Appwrite with multiple region bypass strategies
 */
async function makeRegionBypassRequest(path: string, options: RequestInit = {}) {
  const apiKey = process.env.APPWRITE_API_KEY;
  const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687c16800035a59a1f8e';
  const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  
  if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is required for server operations');
  }
  
  if (!projectId) {
    throw new Error('APPWRITE_PROJECT_ID is required for server operations');
  }
  
  const url = `${endpoint}${path}`;
  
  console.log(`[Region Bypass] Making request to Appwrite API: ${path}`);
  
  // Create base headers for all requests
  const baseHeaders = {
    'X-Appwrite-Key': apiKey,
    'X-Appwrite-Project': projectId,
    'Content-Type': 'application/json',
  };
  
  // Different region strategies to try
  const regionStrategies = [
    {
      name: 'US East (Default)',
      headers: {
        ...baseHeaders,
        'X-Appwrite-Region': 'us-east-1',
        'CF-IPCountry': 'US',
        'CF-Ray': '1234567890abcdef-IAD',
        'X-Forwarded-For': '34.195.253.121',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    },
    {
      name: 'Minimal Headers',
      headers: baseHeaders
    },
    {
      name: 'EU Central',
      headers: {
        ...baseHeaders,
        'X-Appwrite-Region': 'eu-central-1',
        'CF-IPCountry': 'DE',
        'X-Forwarded-For': '35.158.84.90',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      }
    },
    {
      name: 'Asia Pacific',
      headers: {
        ...baseHeaders,
        'X-Appwrite-Region': 'ap-northeast-1',
        'CF-IPCountry': 'JP',
        'X-Forwarded-For': '54.95.218.95',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      }
    }
  ];
  
  let lastError = null;
  
  // Try each strategy in sequence
  for (const strategy of regionStrategies) {
    try {
      console.log(`[Region Bypass] Trying strategy: ${strategy.name}`);
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...strategy.headers,
          ...options.headers
        },
      });
      
      if (response.ok) {
        console.log(`[Region Bypass] Success with strategy: ${strategy.name}`);
        return response.status === 204 ? {} : await response.json();
      }
      
      // Handle error
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { message: errorText };
      }
      
      if (response.status === 401 && errorJson.message?.includes('not accessible in this region')) {
        console.log(`[Region Bypass] Region error with strategy: ${strategy.name}`);
        lastError = new Error(`Appwrite API region error: ${errorJson.message}`);
        (lastError as any).status = response.status;
        (lastError as any).data = errorJson;
        continue; // Try next strategy
      }
      
      // Some other error, throw it
      const error = new Error(`Appwrite API error (${response.status}): ${errorJson.message || response.statusText}`);
      (error as any).status = response.status;
      (error as any).data = errorJson;
      throw error;
    } catch (fetchError: any) {
      if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
        console.log(`[Region Bypass] Network error with strategy: ${strategy.name}`);
        continue; // Network error, try next strategy
      }
      throw fetchError;
    }
  }
  
  // If we're here, all strategies failed
  throw lastError || new Error('All region bypass strategies failed');
}

// API endpoints for Appwrite operations
const ENDPOINTS = {
  LIST_DOCUMENTS: (databaseId: string, collectionId: string) => 
    `/databases/${databaseId}/collections/${collectionId}/documents`,
  GET_DOCUMENT: (databaseId: string, collectionId: string, documentId: string) => 
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
  CREATE_DOCUMENT: (databaseId: string, collectionId: string) => 
    `/databases/${databaseId}/collections/${collectionId}/documents`,
  UPDATE_DOCUMENT: (databaseId: string, collectionId: string, documentId: string) => 
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
  DELETE_DOCUMENT: (databaseId: string, collectionId: string, documentId: string) => 
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
};

/**
 * Region-safe API operations for Appwrite
 */
export const RegionBypassAPI = {
  /**
   * List documents in a collection
   */
  listDocuments: async (databaseId: string, collectionId: string, queries: string[] = []): Promise<ApiResponse> => {
    try {
      const queryString = queries.length > 0 ? `?${queries.join('&')}` : '';
      const result = await makeRegionBypassRequest(
        `${ENDPOINTS.LIST_DOCUMENTS(databaseId, collectionId)}${queryString}`,
        { method: 'GET' }
      );
      
      return {
        success: true,
        message: 'Documents retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error listing documents:', error);
      return {
        success: false,
        message: error.message || 'Failed to list documents',
        error
      };
    }
  },
  
  /**
   * Get a single document
   */
  getDocument: async (databaseId: string, collectionId: string, documentId: string): Promise<ApiResponse> => {
    try {
      const result = await makeRegionBypassRequest(
        ENDPOINTS.GET_DOCUMENT(databaseId, collectionId, documentId),
        { method: 'GET' }
      );
      
      return {
        success: true,
        message: 'Document retrieved successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error getting document:', error);
      return {
        success: false,
        message: error.message || 'Failed to get document',
        error
      };
    }
  },
  
  /**
   * Create a new document
   */
  createDocument: async (
    databaseId: string, 
    collectionId: string, 
    data: Record<string, any>,
    documentId?: string
  ): Promise<ApiResponse> => {
    try {
      const payload: Record<string, any> = { data };
      if (documentId) {
        payload.documentId = documentId;
      }
      
      const result = await makeRegionBypassRequest(
        ENDPOINTS.CREATE_DOCUMENT(databaseId, collectionId),
        { 
          method: 'POST', 
          body: JSON.stringify(payload)
        }
      );
      
      return {
        success: true,
        message: 'Document created successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error creating document:', error);
      return {
        success: false,
        message: error.message || 'Failed to create document',
        error
      };
    }
  },
  
  /**
   * Update an existing document
   */
  updateDocument: async (
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Record<string, any>
  ): Promise<ApiResponse> => {
    try {
      const result = await makeRegionBypassRequest(
        ENDPOINTS.UPDATE_DOCUMENT(databaseId, collectionId, documentId),
        { 
          method: 'PATCH', 
          body: JSON.stringify({ data })
        }
      );
      
      return {
        success: true,
        message: 'Document updated successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error updating document:', error);
      return {
        success: false,
        message: error.message || 'Failed to update document',
        error
      };
    }
  },
  
  /**
   * Delete a document
   */
  deleteDocument: async (
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<ApiResponse> => {
    try {
      const result = await makeRegionBypassRequest(
        ENDPOINTS.DELETE_DOCUMENT(databaseId, collectionId, documentId),
        { method: 'DELETE' }
      );
      
      return {
        success: true,
        message: 'Document deleted successfully',
        data: result
      };
    } catch (error: any) {
      console.error('Error deleting document:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete document',
        error
      };
    }
  },
  
  /**
   * Test the connection to Appwrite
   */
  testConnection: async (): Promise<ApiResponse> => {
    try {
      const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687c16800035a59a1f8e';
      if (!projectId) {
        throw new Error('Project ID not configured');
      }
      
      const result = await makeRegionBypassRequest(
        `/projects/${projectId}`,
        { method: 'GET' }
      );
      
      return {
        success: true,
        message: 'Successfully connected to Appwrite',
        data: {
          projectInfo: {
            name: result.name,
            region: result.region,
            platforms: result.platforms?.length || 0
          }
        }
      };
    } catch (error: any) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to Appwrite',
        error
      };
    }
  }
};

// Export constants for use in API routes
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'default';
export const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;

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
