'use client';

import { useState, useEffect } from 'react';
import styles from './DiagnosticPage.module.css';

export default function DiagnosticPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedMethod, setSelectedMethod] = useState<string>('auto');

  // Function to run the region bypass test
  const runRegionBypassTest = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-region-bypass');
      const data = await response.json();
      
      setTestResults(data);
      
      if (!data.success) {
        setError(data.message || 'Unknown error occurred');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to run region bypass test');
      console.error('Error running region bypass test:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to run the full diagnostics
  const runFullDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/diagnostics');
      const data = await response.json();
      
      setDiagnosticResults(data);
      
      if (!data.success) {
        setError(data.message || 'Unknown error occurred');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to run diagnostics');
      console.error('Error running diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to set the preferred API method
  const setApiMethod = async (method: string) => {
    try {
      const response = await fetch('/api/set-api-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ method })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedMethod(method);
        // Re-run diagnostics to get updated status
        runFullDiagnostics();
      } else {
        setError(data.message || 'Failed to set API method');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to set API method');
      console.error('Error setting API method:', error);
    }
  };
  
  // Load diagnostics on initial page load
  useEffect(() => {
    runFullDiagnostics();
  }, []);

  // Helper function to render status badges
  const renderStatusBadge = (success: boolean | undefined) => {
    if (success === undefined) return (
      <div className={`${styles.statusBadge} ${styles.pending}`}>UNKNOWN</div>
    );
    
    return (
      <div className={`${styles.statusBadge} ${success ? styles.success : styles.error}`}>
        {success ? 'SUCCESS' : 'FAILED'}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>API Diagnostics Dashboard</h1>
      <p className={styles.description}>
        This dashboard helps diagnose and test different API strategies to overcome region restrictions.
      </p>
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'regionBypass' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('regionBypass')}
        >
          Region Bypass
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'comparison' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          API Comparison
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      <div className={styles.actionBar}>
        <button 
          onClick={runFullDiagnostics} 
          disabled={loading}
          className={styles.button}
        >
          {loading ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </button>
        
        <button 
          onClick={runRegionBypassTest} 
          disabled={loading}
          className={`${styles.button} ${styles.secondaryButton}`}
        >
          {loading ? 'Testing...' : 'Test Region Bypass Only'}
        </button>
      </div>
      
      {error && (
        <div className={styles.errorContainer}>
          <h3>Error</h3>
          <p className={styles.error}>{error}</p>
        </div>
      )}
      
      {activeTab === 'overview' && diagnosticResults && (
        <div className={styles.overviewContainer}>
          <h2>API Status Overview</h2>
          
          <div className={styles.statusGrid}>
            <div className={styles.statusCard}>
              <h3>Region Bypass API</h3>
              {renderStatusBadge(diagnosticResults.testResults?.regionBypassTest?.success)}
              <p>{diagnosticResults.testResults?.regionBypassTest?.success ? 
                'Working correctly' : 'Not working properly'}
              </p>
            </div>
            
            <div className={styles.statusCard}>
              <h3>Standard API</h3>
              {renderStatusBadge(diagnosticResults.testResults?.standardApiTest?.success)}
              <p>{diagnosticResults.testResults?.standardApiTest?.success ? 
                'Working correctly' : 'Not working properly'}
              </p>
            </div>
            
            <div className={styles.statusCard}>
              <h3>MySQL API</h3>
              {renderStatusBadge(diagnosticResults.testResults?.mysqlTest?.success)}
              <p>{diagnosticResults.testResults?.mysqlTest?.success ? 
                'Working correctly' : 'Not working properly'}
              </p>
            </div>
          </div>
          
          <div className={styles.recommendationsContainer}>
            <h3>Recommendations</h3>
            <div className={styles.recommendationBox}>
              <p className={styles.recommendationHeading}>
                Recommended API Method: <strong>{diagnosticResults.testResults?.recommendations?.bestMethod || 'None'}</strong>
              </p>
              
              <ul className={styles.recommendationsList}>
                {diagnosticResults.testResults?.recommendations?.recommendations.map((recommendation: string, index: number) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className={styles.lastUpdated}>
            <p>Last updated: {new Date(diagnosticResults.testResults?.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
      
      {activeTab === 'regionBypass' && testResults && (
        <div className={styles.resultsContainer}>
          <h2>Region Bypass Test Results</h2>
          
          <div className={styles.resultCard}>
            <h3>Connection Test</h3>
            <div className={styles.statusBadge + ' ' + (testResults.results?.connectionTest?.success ? styles.success : styles.error)}>
              {testResults.results?.connectionTest?.success ? 'SUCCESS' : 'FAILED'}
            </div>
            <p>{testResults.results?.connectionTest?.message}</p>
            
            {testResults.results?.connectionTest?.data && (
              <div className={styles.dataSection}>
                <h4>Project Info</h4>
                <pre>{JSON.stringify(testResults.results?.connectionTest?.data?.projectInfo, null, 2)}</pre>
              </div>
            )}
          </div>
          
          <div className={styles.resultCard}>
            <h3>Locations List Test</h3>
            <div className={styles.statusBadge + ' ' + (testResults.results?.locationsList?.success ? styles.success : styles.error)}>
              {testResults.results?.locationsList?.success ? 'SUCCESS' : 'FAILED'}
            </div>
            <p>{testResults.results?.locationsList?.message}</p>
            
            {testResults.results?.locationsList?.data && (
              <div className={styles.dataSection}>
                <h4>Data Sample</h4>
                <pre>{JSON.stringify(testResults.results?.locationsList?.data, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'comparison' && diagnosticResults && (
        <div className={styles.comparisonContainer}>
          <h2>API Method Comparison</h2>
          
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Region Bypass API</th>
                <th>Standard API</th>
                <th>MySQL API</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Connection Status</td>
                <td>{renderStatusBadge(diagnosticResults.testResults?.regionBypassTest?.success)}</td>
                <td>{renderStatusBadge(diagnosticResults.testResults?.standardApiTest?.success)}</td>
                <td>{renderStatusBadge(diagnosticResults.testResults?.mysqlTest?.success)}</td>
              </tr>
              <tr>
                <td>Response Time</td>
                <td>Medium</td>
                <td>Slow (with region issues)</td>
                <td>Fast</td>
              </tr>
              <tr>
                <td>Reliability</td>
                <td>High (with region bypass)</td>
                <td>Low (region dependent)</td>
                <td>High</td>
              </tr>
              <tr>
                <td>Security</td>
                <td>Medium (uses headers modification)</td>
                <td>High</td>
                <td>Medium (direct DB access)</td>
              </tr>
            </tbody>
          </table>
          
          <div className={styles.apiServiceStatus}>
            <h3>API Service Factory Status</h3>
            <p>The API Service Factory automatically selects the best working method for each endpoint.</p>
            
            <div className={styles.statusTable}>
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Preferred Method</th>
                    <th>Last Tested</th>
                    <th>Success Rates</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(diagnosticResults.testResults?.apiServiceStatus || {}).map(([endpoint, status]: [string, any]) => (
                    <tr key={endpoint}>
                      <td>{endpoint}</td>
                      <td>
                        <span className={`${styles.methodBadge} ${styles[status.preferredMethod]}`}>
                          {status.preferredMethod}
                        </span>
                      </td>
                      <td>{status.lastTested ? new Date(status.lastTested).toLocaleString() : 'Never'}</td>
                      <td>
                        <div className={styles.successRates}>
                          <div className={styles.successRate}>
                            <span>Region Bypass:</span>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{width: `${status.successRate.regionBypass * 100}%`}}
                              ></div>
                            </div>
                            <span>{Math.round(status.successRate.regionBypass * 100)}%</span>
                          </div>
                          <div className={styles.successRate}>
                            <span>Standard:</span>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{width: `${status.successRate.standard * 100}%`}}
                              ></div>
                            </div>
                            <span>{Math.round(status.successRate.standard * 100)}%</span>
                          </div>
                          <div className={styles.successRate}>
                            <span>MySQL:</span>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill} 
                                style={{width: `${status.successRate.mysql * 100}%`}}
                              ></div>
                            </div>
                            <span>{Math.round(status.successRate.mysql * 100)}%</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className={styles.settingsContainer}>
          <h2>API Settings</h2>
          
          <div className={styles.settingsCard}>
            <h3>Force API Method</h3>
            <p>Override the automatic API method selection for all endpoints.</p>
            
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="apiMethod" 
                  value="auto" 
                  checked={selectedMethod === 'auto'}
                  onChange={() => setApiMethod('auto')}
                />
                <span>Auto (Let system decide)</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="apiMethod" 
                  value="regionBypass" 
                  checked={selectedMethod === 'regionBypass'}
                  onChange={() => setApiMethod('regionBypass')}
                />
                <span>Force Region Bypass API</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="apiMethod" 
                  value="standard" 
                  checked={selectedMethod === 'standard'}
                  onChange={() => setApiMethod('standard')}
                />
                <span>Force Standard API</span>
              </label>
              
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="apiMethod" 
                  value="mysql" 
                  checked={selectedMethod === 'mysql'}
                  onChange={() => setApiMethod('mysql')}
                />
                <span>Force MySQL API</span>
              </label>
            </div>
          </div>
          
          <div className={styles.settingsCard}>
            <h3>Environment Information</h3>
            
            <div className={styles.envInfo}>
              <div className={styles.envItem}>
                <span className={styles.envLabel}>Node Environment:</span>
                <span className={styles.envValue}>{process.env.NODE_ENV}</span>
              </div>
              
              <div className={styles.envItem}>
                <span className={styles.envLabel}>Region Bypass Enabled:</span>
                <span className={styles.envValue}>Yes</span>
              </div>
              
              <div className={styles.envItem}>
                <span className={styles.envLabel}>Database Type:</span>
                <span className={styles.envValue}>MySQL with Appwrite Fallback</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
