import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const ManageSubscriptionTest: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const history = useHistory();
  const [userId, setUserId] = useState<string>(user?.id.toString() || '');
  const [tier, setTier] = useState<string>('Starter');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const activateSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/webhooks/test-activate-subscription', {
        userId: parseInt(userId),
        tier
      });
      
      setResult(response.data);
      alert(`Subscription activated: ${response.data.message}`);
      
      // Refresh auth context
      await checkAuth();
      
    } catch (err: any) {
      console.error('Error activating subscription:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deactivateSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post('/api/webhooks/test-deactivate-subscription', {
        userId: parseInt(userId)
      });
      
      setResult(response.data);
      alert(`Subscription deactivated: ${response.data.message}`);
      
      // Refresh auth context
      await checkAuth();
      
    } catch (err: any) {
      console.error('Error deactivating subscription:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Subscription Test Page</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Current User Info</h2>
            {user ? (
              <div className="bg-gray-50 p-4 rounded text-sm">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Subscription Tier:</strong> {user.subscriptionTier || 'Not set'}</p>
                <p><strong>Subscription ID:</strong> {user.subscription_id || 'Not set'}</p>
              </div>
            ) : (
              <p className="text-red-600">No user logged in</p>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Test Actions</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
                  Subscription Tier
                </label>
                <select
                  id="tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={activateSubscription}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {loading ? 'Processing...' : 'Activate Subscription'}
                </button>
                
                <button
                  onClick={deactivateSubscription}
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {loading ? 'Processing...' : 'Deactivate Subscription'}
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          {result && (
            <div className="mt-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Result:</h3>
              <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => history.push('/seller/dashboard')}
              className="text-indigo-600 hover:text-indigo-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSubscriptionTest; 