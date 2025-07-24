import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, STORAGE_BUCKETS } from '@/lib/supabaseClient';

/**
 * API handler for getting a list of files in a storage bucket folder
 */
export async function GET(request: NextRequest) {
  try {
    // Get folder parameter from query string
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder');
    
    if (!folder) {
      return NextResponse.json(
        { error: 'Folder parameter is required' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // List files in the specified folder
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .list(folder, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });
      
    if (error) {
      console.error('Error listing files:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Process the file data
    const files = data
      .filter(item => !item.id.endsWith('/'))  // Filter out folders
      .map(item => {
        // Get the file URL
        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKETS.MAIN_BUCKET)
          .getPublicUrl(`${folder}/${item.name}`);
          
        return {
          name: item.name,
          path: `${folder}/${item.name}`,
          size: item.metadata?.size || 0,
          type: item.metadata?.mimetype || 'application/octet-stream',
          url: urlData.publicUrl,
          createdAt: item.created_at
        };
      });
    
    return NextResponse.json({ files });
    
  } catch (error: any) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * API handler for deleting a file from storage
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { filePath } = body;
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Delete the file
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Storage API error:', error);
    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
