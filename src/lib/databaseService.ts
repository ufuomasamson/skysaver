import { supabase, TABLES } from "@/lib/supabaseClient";

// Define a type for the filter operators
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';

// Define a type for filters
export interface Filter {
  field: string;
  value: any;
  type: FilterOperator;
}

// Define a generic record type
export interface SupabaseRecord<T = {}> {
  id: string;
  created_at?: string;
  updated_at?: string;
} & T;

// Create a new document
export async function createDocument<T>(
  tableName: string, 
  data: T,
  customId?: string
) {
  const documentData = customId ? { id: customId, ...data } : data;
  
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(documentData)
    .select()
    .single();
    
  if (error) throw error;
  return result;
}

// Get a single document by ID
export async function getDocument<T = {}>(
  tableName: string,
  documentId: string
) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', documentId)
    .single();
    
  if (error) throw error;
  return data as SupabaseRecord<T>;
}

// List documents with optional filters and pagination
export async function listDocuments<T = {}>(
  tableName: string,
  options: {
    filters?: Filter[],
    page?: number,
    limit?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  } = {}
) {
  const { 
    filters = [], 
    page = 1, 
    limit = 25,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;
  
  // Start building the query
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact' });
    
  // Apply filters if any
  filters.forEach(filter => {
    if (filter.type === 'eq') query = query.eq(filter.field, filter.value);
    else if (filter.type === 'neq') query = query.neq(filter.field, filter.value);
    else if (filter.type === 'gt') query = query.gt(filter.field, filter.value);
    else if (filter.type === 'lt') query = query.lt(filter.field, filter.value);
    else if (filter.type === 'gte') query = query.gte(filter.field, filter.value);
    else if (filter.type === 'lte') query = query.lte(filter.field, filter.value);
    else if (filter.type === 'like') query = query.ilike(filter.field, `%${filter.value}%`);
  });
  
  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Apply ordering and pagination
  const { data, error, count } = await query
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(from, to);
    
  if (error) throw error;
  
  return {
    documents: data as SupabaseRecord<T>[],
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

// Update a document
export async function updateDocument<T>(
  tableName: string,
  documentId: string,
  data: Partial<T>
) {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', documentId)
    .select()
    .single();
    
  if (error) throw error;
  return result;
}

// Delete a document
export async function deleteDocument(
  tableName: string,
  documentId: string
) {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', documentId);
    
  if (error) throw error;
  return { success: true };
}

// Search documents
export async function searchDocuments<T = {}>(
  tableName: string,
  searchFields: string[],
  searchTerm: string,
  options: {
    page?: number,
    limit?: number,
    orderBy?: string,
    orderDirection?: 'asc' | 'desc'
  } = {}
) {
  const { 
    page = 1, 
    limit = 25,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;
  
  // Start building the query
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact' });
  
  // If search term is provided, add search conditions
  if (searchTerm && searchTerm.trim() !== '') {
    const trimmedSearchTerm = searchTerm.trim();
    
    // Create an OR condition for each search field
    if (searchFields.length > 0) {
      const firstField = searchFields[0];
      query = query.ilike(firstField, `%${trimmedSearchTerm}%`);
      
      // Add OR conditions for remaining fields
      for (let i = 1; i < searchFields.length; i++) {
        query = query.or(`${searchFields[i]}.ilike.%${trimmedSearchTerm}%`);
      }
    }
  }
  
  // Calculate pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  // Apply ordering and pagination
  const { data, error, count } = await query
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(from, to);
    
  if (error) throw error;
  
  return {
    documents: data as SupabaseRecord<T>[],
    total: count || 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

// Get user profile by user ID
export async function getUserProfile(userId: string) {
  try {
    return await getDocument(TABLES.PROFILES, userId);
  } catch (error) {
    // If profile doesn't exist, return null
    return null;
  }
}

// Convenience functions to use specific tables

export const Flights = {
  create: <T>(data: T) => createDocument(TABLES.FLIGHTS, data),
  get: <T>(id: string) => getDocument<T>(TABLES.FLIGHTS, id),
  list: <T>(options = {}) => listDocuments<T>(TABLES.FLIGHTS, options),
  update: <T>(id: string, data: Partial<T>) => updateDocument<T>(TABLES.FLIGHTS, id, data),
  delete: (id: string) => deleteDocument(TABLES.FLIGHTS, id),
  search: <T>(fields: string[], term: string, options = {}) => 
    searchDocuments<T>(TABLES.FLIGHTS, fields, term, options)
};

export const Locations = {
  create: <T>(data: T) => createDocument(TABLES.LOCATIONS, data),
  get: <T>(id: string) => getDocument<T>(TABLES.LOCATIONS, id),
  list: <T>(options = {}) => listDocuments<T>(TABLES.LOCATIONS, options),
  update: <T>(id: string, data: Partial<T>) => updateDocument<T>(TABLES.LOCATIONS, id, data),
  delete: (id: string) => deleteDocument(TABLES.LOCATIONS, id)
};

export const Airlines = {
  create: <T>(data: T) => createDocument(TABLES.AIRLINES, data),
  get: <T>(id: string) => getDocument<T>(TABLES.AIRLINES, id),
  list: <T>(options = {}) => listDocuments<T>(TABLES.AIRLINES, options),
  update: <T>(id: string, data: Partial<T>) => updateDocument<T>(TABLES.AIRLINES, id, data),
  delete: (id: string) => deleteDocument(TABLES.AIRLINES, id)
};

export const Bookings = {
  create: <T>(data: T) => createDocument(TABLES.BOOKINGS, data),
  get: <T>(id: string) => getDocument<T>(TABLES.BOOKINGS, id),
  list: <T>(options = {}) => listDocuments<T>(TABLES.BOOKINGS, options),
  update: <T>(id: string, data: Partial<T>) => updateDocument<T>(TABLES.BOOKINGS, id, data),
  delete: (id: string) => deleteDocument(TABLES.BOOKINGS, id),
  forUser: <T>(userId: string, options = {}) => listDocuments<T>(TABLES.BOOKINGS, {
    ...options,
    filters: [{ field: 'user_id', value: userId, type: 'eq' }]
  })
};
