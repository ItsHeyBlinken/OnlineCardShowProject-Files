import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ProfileImageUpload from '../common/ProfileImageUpload';

interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  role: string;
  image_url: string | null;
  favoriteSport?: string | null;
  favoriteTeam?: string | null;
  favoritePlayers?: string | null;
}

interface UserProfileEditProps {
  onProfileUpdated?: () => void;
  onCancel?: () => void;
}

const UserProfileEdit: React.FC<UserProfileEditProps> = ({ 
  onProfileUpdated, 
  onCancel 
}) => {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    favoriteSport: user?.favoriteSport || '',
    favoriteTeam: user?.favoriteTeam || '',
    favoritePlayers: user?.favoritePlayers || '',
  });
  
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(user?.image_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageSelected = (file: File) => {
    console.log('Image selected:', file.name);
    setSelectedProfileImage(file);
  };

  const uploadProfileImage = async () => {
    if (!selectedProfileImage) return null;
    
    console.log('Starting profile image upload...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const formData = new FormData();
      formData.append('profileImage', selectedProfileImage);
      
      // Log the form data for debugging
      console.log('Form data prepared:', selectedProfileImage.name, selectedProfileImage.size, selectedProfileImage.type);
      
      const response = await axios.post('/api/images/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Image upload response:', response.data);
      
      // Check if response contains imageUrl
      if (response.data && response.data.imageUrl) {
        const imageUrl = response.data.imageUrl;
        console.log('Received image URL:', imageUrl);
        
        // Add a timestamp to prevent browser caching
        const imageUrlWithTimestamp = `${imageUrl}?t=${new Date().getTime()}`;
        console.log('Final image URL with timestamp:', imageUrlWithTimestamp);
        return imageUrlWithTimestamp;
      } else {
        console.error('Server response missing imageUrl:', response.data);
        throw new Error('Server returned an invalid response');
      }
    } catch (error) {
      console.error('Profile image upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('Submit started, selected image:', selectedProfileImage ? selectedProfileImage.name : 'none');

    try {
      const token = localStorage.getItem('token');
      if (!token || !user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // 1. First upload the image if one was selected
      let newImageUrl = imageUrl;
      if (selectedProfileImage) {
        console.log('Uploading profile image to S3...');
        try {
          const formData = new FormData();
          formData.append('profileImage', selectedProfileImage);
          
          const response = await axios.post('/api/images/profile', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('S3 image upload response:', response.data);
          
          if (response.data && response.data.success && response.data.imageUrl) {
            newImageUrl = response.data.imageUrl;
            console.log('Image uploaded successfully to S3, URL:', newImageUrl);
            
            // The image_url is already saved in the database by the backend
            // No need to include it in the profile update below
          } else {
            throw new Error(response.data?.message || 'Server returned an invalid response');
          }
        } catch (uploadError) {
          console.error('Failed to upload image to S3:', uploadError);
          setError('Failed to upload profile image. Please try again.');
          setLoading(false);
          return;
        }
      } else {
        console.log('No new image selected, using existing URL:', newImageUrl);
      }

      // 2. Update other profile data
      console.log('Updating profile data...');
      
      // Create a profile update payload
      interface ProfileData {
        name: string;
        username: string;
        favorite_sport: string;
        favorite_team: string;
        favorite_players: string;
      }
      
      // Note: We don't need to send image_url here because it's already updated by the image upload endpoint
      const profileData: ProfileData = {
        name: formData.name,
        username: formData.username,
        favorite_sport: formData.favoriteSport,
        favorite_team: formData.favoriteTeam,
        favorite_players: formData.favoritePlayers
      };
      
      console.log('Profile update payload:', profileData);
      
      // Make a single update request with all profile data
      const profileResponse = await axios.put('/api/auth/profile', profileData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile update response:', profileResponse.data);

      setSuccess('Profile updated successfully');
      setImageUrl(newImageUrl); // Update the local state with the new image URL from S3
      
      // Refresh auth context to get updated user data
      console.log('Refreshing user data...');
      await checkAuth();
      
      // Call the callback if provided
      if (onProfileUpdated) {
        onProfileUpdated();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}
      
      {/* Profile Image Upload */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Profile Picture</label>
        <ProfileImageUpload 
          currentImageUrl={imageUrl} 
          onImageSelected={handleImageSelected}
        />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {/* Username */}
            <div>
              <label className="block text-gray-700 mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled  // Email should not be editable for security reasons
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>
        </div>
        
        {/* Preferences Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Favorite Sport */}
            <div>
              <label className="block text-gray-700 mb-1">Favorite Sport</label>
              <input
                type="text"
                name="favoriteSport"
                value={formData.favoriteSport || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Favorite Team */}
            <div>
              <label className="block text-gray-700 mb-1">Favorite Team</label>
              <input
                type="text"
                name="favoriteTeam"
                value={formData.favoriteTeam || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Favorite Players */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-1">Favorite Players</label>
              <input
                type="text"
                name="favoritePlayers"
                value={formData.favoritePlayers || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Separate multiple players with commas"
              />
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserProfileEdit; 