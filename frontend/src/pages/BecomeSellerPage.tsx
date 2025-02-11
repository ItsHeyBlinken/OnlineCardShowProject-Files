import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const BecomeSellerPage = () => {
  const { checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    storeName: '',
    description: '',
    contactEmail: '',
    selectedTier: 'Basic'
  });
  const history = useHistory();
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/become-seller', {
        ...formData,
        subscriptionTier: formData.selectedTier
      });
      
      if (formData.selectedTier !== 'Basic') {
        history.push('/subscription/checkout', { 
          tier: formData.selectedTier 
        });
      } else {
        history.push('/seller/dashboard');
      }
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Become a Seller
          </h1>
          {error && (
            <div className="mb-4 text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Your Subscription Tier
              </label>
              <select
                name="selectedTier"
                value={formData.selectedTier}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Basic">Basic - Free</option>
                <option value="Starter">Starter - $50/month</option>
                <option value="Pro">Pro - $100/month</option>
                <option value="Premium">Premium - $300/month</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                You can upgrade your subscription at any time from your seller dashboard
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {formData.selectedTier === 'Basic' ? 'Create Seller Account' : 'Continue to Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeSellerPage; 