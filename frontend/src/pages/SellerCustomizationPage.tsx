import React from 'react';
// Removed unused imports
import { Button } from '../components/ui/Button'; // Corrected import path
import { Input } from '../components/ui/Input'; // Corrected import path
import axios from 'axios';

export const SellerCustomizationPage = () => {
  const [formData, setFormData] = React.useState({
    storeName: '',
    storeDescription: '',
    logoUrl: '',
    bannerUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('/api/store/customize', formData);
      // Handle success
    } catch (error) {
      console.error('Error customizing store:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Customize Your Store</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Name</label>
            <Input
              value={formData.storeName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, storeName: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Store Description</label>
            <textarea
              value={formData.storeDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, storeDescription: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
            <Input
              value={formData.logoUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, logoUrl: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Banner URL</label>
            <Input
              value={formData.bannerUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bannerUrl: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
};