/**
 * Appwrite Document Creation Test Helper
 * This file provides a simple browser-based UI for testing document creation
 * using the functions from documentService.ts
 */
'use client';

import { useState } from 'react';
import { Client, Databases, ID } from 'appwrite';
import * as documentService from './documentService';

interface TestResult {
  collectionName: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
}

export default function AppwriteDocumentTester() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize Appwrite client
  const initAppwrite = () => {
    try {
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
      
      const databases = new Databases(client);
      return { client, databases };
    } catch (error) {
      console.error('Failed to initialize Appwrite client:', error);
      throw error;
    }
  };

  // Create a test document for each collection
  const createTestDocuments = async () => {
    setLoading(true);
    setResults([]);
    
    const { databases } = initAppwrite();
    
    // Generate test data for each collection
    const testData = {
      flight: {
        airline_id: "test_airline",
        flight_number: `TEST${Math.floor(Math.random() * 1000)}`,
        departure_location_id: "test_location_nyc",
        arrival_location_id: "test_location_lax",
        date: new Date().toISOString().split('T')[0],
        time: "12:00",
        price: 299.99,
        passenger_name: "Test User",
        tracking_number: `TRK-TEST-${Math.floor(Math.random() * 10000)}`,
        trip: "one-way",
        tour_type: "leisure",
        passenger_count: 1,
        class: "economy",
        currency: "USD"
      },
      airline: {
        name: "Test Airlines",
        logo_url: "https://example.com/test-logo.png"
      },
      booking: {
        user_id: "test_user",
        flight_id: "test_flight",
        passenger_name: "Test Passenger",
        paid: false,
        ticket_url: "",
        status: "Pending"
      },
      cryptoWallet: {
        user_email: "test@example.com",
        wallet_address: "0xTEST12345",
        network: "Ethereum",
        name: "Test Wallet",
        qr_code_url: ""
      },
      currency: {
        code: "TST",
        name: "Test Currency",
        symbol: "₮"
      },
      location: {
        city: "Test City",
        country: "Test Country"
      },
      paymentGateway: {
        name: "Test Gateway",
        api_key: "test_api_key",
        enabled: true
      },
      payment: {
        booking_id: "test_booking",
        wallet_id: "test_wallet",
        amount: 299.99,
        proof_url: "https://example.com/test-proof.png",
        status: "pending"
      },
      userPreferences: {
        user_email: "test@example.com",
        currency_id: "test_currency",
        notifications_enabled: true
      },
      user: {
        email: "test@example.com",
        password_hash: "hashed_test_password",
        full_name: "Test User",
        role: "user"
      }
    };
    
    // List of document creation functions to test
    const testFunctions = [
      { name: 'flight', fn: documentService.createFlight, data: testData.flight },
      { name: 'airline', fn: documentService.createAirline, data: testData.airline },
      { name: 'booking', fn: documentService.createBooking, data: testData.booking },
      { name: 'cryptoWallet', fn: documentService.createCryptoWallet, data: testData.cryptoWallet },
      { name: 'currency', fn: documentService.createCurrency, data: testData.currency },
      { name: 'location', fn: documentService.createLocation, data: testData.location },
      { name: 'paymentGateway', fn: documentService.createPaymentGateway, data: testData.paymentGateway },
      { name: 'payment', fn: documentService.createPayment, data: testData.payment },
      { name: 'userPreferences', fn: documentService.createUserPreferences, data: testData.userPreferences },
      { name: 'user', fn: documentService.createUser, data: testData.user }
    ];
    
    // Test each function
    for (const test of testFunctions) {
      try {
        setResults(prev => [
          ...prev,
          { 
            collectionName: test.name, 
            status: 'pending', 
            message: `Creating ${test.name} document...` 
          }
        ]);
        
        const result = await test.fn(databases, test.data);
        
        setResults(prev => {
          const newResults = [...prev];
          const index = newResults.findIndex(r => r.collectionName === test.name);
          if (index !== -1) {
            newResults[index] = {
              collectionName: test.name,
              status: 'success',
              message: `${test.name} document created successfully with ID: ${result.$id}`,
              data: result
            };
          }
          return newResults;
        });
      } catch (error: any) {
        console.error(`Error creating ${test.name} document:`, error);
        
        setResults(prev => {
          const newResults = [...prev];
          const index = newResults.findIndex(r => r.collectionName === test.name);
          if (index !== -1) {
            newResults[index] = {
              collectionName: test.name,
              status: 'error',
              message: `Error creating ${test.name} document: ${error.message || 'Unknown error'}`
            };
          }
          return newResults;
        });
      }
    }
    
    setLoading(false);
  };

  return {
    createTestDocuments,
    results,
    loading,
    reset: () => setResults([])
  };
}
