import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const ListingsPage = () => {
  const { user, checkAuth } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBecomeSeller = async () => {
    try {
      setError('');
      setSuccess('');
      
      await axios.post('/api/auth/become-seller');
      setSuccess('Successfully became a seller!');
      
      // Refresh user data to get updated role
      await checkAuth();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error becoming a seller');
      console.error('Error during seller registration:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {user?.role === 'buyer' && (
          <div className="bg-white shadow sm:rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Become a Seller
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Start selling your cards by upgrading to a seller account.</p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleBecomeSeller}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upgrade to Seller
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
              {success && (
                <p className="mt-2 text-sm text-green-600">{success}</p>
              )}
            </div>
          </div>
        )}

        {/* Add your listings content here */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              {user?.role === 'seller' ? 'Your Listings' : 'Available Cards'}
            </h2>
            {/* Add your listings grid/table here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;
