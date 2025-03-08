import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface ProfileImageUploadProps {
  currentImageUrl: string | null;
  onImageSelected: (file: File) => void;
  className?: string;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  onImageSelected,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const [error, setError] = useState<string | null>(null);
  
  // Update preview URL when currentImageUrl prop changes
  useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (200KB limit)
      if (file.size > 200 * 1024) {
        setError('Image is too large. Maximum size is 200KB.');
        return;
      }
      
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JPEG, PNG, or WebP image.');
        return;
      }
      
      // Set selected file and pass it to parent component
      setSelectedFile(file);
      onImageSelected(file);
      
      // Create preview URL
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-4">
        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200">
          <img 
            src={previewUrl || '/images/logo1.jpg'} 
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="profile-image-input"
          />
          <div className="flex space-x-2">
            <label 
              htmlFor="profile-image-input"
              className="inline-block px-3 py-2 bg-indigo-600 text-white text-sm rounded-md cursor-pointer hover:bg-indigo-700"
            >
              Select Image
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP up to 200KB</p>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProfileImageUpload; 