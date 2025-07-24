/**
 * Appwrite Data Migration Helper
 * 
 * This utility provides functions to help migrate data from Supabase to Appwrite.
 * It includes functions to map data structures and batch import documents.
 */

import { Client, Databases, ID } from 'appwrite';
import * as documentService from './documentService';

/**
 * Initialize Appwrite client and services
 * @returns Initialized Appwrite databases service
 */
function initAppwrite() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
  
  const databases = new Databases(client);
  return databases;
}

/**
 * Convert Supabase flights to Appwrite format
 * @param {Array} supabaseFlights - Array of flight objects from Supabase
 * @returns {Array} - Converted flight objects for Appwrite
 */
export function convertFlights(supabaseFlights) {
  return supabaseFlights.map(flight => ({
    airline_id: flight.airline_id,
    flight_number: flight.flight_number,
    departure_location_id: flight.departure_location_id,
    arrival_location_id: flight.arrival_location_id,
    date: flight.date,
    time: flight.departure_time || flight.time,
    price: parseFloat(flight.price),
    created_at: flight.created_at || new Date().toISOString(),
    passenger_name: flight.passenger_name,
    tracking_number: flight.tracking_number,
    trip: flight.trip_type || flight.trip || 'one-way',
    tour_type: flight.tour_type || 'business',
    passenger_count: parseInt(flight.passenger_count, 10) || 1,
    class: flight.class || 'economy',
    currency: flight.currency || 'USD'
  }));
}

/**
 * Convert Supabase airlines to Appwrite format
 * @param {Array} supabaseAirlines - Array of airline objects from Supabase
 * @returns {Array} - Converted airline objects for Appwrite
 */
export function convertAirlines(supabaseAirlines) {
  return supabaseAirlines.map(airline => ({
    name: airline.name,
    logo_url: airline.logo_url
  }));
}

/**
 * Convert Supabase bookings to Appwrite format
 * @param {Array} supabaseBookings - Array of booking objects from Supabase
 * @returns {Array} - Converted booking objects for Appwrite
 */
export function convertBookings(supabaseBookings) {
  return supabaseBookings.map(booking => ({
    user_id: booking.user_id,
    flight_id: booking.flight_id,
    passenger_name: booking.passenger_name,
    paid: booking.paid === true || booking.paid === 'true' || booking.paid === 1,
    ticket_url: booking.ticket_url || '',
    created_at: booking.created_at || new Date().toISOString(),
    status: booking.status || 'Pending'
  }));
}

/**
 * Convert Supabase locations to Appwrite format
 * @param {Array} supabaseLocations - Array of location objects from Supabase
 * @returns {Array} - Converted location objects for Appwrite
 */
export function convertLocations(supabaseLocations) {
  return supabaseLocations.map(location => ({
    city: location.city,
    country: location.country
  }));
}

/**
 * Migrate documents from Supabase to Appwrite
 * @param {string} collectionType - Collection type (e.g., 'flights', 'airlines')
 * @param {Array} supabaseData - Array of objects from Supabase
 * @returns {Promise<Array>} - Results of document creation operations
 */
export async function migrateDocuments(collectionType, supabaseData) {
  const databases = initAppwrite();
  const results = [];
  
  // Map collection type to converter function
  const converterFunctions = {
    flights: convertFlights,
    airlines: convertAirlines,
    bookings: convertBookings,
    locations: convertLocations
    // Add more converters as needed
  };
  
  // Map collection type to document creation function
  const creationFunctions = {
    flights: documentService.createFlight,
    airlines: documentService.createAirline,
    bookings: documentService.createBooking,
    locations: documentService.createLocation,
    currencies: documentService.createCurrency,
    cryptoWallets: documentService.createCryptoWallet,
    paymentGateways: documentService.createPaymentGateway,
    payments: documentService.createPayment,
    userPreferences: documentService.createUserPreferences,
    users: documentService.createUser
  };
  
  // Get appropriate converter function
  const converter = converterFunctions[collectionType];
  const createFunction = creationFunctions[collectionType];
  
  if (!createFunction) {
    throw new Error(`Unsupported collection type: ${collectionType}`);
  }
  
  // Convert data if converter exists, otherwise use as-is
  const appwriteData = converter ? converter(supabaseData) : supabaseData;
  
  // Process in batches to avoid rate limits
  const batchSize = 20;
  
  for (let i = 0; i < appwriteData.length; i += batchSize) {
    const batch = appwriteData.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(item => createFunction(databases, item))
    );
    
    // Add results to results array
    results.push(...batchResults.map((result, index) => ({
      data: batch[i + index],
      success: result.status === 'fulfilled',
      result: result.status === 'fulfilled' ? result.value : result.reason
    })));
    
    // Wait briefly to avoid rate limiting
    if (i + batchSize < appwriteData.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}

/**
 * Count successful and failed migrations
 * @param {Array} migrationResults - Results from migrateDocuments
 * @returns {Object} - Counts of successful and failed migrations
 */
export function getMigrationStats(migrationResults) {
  const successful = migrationResults.filter(result => result.success).length;
  const failed = migrationResults.filter(result => !result.success).length;
  
  return {
    total: migrationResults.length,
    successful,
    failed,
    failureRate: failed / migrationResults.length
  };
}
