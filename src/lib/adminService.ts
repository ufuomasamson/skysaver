import { databases, account, DATABASE_ID, COLLECTIONS } from '@/lib/appwriteClient';
import { ID, Query } from 'appwrite';
import { AppwriteDocument } from '@/lib/databaseService';

// User role types
export type UserRole = 'user' | 'admin';

// Check if the current user is an admin
export async function isAdmin(): Promise<boolean> {
  try {
    const user = await account.get();
    return user.prefs?.role === 'admin';
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}

// Grant admin role to a user
export async function grantAdminRole(userId: string): Promise<boolean> {
  try {
    // First, check if the current user is an admin
    const currentUserIsAdmin = await isAdmin();
    if (!currentUserIsAdmin) {
      throw new Error('Only admins can grant admin roles');
    }

    // Update user preferences with admin role
    // Note: In a real app, you would want to use a server-side function for this
    // to prevent unauthorized role changes
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      userId,
      { role: 'admin' }
    );
    
    return true;
  } catch (error) {
    console.error("Grant admin role error:", error);
    return false;
  }
}

// Get all users with admin role
export async function getAllAdmins() {
  try {
    // First, check if the current user is an admin
    const currentUserIsAdmin = await isAdmin();
    if (!currentUserIsAdmin) {
      throw new Error('Only admins can view admin list');
    }

    // Get all users with admin role
    const admins = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('role', 'admin')]
    );
    
    return admins.documents;
  } catch (error) {
    console.error("Get admins error:", error);
    return [];
  }
}

// Add a new airline
export async function addAirline(airlineData: {
  name: string;
  code: string;
  country: string;
  logo_url?: string;
}) {
  try {
    // Check if the current user is an admin
    const currentUserIsAdmin = await isAdmin();
    if (!currentUserIsAdmin) {
      throw new Error('Only admins can add airlines');
    }

    const newAirline = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.AIRLINES,
      ID.unique(),
      airlineData
    );
    
    return newAirline;
  } catch (error) {
    console.error("Add airline error:", error);
    throw error;
  }
}

// Add a new flight
export async function addFlight(flightData: {
  airline_id: string;
  departure_location: string;
  arrival_location: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  seats_available: number;
  flight_number: string;
}) {
  try {
    // Check if the current user is an admin
    const currentUserIsAdmin = await isAdmin();
    if (!currentUserIsAdmin) {
      throw new Error('Only admins can add flights');
    }

    const newFlight = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.FLIGHTS,
      ID.unique(),
      flightData
    );
    
    return newFlight;
  } catch (error) {
    console.error("Add flight error:", error);
    throw error;
  }
}

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    // Check if the current user is an admin
    const currentUserIsAdmin = await isAdmin();
    if (!currentUserIsAdmin) {
      throw new Error('Only admins can view dashboard statistics');
    }

    // Get total users
    const users = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.limit(1)]
    );
    
    // Get total bookings
    const bookings = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      [Query.limit(1)]
    );
    
    // Get total flights
    const flights = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.FLIGHTS,
      [Query.limit(1)]
    );

    // Return statistics
    return {
      totalUsers: users.total,
      totalBookings: bookings.total,
      totalFlights: flights.total
    };
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    throw error;
  }
}
