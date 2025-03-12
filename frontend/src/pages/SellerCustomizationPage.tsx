import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStoreCustomization, StoreCustomization } from '../hooks/useStoreCustomization';
import { handleApiError } from '../utils/errorHandler';
import ImageWithFallback from '../components/common/ImageWithFallback';
import BackToDashboardButton from '../components/common/BackToDashboardButton';
import { User } from '../types';

type SubscriptionTier = 'Free' | 'Basic' | 'Pro' | 'Premium';

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  Free: ['bannerImage', 'colorMode', 'storeBio', 'storeLogo'],
  Basic: ['bannerImage', 'colorMode', 'storeBio', 'storeLogo'],
  Pro: [
    'bannerImage', 'colorMode', 'storeBio', 'storeLogo',
    'viewMode', 'backgroundColor', 'welcomeMessage', 'socialLinks'
  ],
  Premium: [
    'bannerImage', 'colorMode', 'storeBio', 'storeLogo',
    'viewMode', 'backgroundColor', 'welcomeMessage', 'socialLinks',
    'backgroundImage', 'featuredProducts', 'customColors'
  ]
};

export const SellerCustomizationPage = () => {
  const { user } = useAuth();
  
  // Use a default tier if user is null or subscriptionTier is not set
  const userTier = (user?.subscriptionTier as SubscriptionTier) || 'Free';
  
  // Get storeId from user object with fallback to empty string
  const storeId = user?.storeId || '';
  
  const { customization, updateCustomization, loading, error } = useStoreCustomization(storeId);
  const [, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async (updates: Partial<typeof customization>) => {
    if (!customization) return;
    
    try {
      setSaving(true);
      await updateCustomization(updates as Partial<StoreCustomization>);
      setSuccessMessage('Changes saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving customization:', handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading store customization...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackToDashboardButton />
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Store Customization</h1>
          
          {/* Store Logo */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Store Logo</h2>
            <ImageWithFallback
              src={customization?.storeLogo}
              fallbackSrc="/default-store-logo.png"
              alt="Store Logo"
              className="w-32 h-32 rounded-lg object-cover mb-2"
            />
            {/* Logo upload controls */}
          </div>

          {/* Banner Image */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Banner Image</h2>
            <ImageWithFallback
              src={customization?.bannerImage}
              fallbackSrc="/default-banner.png"
              alt="Store Banner"
              className="w-full h-48 rounded-lg object-cover mb-2"
            />
            {/* Banner upload controls */}
          </div>

          {/* Color Mode Selection */}
          {TIER_FEATURES[userTier].includes('colorMode') && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Color Theme</h2>
              <select
                value={customization?.colorMode}
                onChange={(e) => handleSave({ colorMode: e.target.value as 'light' | 'dark' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>
          )}

          {/* Custom Colors - Premium Only */}
          {TIER_FEATURES[userTier].includes('customColors') && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Custom Colors</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(customization?.customColors || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleSave({
                        customColors: {
                          ...(customization?.customColors || {}),
                          [key]: e.target.value
                        }
                      })}
                      className="w-full h-10 p-1 rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {TIER_FEATURES[userTier].includes('socialLinks') && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Social Links</h2>
              {Object.entries(customization?.socialLinks || {}).map(([platform, url]) => (
                <div key={platform} className="mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleSave({
                      socialLinks: {
                        ...(customization?.socialLinks || {}),
                        [platform]: e.target.value
                      }
                    })}
                    className="w-full p-2 border rounded-md"
                    placeholder={`Enter your ${platform} URL`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SellerCustomizationPage;
