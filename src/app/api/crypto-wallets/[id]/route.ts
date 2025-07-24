import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, TABLES } from '@/lib/supabaseClient';

// DELETE: Remove a crypto wallet by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Invalid wallet ID" }, { status: 400 });
    }
    
    // Delete the crypto wallet
    const { error } = await supabase
      .from(TABLES.CRYPTO_WALLETS)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Failed to delete crypto wallet:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete crypto wallet',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Crypto wallet deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting crypto wallet:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete crypto wallet',
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
