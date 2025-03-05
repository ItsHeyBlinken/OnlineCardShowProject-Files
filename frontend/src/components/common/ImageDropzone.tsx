import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface ImageDropzoneProps {
  onImagesUploaded: (imageUrls: string[], tempListingId: string) => void;
  maxFiles?: number;
  listingId?: string;
}

interface UploadedImage {
  url: string;
  originalName: string;
  key: string;
}

interface UploadError {
  originalName: string;
  error: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  onImagesUploaded,
  maxFiles = 5,
  listingId
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter out files that exceed size limit (200KB)
    const validFiles = acceptedFiles.filter(file => file.size <= 200 * 1024);
    const oversizedFiles = acceptedFiles.filter(file => file.size > 200 * 1024);
    
    if (oversizedFiles.length > 0) {
      setErrors(prev => [
        ...prev,
        ...oversizedFiles.map(file => ({
          originalName: file.name,
          error: `File size exceeds 200KB limit. Current size: ${Math.round(file.size / 1024)}KB`
        }))
      ]);
    }
    
    // Limit to maxFiles
    const newFiles = [...files, ...validFiles].slice(0, maxFiles);
    setFiles(newFiles);
  }, [files, maxFiles]);

  // Configure dropzone
  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles,
    maxSize: 200 * 1024 // 200KB
  });

  // Generate previews whenever files change
  useEffect(() => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
    
    // Cleanup function to revoke object URLs
    return () => {
      newPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [files]);

  // Remove a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // Upload files to server
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setErrors([]);
    setUploadSuccess(false);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    if (listingId) {
      formData.append('listingId', listingId);
    }
    
    try {
      const response = await axios.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      if (response.data.success) {
        setUploadSuccess(true);
        onImagesUploaded(response.data.imageUrls, response.data.tempListingId);
      } else {
        setErrors([{ originalName: 'Upload', error: 'Failed to upload images' }]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrors([{ originalName: 'Upload', error: 'Server error during upload' }]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            stroke="currentColor" 
            fill="none" 
            viewBox="0 0 48 48" 
            aria-hidden="true"
          >
            <path 
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" 
              strokeWidth={2} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Drag and drop up to {maxFiles} images, or click to select files
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG, or WebP up to 200KB
          </p>
        </div>
      </div>

      {/* Preview area */}
      {previews.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700">Selected Images</h4>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="h-24 w-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={uploadFiles}
            disabled={isUploading}
            className={`px-4 py-2 rounded-md text-white ${
              isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}% Uploaded</p>
        </div>
      )}

      {/* Success message */}
      {uploadSuccess && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded-md">
          Images uploaded successfully!
        </div>
      )}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-red-700">Errors</h4>
          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
            {errors.map((error, index) => (
              <li key={index}>
                {error.originalName}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone; 