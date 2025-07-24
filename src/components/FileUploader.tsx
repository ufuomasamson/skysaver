'use client';

import { useState } from 'react';
import { AirlineLogoStorage, PaymentProofStorage, CryptoQRCodeStorage } from '@/lib/storageServices';

interface FileUploaderProps {
  type: 'airlineLogo' | 'paymentProof' | 'cryptoQRCode';
  id: string;
  onUploadComplete?: (result: { path: string; url: string }) => void;
  onError?: (error: Error) => void;
  buttonLabel?: string;
  className?: string;
}

export default function FileUploader({
  type,
  id,
  onUploadComplete,
  onError,
  buttonLabel = 'Upload File',
  className = ''
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      let result;

      switch (type) {
        case 'airlineLogo':
          result = await AirlineLogoStorage.upload(file, id);
          break;
        case 'paymentProof':
          result = await PaymentProofStorage.upload(file, id);
          break;
        case 'cryptoQRCode':
          result = await CryptoQRCodeStorage.upload(file, id);
          break;
      }

      setUploadedUrl(result.url);
      onUploadComplete?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`file-uploader ${className}`}>
      <div className="flex items-center space-x-4">
        <label className="relative cursor-pointer">
          <span className={`inline-block px-4 py-2 rounded-md ${isUploading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}>
            {isUploading ? 'Uploading...' : buttonLabel}
          </span>
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={type === 'airlineLogo' || type === 'paymentProof' || type === 'cryptoQRCode' ? 'image/*' : undefined}
            disabled={isUploading}
          />
        </label>
        
        {uploadedUrl && (
          <button
            type="button"
            onClick={() => window.open(uploadedUrl, '_blank')}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            View File
          </button>
        )}
      </div>

      {uploadedUrl && type !== 'cryptoQRCode' && (
        <div className="mt-2">
          {type === 'airlineLogo' || type === 'paymentProof' ? (
            <img
              src={uploadedUrl}
              alt="Uploaded file preview"
              className="max-h-32 mt-2 rounded border border-gray-200"
            />
          ) : (
            <div className="text-sm text-green-600 mt-2">
              ✓ File uploaded successfully
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 mt-2">
          Error: {error}
        </div>
      )}
    </div>
  );
}
