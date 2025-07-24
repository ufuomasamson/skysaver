import { supabase, STORAGE_BUCKETS } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Base storage helper for all file operations
 */
export const storageHelper = {
  /**
   * Upload a file to a specific folder in the main bucket
   * @param folder The folder path within the bucket
   * @param file The file to upload
   * @param customFileName Optional custom file name
   * @returns The file path and URL
   */
  uploadFile: async (folder: string, file: File, customFileName?: string): Promise<{ path: string; url: string }> => {
    // Create a unique file name if not provided
    const fileExt = file.name.split('.').pop();
    const fileName = customFileName || `${uuidv4()}.${fileExt}`;
    
    // Construct the file path with folder
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .getPublicUrl(filePath);
    
    return {
      path: data.path,
      url: urlData.publicUrl
    };
  },
  
  /**
   * Get the public URL for a file
   * @param filePath The path of the file in storage
   * @returns The public URL
   */
  getFileUrl: (filePath: string): string => {
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  },
  
  /**
   * Delete a file from storage
   * @param filePath The path of the file to delete
   */
  deleteFile: async (filePath: string): Promise<void> => {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
  
  /**
   * List files in a folder
   * @param folderPath The folder path to list
   * @returns Array of file information
   */
  listFiles: async (folderPath: string): Promise<Array<{ name: string; path: string; size: number; type: string }>> => {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MAIN_BUCKET)
      .list(folderPath, {
        sortBy: { column: 'name', order: 'asc' }
      });
      
    if (error) {
      console.error('Error listing files:', error);
      throw error;
    }
    
    return data
      .filter(item => !item.id.endsWith('/')) // Filter out folders
      .map(item => ({
        name: item.name,
        path: `${folderPath}/${item.name}`,
        size: item.metadata?.size || 0,
        type: item.metadata?.mimetype || 'application/octet-stream'
      }));
  }
};

/**
 * Airlines Logo Storage Service
 */
export const AirlineLogoStorage = {
  /**
   * Upload an airline logo
   * @param file The logo file (image)
   * @param airlineId Airline identifier for the filename
   * @returns The file path and URL
   */
  upload: async (file: File, airlineId: string): Promise<{ path: string; url: string }> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for airline logos');
    }
    
    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    
    // Create a sanitized filename
    const fileName = `${airlineId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExt}`;
    
    return await storageHelper.uploadFile('airline_logos', file, fileName);
  },
  
  /**
   * Get an airline logo URL
   * @param filePath The path of the logo file
   * @returns The public URL
   */
  getUrl: (filePath: string): string => {
    return storageHelper.getFileUrl(filePath);
  },
  
  /**
   * Delete an airline logo
   * @param filePath The path of the logo file
   */
  delete: async (filePath: string): Promise<void> => {
    await storageHelper.deleteFile(filePath);
  },
  
  /**
   * List all airline logos
   * @returns Array of airline logo information
   */
  list: async (): Promise<Array<{ name: string; path: string; size: number; type: string }>> => {
    return await storageHelper.listFiles('airline_logos');
  }
};

/**
 * Payment Proof Storage Service
 */
export const PaymentProofStorage = {
  /**
   * Upload a payment proof image
   * @param file The proof image file
   * @param paymentId Payment identifier for the filename
   * @returns The file path and URL
   */
  upload: async (file: File, paymentId: string): Promise<{ path: string; url: string }> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for payment proofs');
    }
    
    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    
    // Create a sanitized filename with timestamp to avoid conflicts
    const fileName = `payment-${paymentId}-${Date.now()}.${fileExt}`;
    
    return await storageHelper.uploadFile('payment_proofs', file, fileName);
  },
  
  /**
   * Get a payment proof image URL
   * @param filePath The path of the image file
   * @returns The public URL
   */
  getUrl: (filePath: string): string => {
    return storageHelper.getFileUrl(filePath);
  },
  
  /**
   * Delete a payment proof image
   * @param filePath The path of the image file
   */
  delete: async (filePath: string): Promise<void> => {
    await storageHelper.deleteFile(filePath);
  },
  
  /**
   * List payment proofs for a specific payment
   * @param paymentId The payment ID to filter by
   * @returns Array of payment proof information
   */
  listForPayment: async (paymentId: string): Promise<Array<{ name: string; path: string; size: number; type: string }>> => {
    const allFiles = await storageHelper.listFiles('payment_proofs');
    return allFiles.filter(file => file.name.includes(`payment-${paymentId}-`));
  }
};

/**
 * QR Code Storage Service for Crypto Wallet Setup
 */
export const CryptoQRCodeStorage = {
  /**
   * Upload a QR code image for crypto wallet
   * @param file The QR code image file
   * @param walletId Wallet identifier for the filename
   * @returns The file path and URL
   */
  upload: async (file: File, walletId: string): Promise<{ path: string; url: string }> => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for QR codes');
    }
    
    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    
    // Create a sanitized filename
    const fileName = `wallet-${walletId}.${fileExt}`;
    
    return await storageHelper.uploadFile('crypto_wallets', file, fileName);
  },
  
  /**
   * Generate a QR code image from data (text/URL) and upload it
   * @param walletId Wallet identifier for the filename
   * @param qrData The data to encode in the QR code
   * @returns The file path and URL
   */
  generateAndUpload: async (walletId: string, qrData: string): Promise<{ path: string; url: string }> => {
    // This would typically use a QR code generation library
    // Since we can't install new packages in this context, this is a placeholder
    // In a real implementation, you would:
    // 1. Use a library like qrcode to generate a QR code image
    // 2. Convert the image to a File object
    // 3. Upload using the upload method
    
    throw new Error('QR code generation requires additional libraries. Please implement with appropriate QR code generation package.');
  },
  
  /**
   * Get a QR code image URL
   * @param filePath The path of the QR code file
   * @returns The public URL
   */
  getUrl: (filePath: string): string => {
    return storageHelper.getFileUrl(filePath);
  },
  
  /**
   * Delete a QR code image
   * @param filePath The path of the QR code file
   */
  delete: async (filePath: string): Promise<void> => {
    await storageHelper.deleteFile(filePath);
  }
};

/**
 * Functions for handling file uploads from forms
 */
export const FileUploadHandler = {
  /**
   * Handle file input change event
   * @param event The file input change event
   * @param options Upload options including destination folder and validation
   * @returns The uploaded file information or null if no file selected
   */
  handleFileChange: async (
    event: React.ChangeEvent<HTMLInputElement>,
    options: {
      folder: string;
      maxSizeMB?: number;
      allowedTypes?: string[];
      fileName?: string;
    }
  ): Promise<{ path: string; url: string } | null> => {
    const file = event.target.files?.[0];
    if (!file) return null;
    
    // Validate file size
    if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
      throw new Error(`File size exceeds the maximum allowed size (${options.maxSizeMB}MB)`);
    }
    
    // Validate file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const fileType = file.type.toLowerCase();
      if (!options.allowedTypes.some(type => fileType.includes(type.toLowerCase()))) {
        throw new Error(`File type not allowed. Accepted types: ${options.allowedTypes.join(', ')}`);
      }
    }
    
    // Upload the file
    return await storageHelper.uploadFile(options.folder, file, options.fileName);
  }
};

export default {
  AirlineLogoStorage,
  PaymentProofStorage,
  CryptoQRCodeStorage,
  FileUploadHandler
};
