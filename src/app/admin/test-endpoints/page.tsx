'use client';

import { useState } from 'react';
import ApiEndpointTester from '../components/ApiEndpointTester';
import styles from '../diagnostics/DiagnosticPage.module.css';

export default function TestEndpointsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');

  const endpoints = [
    { value: 'flights', label: 'Flights API' },
    { value: 'users', label: 'Users API' },
    { value: 'locations', label: 'Locations API' },
    { value: 'airlines', label: 'Airlines API' },
    { value: 'bookings', label: 'Bookings API' },
    { value: 'payments', label: 'Payments API' },
    { value: 'custom', label: 'Custom Endpoint...' }
  ];

  const getEndpointDescription = (endpoint: string) => {
    switch (endpoint) {
      case 'flights':
        return 'Flight search and management API endpoints';
      case 'users':
        return 'User account management API endpoints';
      case 'locations':
        return 'Airport and city location data API endpoints';
      case 'airlines':
        return 'Airline information and details API endpoints';
      case 'bookings':
        return 'Flight booking and reservation API endpoints';
      case 'payments':
        return 'Payment processing and history API endpoints';
      default:
        return `Testing custom API endpoint: ${endpoint}`;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>API Endpoint Tester</h1>
      <p className={styles.description}>
        Test different API implementations and compare performance and reliability
      </p>

      <div className={styles.settingsCard}>
        <h3>Select API Endpoint</h3>
        <p>Choose an API endpoint to test or enter a custom endpoint name</p>
        
        <div className={styles.endpointSelector}>
          <select 
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className={styles.dropdown}
          >
            <option value="">Select an endpoint</option>
            {endpoints.map(endpoint => (
              <option key={endpoint.value} value={endpoint.value}>{endpoint.label}</option>
            ))}
          </select>
          
          {selectedEndpoint === 'custom' && (
            <div className={styles.customEndpointInput}>
              <input
                type="text"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                placeholder="Enter custom endpoint name (without /api/)"
                className={styles.textInput}
              />
            </div>
          )}
        </div>
      </div>

      {selectedEndpoint && selectedEndpoint !== 'custom' && (
        <ApiEndpointTester
          endpoint={selectedEndpoint}
          methods={['regionBypass', 'standard', 'mysql']}
          description={getEndpointDescription(selectedEndpoint)}
        />
      )}
      
      {selectedEndpoint === 'custom' && customEndpoint && (
        <ApiEndpointTester
          endpoint={customEndpoint}
          methods={['regionBypass', 'standard', 'mysql']}
          description={getEndpointDescription(customEndpoint)}
        />
      )}

      <div className={styles.settingsCard}>
        <h3>API Implementation Notes</h3>
        
        <div className={styles.noteCard}>
          <h4>Region Bypass API</h4>
          <p>
            The Region Bypass API uses custom HTTP headers and multiple fallback approaches to overcome
            the "Project is not accessible in this region" errors from Appwrite. This implementation:
          </p>
          <ul>
            <li>Uses specialized headers to simulate requests from allowed regions</li>
            <li>Implements multiple retry strategies with different regional configurations</li>
            <li>Provides detailed error handling and debugging information</li>
          </ul>
        </div>
        
        <div className={styles.noteCard}>
          <h4>Standard API</h4>
          <p>
            The Standard API uses the default Appwrite client SDK approach. This implementation:
          </p>
          <ul>
            <li>Uses the official Appwrite Node.js SDK</li>
            <li>Follows standard authentication and request patterns</li>
            <li>May be subject to region restrictions</li>
          </ul>
        </div>
        
        <div className={styles.noteCard}>
          <h4>MySQL API</h4>
          <p>
            The MySQL API bypasses Appwrite completely and connects directly to the database. This implementation:
          </p>
          <ul>
            <li>Uses direct MySQL database connections</li>
            <li>Not subject to Appwrite region restrictions</li>
            <li>May lack certain Appwrite-specific features</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
