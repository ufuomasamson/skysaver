import { NextResponse, NextRequest } from "next/server";
import { createServerSupabaseClient, TABLES, STORAGE_BUCKETS } from '@/lib/supabaseClient';

// POST: Add a new airline (with logo image upload)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    let logo_url = formData.get('logo_url');
    const logoFile = formData.get('logo');

    if (!name || (typeof name !== 'string')) {
      return NextResponse.json({ error: 'Missing airline name' }, { status: 400 });
    }

    // If a file is uploaded, save it to Supabase Storage
    if (logoFile && logoFile instanceof File) {
      // Create server-side Supabase client
      const supabase = createServerSupabaseClient();
      
      const fileExt = logoFile.name.split('.').pop() || 'png';
      const fileName = `airline_logo_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${STORAGE_BUCKETS.AIRLINE_LOGOS}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .upload(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''), logoFile);
      
      if (uploadError) {
        console.error('Error uploading airline logo:', uploadError);
        return NextResponse.json({ error: 'Failed to upload airline logo' }, { status: 500 });
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .getPublicUrl(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''));
      
      logo_url = urlData.publicUrl;
    } else if (typeof logo_url !== 'string') {
      logo_url = '';
    }

    // Create server-side Supabase client (if not already created above)
    const supabase = createServerSupabaseClient();
    
    // Insert airline data into Supabase
    const { data: airline, error } = await supabase
      .from(TABLES.AIRLINES)
      .insert({
        name,
        logo_url,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating airline:', error);
      return NextResponse.json({ error: 'Failed to add airline' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      airline
    });
  } catch (err) {
    console.error('Error adding airline:', err);
    return NextResponse.json({ error: "Failed to add airline", details: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Fetch airlines from Supabase
    const { data: airlines, error } = await supabase
      .from(TABLES.AIRLINES)
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(airlines || []);
  } catch (err) {
    console.error('Error fetching airlines:', err);
    return NextResponse.json({ error: "Failed to fetch airlines" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Airline ID is required" }, { status: 400 });
    }

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // First, get the airline to check if it has a logo to delete
    const { data: airline } = await supabase
      .from(TABLES.AIRLINES)
      .select('logo_url')
      .eq('id', id)
      .single();
    
    // If the airline has a logo in Supabase storage, delete it
    if (airline?.logo_url && airline.logo_url.includes(STORAGE_BUCKETS.MAIN_BUCKET)) {
      const storagePath = airline.logo_url.split('/').slice(-2).join('/');
      
      if (storagePath) {
        // Delete the logo file from storage
        await supabase.storage
          .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
          .remove([storagePath]);
      }
    }
    
    // Delete the airline record
    const { error } = await supabase
      .from(TABLES.AIRLINES)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting airline:', err);
    return NextResponse.json({ error: "Failed to delete airline" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Airline ID is required" }, { status: 400 });
    }

    const formData = await req.formData();
    const name = formData.get('name');
    let logo_url = formData.get('logo_url');
    const logoFile = formData.get('logo');

    if (!name || (typeof name !== 'string')) {
      return NextResponse.json({ error: 'Missing airline name' }, { status: 400 });
    }

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the current airline data
    const { data: currentAirline } = await supabase
      .from(TABLES.AIRLINES)
      .select('logo_url')
      .eq('id', id)
      .single();
    
    // If a file is uploaded, save it to Supabase Storage
    if (logoFile && logoFile instanceof File) {
      // Delete the old logo if it exists in Supabase storage
      if (currentAirline?.logo_url && currentAirline.logo_url.includes(STORAGE_BUCKETS.MAIN_BUCKET)) {
        const storagePath = currentAirline.logo_url.split('/').slice(-2).join('/');
        
        if (storagePath) {
          // Delete the logo file from storage
          await supabase.storage
            .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
            .remove([storagePath]);
        }
      }
      
      const fileExt = logoFile.name.split('.').pop() || 'png';
      const fileName = `airline_logo_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${STORAGE_BUCKETS.AIRLINE_LOGOS}/${fileName}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .upload(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''), logoFile);
      
      if (uploadError) {
        console.error('Error uploading airline logo:', uploadError);
        return NextResponse.json({ error: 'Failed to upload airline logo' }, { status: 500 });
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0])
        .getPublicUrl(filePath.replace(`${STORAGE_BUCKETS.MAIN_BUCKET.split('/')[0]}/`, ''));
      
      logo_url = urlData.publicUrl;
    } else if (typeof logo_url !== 'string') {
      logo_url = currentAirline?.logo_url || '';
    }

    // Update the airline record
    const { data: airline, error } = await supabase
      .from(TABLES.AIRLINES)
      .update({
        name,
        logo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating airline:', error);
      return NextResponse.json({ error: 'Failed to update airline' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      airline
    });
  } catch (err) {
    console.error('Error updating airline:', err);
    return NextResponse.json({ error: "Failed to update airline" }, { status: 500 });
  }
}
