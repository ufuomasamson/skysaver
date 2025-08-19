import { supabase, STORAGE_BUCKETS } from '@/lib/supabaseClient';

// Upload a file to a specific bucket
export async function uploadFile(
  bucketId: string,
  file: File,
  path?: string
): Promise<string> {
  // Generate a file path if not provided
  const filePath = path || `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  
  // Upload the file
  const { data, error } = await supabase.storage
    .from(bucketId)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    throw error;
  }
  
  // Return the file path
  return data.path;
}

// Get file view URL (for images, PDFs, etc.)
export function getFileView(bucketId: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucketId)
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}

// Get file download URL (same as view URL in Supabase)
export function getFileDownload(bucketId: string, filePath: string): string {
  return getFileView(bucketId, filePath);
}

// Delete a file
export async function deleteFile(bucketId: string, filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucketId)
    .remove([filePath]);
    
  if (error) {
    throw error;
  }
}

// List files in a bucket
export async function listFiles(
  bucketId: string,
  folderPath?: string
): Promise<Array<{ name: string, path: string, size: number, isFolder: boolean }>> {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .list(folderPath || '', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' }
    });
    
  if (error) {
    throw error;
  }
  
  return data.map(item => ({
    name: item.name,
    path: folderPath ? `${folderPath}/${item.name}` : item.name,
    size: item.metadata?.size || 0,
    isFolder: item.id === null
  }));
}

// Helper for uploading airline logos
export async function uploadAirlineLogo(file: File, airlineId: string) {
  return uploadFile(STORAGE_BUCKETS.AIRLINE_LOGOS, file, airlineId);
}

// Helper for getting airline logo URL
export function getAirlineLogoUrl(filePath: string) {
  return getFileView(STORAGE_BUCKETS.AIRLINE_LOGOS, filePath);
}

// Helper for uploading ticket PDF
export async function uploadTicket(file: File, ticketId: string) {
  return uploadFile(STORAGE_BUCKETS.TICKETS, file, ticketId);
}

// Helper for getting ticket download URL
export function getTicketDownloadUrl(filePath: string) {
  return getFileDownload(STORAGE_BUCKETS.TICKETS, filePath);
}

// Helper for uploading QR code
export async function uploadQrCode(file: File, bookingId: string) {
  return uploadFile(STORAGE_BUCKETS.QR_CODES, file, bookingId);
}

// Helper for getting QR code view URL
export function getQrCodeUrl(filePath: string) {
  return getFileView(STORAGE_BUCKETS.QR_CODES, filePath);
}
