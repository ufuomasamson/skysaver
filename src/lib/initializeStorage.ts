import { createServerSupabaseClient, STORAGE_BUCKETS } from '@/lib/supabaseClient';

/**
 * Initialize storage buckets and permissions.
 * This should be run during app deployment or first setup.
 */
export async function initializeStorage() {
  try {
    console.log('Initializing storage buckets and folders...');
    
    // Get server Supabase client
    const supabase = createServerSupabaseClient();
    
    // Check if main bucket exists and create if not
    console.log(`Checking for main bucket: ${STORAGE_BUCKETS.MAIN_BUCKET}`);
    
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    // Check if our main bucket exists
    const mainBucket = buckets.find(bucket => bucket.name === STORAGE_BUCKETS.MAIN_BUCKET);
    
    if (!mainBucket) {
      console.log(`Creating main bucket: ${STORAGE_BUCKETS.MAIN_BUCKET}`);
      
      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(
        STORAGE_BUCKETS.MAIN_BUCKET,
        {
          public: true, // Make the bucket publicly accessible
          fileSizeLimit: 10485760 // 10MB limit
        }
      );
      
      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      
      console.log(`Created main bucket: ${STORAGE_BUCKETS.MAIN_BUCKET}`);
    } else {
      console.log(`Main bucket already exists: ${STORAGE_BUCKETS.MAIN_BUCKET}`);
      
      // Update bucket to ensure it's public
      const { error: updateError } = await supabase.storage.updateBucket(
        STORAGE_BUCKETS.MAIN_BUCKET,
        {
          public: true,
          fileSizeLimit: 10485760 // 10MB limit
        }
      );
      
      if (updateError) {
        throw new Error(`Failed to update bucket: ${updateError.message}`);
      }
    }
    
    // Create folders for our different storage needs
    const folders = [
      'airline_logos',
      'payment_proofs',
      'tickets',
      'qr_codes',
      'crypto_wallets'
    ];
    
    // We create empty "marker" files in each folder to ensure the folders exist
    for (const folder of folders) {
      console.log(`Creating folder: ${folder}`);
      
      // Use a .keep file to maintain the folder structure
      const { error: folderError } = await supabase.storage
        .from(STORAGE_BUCKETS.MAIN_BUCKET)
        .upload(`${folder}/.keep`, new Uint8Array(0), {
          contentType: 'text/plain',
          upsert: true
        });
        
      if (folderError && folderError.message !== 'The resource already exists') {
        throw new Error(`Failed to create folder ${folder}: ${folderError.message}`);
      }
    }
    
    console.log('Storage initialization complete!');
    return {
      success: true,
      bucketName: STORAGE_BUCKETS.MAIN_BUCKET,
      folders
    };
  } catch (error: any) {
    console.error('Storage initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
