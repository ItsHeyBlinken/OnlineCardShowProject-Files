import React, { FC } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SubscriptionManagementPage: FC = () => {
  const history = useHistory();
  const { user } = useAuth();

  const handleUpgrade = () => {
    // Placeholder for future Stripe integration
    alert('Payment integration coming soon! This will redirect to Stripe payment.');
  };

  const getButtonText = (tier: string, currentTier: string) => {
    if (tier === currentTier) return null;
    if (tier === 'Basic') return 'Downgrade';
    return 'Upgrade';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-2 text-gray-600">Current Plan: {user?.subscriptionTier || 'Basic'}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
              <div className="mt-4 space-y-4">
                {['Basic', 'Starter', 'Pro', 'Premium'].map((tier) => (
                  <div key={tier} className="flex items-center justify-between p-4 bg-white rounded-md shadow-sm">
                    <div>
                      <h3 className="font-medium text-gray-900">{tier}</h3>
                      <p className="text-sm text-gray-500">
                        {tier === 'Basic' ? 'Free' : 
                         tier === 'Starter' ? '$50/month' :
                         tier === 'Pro' ? '$100/month' : '$300/month'}
                      </p>
                    </div>
                    {tier !== user?.subscriptionTier && tier !== 'Basic' && (
                      <button
                        onClick={handleUpgrade}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        {getButtonText(tier, user?.subscriptionTier || 'Basic')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Next billing date: Coming soon</p>
                <p>Payment method: Not configured</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                Note: Payment integration coming soon. Currently in development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage; 