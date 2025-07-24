import { NextResponse } from 'next/server';
import { initAppwrite, handleAppwriteError } from '@/lib/appwriteUtils';
import * as documentService from '@/lib/documentService';

/**
 * Unified API route to create documents in any collection
 * POST /api/appwrite/documents
 * 
 * Request body format:
 * {
 *   "collection": "flights",  // Collection name (matches function name without 'create' prefix)
 *   "data": {                 // Document data
 *     // Fields specific to the collection
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const { collection, data } = await request.json();
    
    if (!collection || !data) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: collection, data'
        },
        { status: 400 }
      );
    }
    
    // Map collection name to the corresponding document creation function
    const functionName = `create${collection.charAt(0).toUpperCase() + collection.slice(1)}`;
    const createFunction = (documentService as any)[functionName];
    
    if (!createFunction || typeof createFunction !== 'function') {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid collection: ${collection}`
        },
        { status: 400 }
      );
    }
    
    // Initialize Appwrite services
    const { databases } = initAppwrite();
    
    // Create document using the appropriate function
    const result = await createFunction(databases, data);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `${collection} document created successfully`,
      data: result
    });
  } catch (error: any) {
    // Handle Appwrite errors
    const errorResponse = handleAppwriteError(error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: errorResponse.message,
        type: errorResponse.type
      },
      { status: errorResponse.status }
    );
  }
}
