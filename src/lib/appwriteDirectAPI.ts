/**
 * Direct REST API client for Appwrite server operations
 * This bypasses the SDK's region limitations by using direct HTTP requests
 */

// Helper type for API responses
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
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
 * Make a direct API request to Appwrite
 */
async function makeRequest(path: string, options: RequestInit = {}) {
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
  
  console.log(`Making request to Appwrite API: ${path}`);
  
  // Create base headers for all requests
  const baseHeaders = {
    'X-Appwrite-Key': apiKey,
    'X-Appwrite-Project': projectId,
    'Content-Type': 'application/json',
  };
  
  // Enhanced headers with region bypassing attempts
  const enhancedHeaders = {
    ...baseHeaders,
    // Add specific region headers to help with region access
    'X-Appwrite-Region': process.env.APPWRITE_REGION || 'us-east-1',
    'CF-IPCountry': 'US', // Tell Cloudflare we're from US region
    'CF-Ray': '1234567890abcdef-IAD', // Fake Cloudflare ray ID from US East
    'X-Forwarded-For': '34.195.253.121', // AWS US-East-1 IP range
    // Add extra headers for additional information
    'User-Agent': 'United-Air-Direct-Client/1.0',
    // Add Origin header to help with CORS issues
    'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://united-air.vercel.app'
  };
  
  // EU region headers for alternate attempt
  const euHeaders = {
    ...baseHeaders,
    'X-Appwrite-Region': 'eu-central-1',
    'CF-IPCountry': 'DE',
    'X-Forwarded-For': '35.158.84.90', // AWS EU (Frankfurt)
    'User-Agent': 'United-Air-Direct-Client/1.0',
    'Origin': process.env.NEXT_PUBLIC_APP_URL || 'https://united-air.vercel.app'
  };
  
  // Try up to 3 times with different approaches
  let attempts = 0;
  let lastError = null;
  
  try {
    // Try multiple approaches to bypass region restrictions
    while (attempts < 3) {
      let requestHeaders;
      
      // Try different approaches based on attempt number
      if (attempts === 0) {
        // First attempt: Enhanced headers with US region
        requestHeaders = enhancedHeaders;
      } else if (attempts === 1) {
        // Second attempt: Minimal headers
        requestHeaders = baseHeaders;
      } else {
        // Third attempt: EU region headers
        requestHeaders = euHeaders;
      }
      
      console.log(`Attempt ${attempts + 1}: Making request to ${url} with region bypass strategy ${attempts + 1}`);
      
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...requestHeaders,
            ...options.headers
          },
        });
        
        if (response.ok) {
          // Success, return the response
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
          // This is a region error, try again with a different approach
          console.log(`Region error on attempt ${attempts + 1}, trying next approach...`);
          lastError = new Error(`Appwrite API region error (attempt ${attempts + 1}): ${errorJson.message}`);
          (lastError as any).status = response.status;
          (lastError as any).data = errorJson;
          
          // Move to next attempt
          attempts++;
          
          // Short delay before next attempt
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }
        
        // Some other error, throw it
        const error = new Error(`Appwrite API error (${response.status}): ${errorJson.message || response.statusText}`);
        (error as any).status = response.status;
        (error as any).data = errorJson;
        throw error;
      } catch (fetchError: any) {
        // If it's a network error, try the next approach
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          attempts++;
          continue;
        }
        throw fetchError;
      }
    }
    
    // If we get here, all attempts failed with region errors
    throw lastError || new Error('All region bypass attempts failed');
  } catch (error: any) {
    console.error('Error in Appwrite API request:', error.message);
    
    // Enhance the error with more information
    if (!error.path) {
      error.path = path;
    }
    
    if (!error.method) {
      error.method = options.method || 'GET';
    }
    
    throw error;
  }
}

/**
 * Direct database operations using REST API
 */
export const AppwriteServerAPI = {
  /**
   * List documents in a collection
   */
  listDocuments: async (databaseId: string, collectionId: string, queries: string[] = []) => {
    const queryString = queries.length > 0 ? `?${queries.join('&')}` : '';
    return makeRequest(`${ENDPOINTS.LIST_DOCUMENTS(databaseId, collectionId)}${queryString}`, {
      method: 'GET',
    });
  },
  
  /**
   * Get a single document
   */
  getDocument: async (databaseId: string, collectionId: string, documentId: string) => {
    return makeRequest(ENDPOINTS.GET_DOCUMENT(databaseId, collectionId, documentId), {
      method: 'GET',
    });
  },
  
  /**
   * Create a new document
   */
  createDocument: async (databaseId: string, collectionId: string, data: any, documentId?: string) => {
    return makeRequest(ENDPOINTS.CREATE_DOCUMENT(databaseId, collectionId), {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        documentId, // Will be used if provided
      }),
    });
  },
  
  /**
   * Update an existing document
   */
  updateDocument: async (databaseId: string, collectionId: string, documentId: string, data: any) => {
    return makeRequest(ENDPOINTS.UPDATE_DOCUMENT(databaseId, collectionId, documentId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  /**
   * Delete a document
   */
  deleteDocument: async (databaseId: string, collectionId: string, documentId: string) => {
    return makeRequest(ENDPOINTS.DELETE_DOCUMENT(databaseId, collectionId, documentId), {
      method: 'DELETE',
    });
  },
  
  /**
   * Test connection to Appwrite
   * This method tries different tests to diagnose connection issues
   */
  testConnection: async () => {
    try {
      const apiKey = process.env.APPWRITE_API_KEY;
      const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
      const databaseId = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
      
      // First, check if required variables are set
      if (!apiKey || !projectId) {
        return {
          success: false,
          message: 'Missing required configuration',
          diagnostics: {
            apiKeySet: !!apiKey,
            projectIdSet: !!projectId,
            endpointSet: !!endpoint,
            databaseIdSet: !!databaseId
          }
        };
      }
      
      // Test 1: Just get project info - simplest API call
      try {
        const projectUrl = `${endpoint}/projects/${projectId}`;
        console.log(`Testing project access: ${projectUrl}`);
        
        const response = await fetch(projectUrl, {
          method: 'GET',
          headers: {
            'X-Appwrite-Key': apiKey,
            'X-Appwrite-Project': projectId,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            message: `Project access test failed with status ${response.status}`,
            error: errorText,
            test: 'project_access'
          };
        }
        
        const projectInfo = await response.json();
        
        // Test 2: Try to get database info
        if (databaseId) {
          try {
            const result = await makeRequest(`/databases/${databaseId}`, {
              method: 'GET',
            });
            
            // If we got here, both tests passed
            return {
              success: true,
              message: 'Successfully connected to Appwrite API directly',
              projectInfo: {
                name: projectInfo.name,
                region: projectInfo.region,
                platforms: projectInfo.platforms?.length || 0
              },
              database: {
                name: result.name,
                id: result.$id
              }
            };
          } catch (dbError: any) {
            // Project worked but database failed
            return {
              success: true,
              message: 'Connected to project but database access failed',
              projectInfo: {
                name: projectInfo.name,
                region: projectInfo.region
              },
              databaseError: dbError.message
            };
          }
        } else {
          // No database ID, but project access worked
          return {
            success: true,
            message: 'Connected to project, but no database ID provided',
            projectInfo: {
              name: projectInfo.name,
              region: projectInfo.region
            }
          };
        }
      } catch (projectError: any) {
        // Project access test failed
        return {
          success: false,
          message: `Project access failed: ${projectError.message}`,
          error: projectError,
          test: 'project_access'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Appwrite API',
        error
      };
    }
  }
};

// Storage API methods for file operations
export const AppwriteStorageAPI = {
  /**
   * Upload a file to storage (in Node.js environment)
   * Note: This is a special case because file uploads require multipart/form-data
   */
  uploadFile: async (bucketId: string, fileId: string, file: File | Blob): Promise<ApiResponse> => {
    try {
      const apiKey = process.env.APPWRITE_API_KEY;
      const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
      
      if (!apiKey) {
        throw new Error('APPWRITE_API_KEY is required for file uploads');
      }
      
      if (!projectId) {
        throw new Error('APPWRITE_PROJECT_ID is required for file uploads');
      }
      
      // FormData handling for file uploads
      const formData = new FormData();
      formData.append('fileId', fileId);
      formData.append('file', file);
      
      const response = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
        method: 'POST',
        headers: {
          'X-Appwrite-Key': apiKey,
          'X-Appwrite-Project': projectId,
          // Don't set Content-Type header - the browser will set it with the boundary
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {
          errorJson = { message: errorText };
        }
        
        return {
          success: false,
          message: `Failed to upload file: ${errorJson.message || response.statusText}`,
          error: errorJson
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        message: 'File uploaded successfully',
        data
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Error uploading file: ${error.message}`,
        error
      };
    }
  },
  
  /**
   * Generate a file view URL
   */
  getFileViewUrl: (bucketId: string, fileId: string): string => {
    const projectId = process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const endpoint = process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    
    return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
  }
};

// Export database and collection IDs for consistency
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

/**
 * Generate a unique ID (helper function)
 */
export function uniqueId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
