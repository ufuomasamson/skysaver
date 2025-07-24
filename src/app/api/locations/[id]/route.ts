import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

// DELETE: Remove a location by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }
    
    // Delete the location
    const { error } = await supabase
      .from(TABLES.LOCATIONS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete location:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete location',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete location',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

// PUT: Update a location by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    const { id } = await params;
    const data = await request.json();
    const { city, country } = data;
    
    if (!id) {
      return NextResponse.json({ error: "Invalid location ID" }, { status: 400 });
    }
    
    if (!city || !country) {
      return NextResponse.json({ error: 'City and Country are required' }, { status: 400 });
    }
    
    // Update the location
    const { data: updatedLocation, error } = await supabase
      .from(TABLES.LOCATIONS)
      .update({ city, country })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Failed to update location:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update location',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Location updated successfully',
      location: updatedLocation
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to update location',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
