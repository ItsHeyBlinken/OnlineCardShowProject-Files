import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const defaultImage = '/images/logo1.jpg';

export const ProfilePage = () => {
  const { user, loading, checkAuth, login } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerFormData, setSellerFormData] = useState({
    businessName: user?.name || '',
    description: ''
  });
  const [preferences, setPreferences] = useState({
    favoriteSport: user?.favoriteSport || '',
    favoriteTeam: user?.favoriteTeam || '',
    favoritePlayers: user?.favoritePlayers || '',
  });
  console.log('User data with created_at:', user);

  // Format date helper function
  const formatDate = (dateString: string | null | undefined) => {
    console.log('Formatting date:', dateString);
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Add this to check the auth token
  useEffect(() => {
    // Set up axios interceptor
    const interceptor = axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Clean up interceptor on component unmount
    return () => {
        axios.interceptors.request.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    console.log('Current user data:', user);
  }, [user]);

  const handleSellerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSellerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBecomeSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        setError('');
        setSuccess('');
        
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You must be logged in to become a seller.');
            return;
        }

        const response = await axios.post(
            '/api/auth/become-seller', 
            {
                ...sellerFormData,
                userId: user?.id
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Seller registration response:', response.data);
        
        if (response.data.user) {
            console.log('Updated user data:', response.data.user);
            // Assuming login function requires two arguments: user and token
            await login(response.data.user, token);
            
            // Force a refresh of the auth context
            await checkAuth();
            setSuccess('Successfully became a seller!');
            setShowSellerForm(false);
            
            // Force a page refresh after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    } catch (error: any) {
        console.error('Error during seller registration:', error.response || error);
        if (error.response?.status === 401) {
            setError('Your session has expired. Please log in again.');
        } else {
            setError(error.response?.data?.message || 'Error becoming a seller. Please try again.');
        }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({
      ...preferences,
      [e.target.name]: e.target.value,
    });
  };

  const handleSavePreferences = async () => {
    if (!user) {
      console.error('User is not logged in or user data is not available.');
      return;
    }
    try {
      await axios.put(`/api/users/${user.id}/preferences`, preferences);
      // Optionally show a success message
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Please sign up to continue</h2>
        <Link 
          to="/signup"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}</h1>
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Your Profile</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={user?.image_url || defaultImage}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile Picture</p>
                  {/* Add photo upload button later */}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name || 'N/A'}</dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email || 'N/A'}</dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user?.created_at)}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user?.role === 'seller' ? 'Seller Account' : 'Buyer Account'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Add Seller Dashboard Button for sellers */}
          {user?.role === 'seller' && (
            <div className="mt-6">
              <Link 
                to="/seller/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Seller Dashboard
              </Link>
            </div>
          )}

          {user.role === 'buyer' && (
            <div className="mt-8 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Become a Seller
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Upgrade your account to start selling cards on our platform.</p>
                </div>
                
                {!showSellerForm ? (
                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setShowSellerForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Start Seller Application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBecomeSeller} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <input
                        type="text"
                        name="businessName"
                        value={sellerFormData.businessName}
                        onChange={handleSellerFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        value={sellerFormData.description}
                        onChange={handleSellerFormChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        placeholder="Tell us about your business and what you plan to sell..."
                        required
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Submit Application
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSellerForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
                {success && (
                  <p className="mt-2 text-sm text-green-600">{success}</p>
                )}
              </div>
            </div>
          )}

          {/* Preferences Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Favorite Sport</label>
              <input
                type="text"
                name="favoriteSport"
                value={preferences.favoriteSport}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Favorite Team</label>
              <input
                type="text"
                name="favoriteTeam"
                value={preferences.favoriteTeam}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Favorite Player(s)</label>
              <input
                type="text"
                name="favoritePlayers"
                value={preferences.favoritePlayers}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="mt-4">
              <button
                onClick={handleSavePreferences}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Preferences
              </button>
            </div>
          </div>

          {/* Order History Button */}
          <div className="mt-5">
            <Link to="/order-history">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                View Order History
              </button>
            </Link>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Existing navigation items */}

              {/* Messages Link */}
              <Link
                to="/inbox"
                className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors"
              >
                <h3 className="text-lg font-medium text-gray-900">Messages</h3>
                <p className="mt-2 text-sm text-gray-500">
                  View your conversations with buyers and sellers
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};