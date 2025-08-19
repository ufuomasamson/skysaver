/**
 * API Service Factory
 * 
 * This service provides a mechanism to automatically select the most reliable
 * API approach based on current environment and testing results.
 * 
 * It will:
 * 1. Test the region bypass solution first
 * 2. Fall back to standard API methods if needed
 * 3. Cache the best approach for subsequent requests
 */

import { RegionBypassAPI } from './regionBypassAPI';

// Types for API selection
type ApiMethod = 'standard' | 'regionBypass' | 'mysql';
type ApiEndpoint = 'flights' | 'users' | 'bookings' | 'locations' | 'airlines' | 'payments';

interface EndpointStatus {
  preferredMethod: ApiMethod;
  lastTested: number;
  successRate: {
    standard: number;
    regionBypass: number;
    mysql: number;
  }
}

class ApiServiceFactory {
  private endpointStatus: Record<ApiEndpoint, EndpointStatus> = {
    flights: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    },
    users: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    },
    bookings: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    },
    locations: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    },
    airlines: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    },
    payments: {
      preferredMethod: 'regionBypass',
      lastTested: 0,
      successRate: { standard: 0, regionBypass: 0, mysql: 0 }
    }
  };
  
  private retestInterval = 60 * 60 * 1000; // 1 hour
  private isInitialized = false;
  
  /**
   * Initialize the API service factory
   * Tests all available methods and selects the best one
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('[ApiServiceFactory] Initializing and testing API methods...');
    
    // Test the region bypass API first
    try {
      const result = await RegionBypassAPI.testConnection();
      if (result.success) {
        console.log('[ApiServiceFactory] Region bypass API connection successful');
        // Set all endpoints to use region bypass by default
        for (const endpoint of Object.keys(this.endpointStatus) as ApiEndpoint[]) {
          this.endpointStatus[endpoint].preferredMethod = 'regionBypass';
          this.endpointStatus[endpoint].successRate.regionBypass = 1.0;
        }
      } else {
        console.warn('[ApiServiceFactory] Region bypass API connection failed, will use standard methods');
        // Set all endpoints to use standard methods by default
        for (const endpoint of Object.keys(this.endpointStatus) as ApiEndpoint[]) {
          this.endpointStatus[endpoint].preferredMethod = 'standard';
          this.endpointStatus[endpoint].successRate.standard = 0.5; // We'll give standard a chance
        }
      }
    } catch (error) {
      console.error('[ApiServiceFactory] Error during initialization:', error);
      // In case of error, we'll prefer MySQL as it's the most reliable fallback
      for (const endpoint of Object.keys(this.endpointStatus) as ApiEndpoint[]) {
        this.endpointStatus[endpoint].preferredMethod = 'mysql';
        this.endpointStatus[endpoint].successRate.mysql = 0.8;
      }
    }
    
    // Set the last tested time
    for (const endpoint of Object.keys(this.endpointStatus) as ApiEndpoint[]) {
      this.endpointStatus[endpoint].lastTested = Date.now();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Get the URL for the best API method for a specific endpoint
   * @param endpoint The API endpoint to access
   * @returns The URL to use for API requests
   */
  async getApiUrl(endpoint: ApiEndpoint): Promise<string> {
    await this.initialize();
    
    // Check if we need to retest
    const now = Date.now();
    if (now - this.endpointStatus[endpoint].lastTested > this.retestInterval) {
      await this.testEndpoint(endpoint);
    }
    
    // Use the preferred method
    switch (this.endpointStatus[endpoint].preferredMethod) {
      case 'regionBypass':
        return `/api/${endpoint}-bypass`;
      case 'mysql':
        return `/api/${endpoint}`;
      case 'standard':
        return `/api/${endpoint}-standard`;
      default:
        return `/api/${endpoint}`;
    }
  }
  
  /**
   * Record a success or failure for a specific API method
   * @param endpoint The API endpoint
   * @param method The API method used
   * @param success Whether the request was successful
   */
  recordRequestResult(endpoint: ApiEndpoint, method: ApiMethod, success: boolean) {
    // Update the success rate using exponential moving average
    const currentRate = this.endpointStatus[endpoint].successRate[method];
    const alpha = 0.3; // Weight for new values
    
    this.endpointStatus[endpoint].successRate[method] = 
      currentRate * (1 - alpha) + (success ? 1 : 0) * alpha;
    
    // If this was a successful request with the non-preferred method,
    // and it has a higher success rate, switch to it
    if (success && method !== this.endpointStatus[endpoint].preferredMethod) {
      const currentPreferred = this.endpointStatus[endpoint].preferredMethod;
      const currentPreferredRate = this.endpointStatus[endpoint].successRate[currentPreferred];
      const thisMethodRate = this.endpointStatus[endpoint].successRate[method];
      
      if (thisMethodRate > currentPreferredRate && thisMethodRate > 0.7) {
        console.log(`[ApiServiceFactory] Switching ${endpoint} from ${currentPreferred} to ${method} (success rates: ${currentPreferredRate.toFixed(2)} vs ${thisMethodRate.toFixed(2)})`);
        this.endpointStatus[endpoint].preferredMethod = method;
      }
    }
    
    // If this was a failed request with the preferred method,
    // and there's another method with a higher success rate, switch to it
    if (!success && method === this.endpointStatus[endpoint].preferredMethod) {
      const methods = ['standard', 'regionBypass', 'mysql'] as const;
      const bestMethod = methods.reduce((best, current) => {
        return this.endpointStatus[endpoint].successRate[current] > 
               this.endpointStatus[endpoint].successRate[best] ? current : best;
      }, method);
      
      if (bestMethod !== method && this.endpointStatus[endpoint].successRate[bestMethod] > 0.5) {
        console.log(`[ApiServiceFactory] Switching ${endpoint} from ${method} to ${bestMethod} after failure (success rates: ${this.endpointStatus[endpoint].successRate[method].toFixed(2)} vs ${this.endpointStatus[endpoint].successRate[bestMethod].toFixed(2)})`);
        this.endpointStatus[endpoint].preferredMethod = bestMethod;
      }
    }
  }
  
  /**
   * Test an endpoint with all available methods
   * @param endpoint The API endpoint to test
   */
  private async testEndpoint(endpoint: ApiEndpoint) {
    console.log(`[ApiServiceFactory] Testing endpoint: ${endpoint}`);
    
    this.endpointStatus[endpoint].lastTested = Date.now();
    
    // Test region bypass first
    try {
      const response = await fetch(`/api/${endpoint}-bypass?limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.recordRequestResult(endpoint, 'regionBypass', response.ok);
    } catch (error) {
      this.recordRequestResult(endpoint, 'regionBypass', false);
    }
    
    // Test standard method
    try {
      const response = await fetch(`/api/${endpoint}-standard?limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.recordRequestResult(endpoint, 'standard', response.ok);
    } catch (error) {
      this.recordRequestResult(endpoint, 'standard', false);
    }
    
    // Test MySQL method
    try {
      const response = await fetch(`/api/${endpoint}?limit=1`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      this.recordRequestResult(endpoint, 'mysql', response.ok);
    } catch (error) {
      this.recordRequestResult(endpoint, 'mysql', false);
    }
  }
  
  /**
   * Force the use of a specific API method for all endpoints
   * @param method The API method to use
   */
  forceApiMethod(method: ApiMethod) {
    console.log(`[ApiServiceFactory] Forcing all endpoints to use ${method} API`);
    
    for (const endpoint of Object.keys(this.endpointStatus) as ApiEndpoint[]) {
      this.endpointStatus[endpoint].preferredMethod = method;
    }
  }
  
  /**
   * Set the preferred API method for a specific endpoint
   * @param endpoint The API endpoint
   * @param method The API method to use
   */
  async setEndpointMethod(endpoint: ApiEndpoint, method: ApiMethod) {
    console.log(`[ApiServiceFactory] Setting ${endpoint} to use ${method} API`);
    
    if (method === 'standard' || method === 'regionBypass' || method === 'mysql') {
      this.endpointStatus[endpoint].preferredMethod = method;
    } else if (method === 'auto') {
      // Test and pick the best method
      await this.testEndpoint(endpoint);
    }
  }
  
  /**
   * Get the current status of all API endpoints
   * @returns The current endpoint status
   */
  getStatus() {
    return this.endpointStatus;
  }
}

// Singleton instance
export const apiServiceFactory = new ApiServiceFactory();

/**
 * Hook to get the best API URL for a specific endpoint
 * @param endpoint The API endpoint to access
 * @returns A function that returns the URL for the best API method
 */
export async function getApiUrl(endpoint: ApiEndpoint): Promise<string> {
  return apiServiceFactory.getApiUrl(endpoint);
}

/**
 * Function to handle API responses and automatically switch methods if needed
 * @param endpoint The API endpoint
 * @param method The API method used
 * @param response The fetch response
 */
export function handleApiResponse(endpoint: ApiEndpoint, method: ApiMethod, response: Response) {
  apiServiceFactory.recordRequestResult(endpoint, method, response.ok);
  return response;
}

/**
 * Make an API request using the best available method
 * @param endpoint The API endpoint
 * @param options The fetch options
 * @returns The fetch response
 */
export async function makeApiRequest(endpoint: ApiEndpoint, options: RequestInit = {}) {
  const url = await apiServiceFactory.getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, options);
    
    // Determine which method was used
    const method = url.includes('-bypass') ? 'regionBypass' : 
                   url.includes('-standard') ? 'standard' : 'mysql';
    
    apiServiceFactory.recordRequestResult(endpoint, method as ApiMethod, response.ok);
    
    return response;
  } catch (error) {
    // Determine which method was used
    const method = url.includes('-bypass') ? 'regionBypass' : 
                   url.includes('-standard') ? 'standard' : 'mysql';
    
    apiServiceFactory.recordRequestResult(endpoint, method as ApiMethod, false);
    throw error;
  }
}
