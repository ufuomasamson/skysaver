'use client';

import { useState } from 'react';
import styles from '../diagnostics/DiagnosticPage.module.css';

interface ApiEndpointTesterProps {
  endpoint: string;
  methods: string[];
  description: string;
}

export default function ApiEndpointTester({ 
  endpoint, 
  methods = ['standard', 'regionBypass', 'mysql'],
  description 
}: ApiEndpointTesterProps) {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Test a specific endpoint with a specific method
  const testEndpoint = async (method: string) => {
    setLoading(prev => ({ ...prev, [method]: true }));
    setError(null);
    
    try {
      const suffix = method === 'regionBypass' ? '-bypass' : 
                    method === 'standard' ? '-standard' : '';
      
      const startTime = performance.now();
      
      const response = await fetch(`/api/${endpoint}${suffix}?limit=5`, {
        method: 'GET',
        cache: 'no-store'
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const data = await response.json();
      
      setResults(prev => ({
        ...prev,
        [method]: {
          success: response.ok,
          status: response.status,
          responseTime: Math.round(responseTime),
          data
        }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [method]: {
          success: false,
          error: error.message || 'Unknown error',
          responseTime: null
        }
      }));
      
      setError(`Error testing ${method} method: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [method]: false }));
    }
  };

  // Test all methods
  const testAll = () => {
    methods.forEach(method => testEndpoint(method));
  };

  return (
    <div className={styles.settingsCard}>
      <div className={styles.endpointHeader}>
        <h3>Test Endpoint: {endpoint}</h3>
        <button 
          onClick={testAll}
          disabled={Object.values(loading).some(Boolean)}
          className={styles.button}
        >
          Test All Methods
        </button>
      </div>
      
      <p>{description}</p>
      
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.error}>{error}</p>
        </div>
      )}
      
      <div className={styles.methodsContainer}>
        {methods.map(method => (
          <div key={method} className={styles.methodCard}>
            <div className={styles.methodHeader}>
              <h4>{method.charAt(0).toUpperCase() + method.slice(1)}</h4>
              <button
                onClick={() => testEndpoint(method)}
                disabled={loading[method]}
                className={`${styles.button} ${styles.smallButton}`}
              >
                {loading[method] ? 'Testing...' : 'Test'}
              </button>
            </div>
            
            {results[method] && (
              <div className={styles.methodResults}>
                <div className={styles.statusRow}>
                  <span>Status:</span>
                  <span className={`${styles.statusIndicator} ${results[method].success ? styles.statusSuccess : styles.statusError}`}>
                    {results[method].success ? 'SUCCESS' : 'FAILED'}
                    {results[method].status && ` (${results[method].status})`}
                  </span>
                </div>
                
                {results[method].responseTime && (
                  <div className={styles.statusRow}>
                    <span>Response Time:</span>
                    <span>{results[method].responseTime}ms</span>
                  </div>
                )}
                
                {results[method].data && (
                  <div className={styles.resultPreview}>
                    <div className={styles.previewHeader}>
                      <h5>Response Preview</h5>
                      <span className={styles.dataCount}>
                        {Array.isArray(results[method].data) ? 
                          `${results[method].data.length} items` : 
                          'Object'}
                      </span>
                    </div>
                    <pre className={styles.previewCode}>
                      {JSON.stringify(results[method].data, null, 2).substring(0, 200)}
                      {JSON.stringify(results[method].data, null, 2).length > 200 ? '...' : ''}
                    </pre>
                  </div>
                )}
                
                {results[method].error && (
                  <div className={styles.resultError}>
                    <h5>Error</h5>
                    <pre className={styles.errorCode}>{results[method].error}</pre>
                  </div>
                )}
              </div>
            )}
            
            {loading[method] && !results[method] && (
              <div className={styles.loadingIndicator}>
                Testing endpoint...
              </div>
            )}
            
            {!loading[method] && !results[method] && (
              <div className={styles.noResults}>
                No test results yet
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
