import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const ForceSellerPage: React.FC = () => {
  const { user, checkAuth } = useAuth();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const becomeSellerDirectly = async () => {
    if (!user?.id) {
      setError('No user is logged in');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      addLog(`Starting to update user ${user.id} to seller role`);
      
      // Call our direct test endpoint
      const response = await axios.post('/api/webhooks/test-set-seller-role', {
        userId: user.id
      });
      addLog(`Response from server: ${JSON.stringify(response.data)}`);
      
      // Update auth context
      addLog('Refreshing authentication...');
      await checkAuth();
      
      setSuccess(`Successfully updated user role to seller! Response: ${JSON.stringify(response.data)}`);
      addLog('Success! User role updated to seller');
      
      // Redirect to seller dashboard after a delay
      setTimeout(() => {
        history.push('/seller/dashboard');
      }, 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to update role: ${errorMsg}`);
      addLog(`Error: ${errorMsg}`);
      if (err.response?.data) {
        addLog(`Error details: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Debug: Force Seller Role</h2>
          <p className="mb-4 text-gray-600">
            This page is for debugging purposes. It will directly update your account to have seller permissions.
          </p>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium">Current user:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm mt-2 overflow-auto max-h-40">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
              {success}
            </div>
          )}
          
          <button
            onClick={becomeSellerDirectly}
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? 'Processing...' : 'Force Update to Seller Role'}
          </button>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Logs:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForceSellerPage; 