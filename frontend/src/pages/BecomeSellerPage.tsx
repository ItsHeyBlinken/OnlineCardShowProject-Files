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
        const token = localStorage.getItem('token');
        const response = await axios.post(
            '/api/auth/become-seller',
            formData,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.data) {
            localStorage.setItem('token', response.data.token);
            await checkAuth();
            
            setTimeout(() => {
                history.push('/seller/dashboard');
            }, 100);
        }
    } catch (error) {
        console.error('Error becoming seller:', error);
        setError('Failed to become a seller. Please try again.');
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

            <div>
              <Button type="submit" variant="primary" size="md">
                Register as Seller
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeSellerPage; 