import React, { FC, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import BackToDashboardButton from '../components/common/BackToDashboardButton';
import { loadStripe } from '@stripe/stripe-js';

// Price IDs from Stripe - Temporary test IDs
// These should be created in the same Stripe account as your API keys
const PRICE_IDS = {
  // You'll need to create these price IDs in your Stripe dashboard for each plan
  Starter: 'price_1R2IxRH9O7KWDH4lOEw2MHsS', // Needs to be updated to match your Stripe account
  Pro: 'price_1R2Iy8H9O7KWDH4loZlP1dAU',     // Needs to be updated to match your Stripe account
  Premium: 'price_1R2IydH9O7KWDH4llJwpAAV5'  // Needs to be updated to match your Stripe account
};

// Using the correct Stripe publishable key from backend .env
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51R1HJRH9O7KWDH4lcGYCxJthspPvAoqrdl95jcQOfbufPOdtSnogbHvQj2chG5OomemzCVDiv9uAIPxWsG5MgDQr00txM5Tv6L';

// Debug: check if environment variables are accessible
console.log('Environment variables:', {
  fromEnv: process.env.REACT_APP_STRIPE_PUBLIC_KEY,
  nodeEnv: process.env.NODE_ENV
});

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const SubscriptionManagementPage: FC = () => {
  const history = useHistory();
  const { user, getAuthHeaders, checkAuth } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loading, setLoading] = useState(false);
  
  // Function to refresh user data - only use when absolutely necessary
  const refreshUserData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await checkAuth();
      setIsLoading(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setIsLoading(false);
    }
  }, [checkAuth]);

  // Only refresh on initial component mount - no polling
  React.useEffect(() => {
    // Initial data load - REMOVED to prevent duplicate API calls
    // The AuthContext already makes this call when the component mounts
    
    // No polling mechanism
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array with ESLint disable - only runs once
  
  // Check if user is returning from a successful checkout
  React.useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const success = query.get('success');
    const cancelled = query.get('cancelled');
    
    if (success === 'true') {
      // Clear the URL parameters
      history.replace('/subscription-management');
      
      // Show success message
      alert('Your subscription has been successfully updated! The change will be reflected in your account shortly.');
      
      // Give webhooks a chance to process, then check auth again
      setTimeout(async () => {
        try {
          setIsLoading(true);
          await checkAuth(); // This refreshes the user data from the server
          setIsLoading(false);
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            history.push('/seller/dashboard');
          }, 1000);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          setIsLoading(false);
        }
      }, 2000); // Wait 2 seconds for webhook processing
    } else if (cancelled === 'true') {
      // Clear the URL parameters
      history.replace('/subscription-management');
      
      // Show cancellation message
      alert('Subscription upgrade was cancelled.');
    }
  }, [history, checkAuth]);

  const handleUpgrade = async (tierName: string) => {
    setLoading(true); // Set loading to true when starting the upgrade
    try {
      const stripe = await stripePromise;
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Get authentication headers from the auth context
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders); // Debug: check what headers are being sent

      // Ensure we have a token for authentication
      if (!authHeaders.Authorization) {
        console.error('No authentication token found');
        alert('Please log in to upgrade your subscription.');
        return;
      }

      // Display a loading message
      alert('Processing your request. Please wait...');

      // Redirect to the server endpoint that creates a Stripe checkout session
      const response = await fetch('/api/payments/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders, // Include auth headers (like Authorization: Bearer token)
        },
        body: JSON.stringify({
          priceId: PRICE_IDS[tierName as keyof typeof PRICE_IDS],
        }),
        // Use credentials include to ensure cookies are sent with the request
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('API error:', { 
          status: response.status,
          statusText: response.statusText
        });
        
        // Try to get error details
        let errorDetails = '';
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorDetails = errorData.message || errorData.error || JSON.stringify(errorData);
        } catch (e) {
          // If response is not JSON
          errorDetails = await response.text().catch(() => '');
        }
        
        alert(`Checkout Error (${response.status}): ${errorDetails || 'Unknown error'}`);
        return;
      }

      const session = await response.json();
      console.log('Session data:', session);
      
      if (!session.sessionId) {
        alert('Error: No session ID returned from server');
        return;
      }

      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe checkout with session ID:', session.sessionId);
      const result = await stripe.redirectToCheckout({
        sessionId: session.sessionId,
      });

      if (result.error) {
        console.error('Stripe redirect error:', result.error);
        alert('Error redirecting to checkout: ' + result.error.message);
      }
      // After successful upgrade, fetch the updated subscription data
      // Assuming fetchDashboardStats is a function that fetches dashboard statistics
      // If fetchDashboardStats is not defined, ensure it is imported or defined in the current scope
      // If fetchDashboardStats is defined elsewhere, ensure it is imported correctly
      // If fetchDashboardStats is not intended to be used here, consider removing or commenting it out
      // For demonstration, let's assume fetchDashboardStats is defined elsewhere and needs to be imported
      // Import fetchDashboardStats function
      // import { fetchDashboardStats } from './fetchDashboardStats'; // Example import statement
      // await fetchDashboardStats(true); // Force refresh
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(`An error occurred during checkout process: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false); // Set loading to false after the operation completes
    }
  };

  const getButtonText = (tier: string, currentTier: string) => {
    if (tier === currentTier) return null;
    if (tier === 'Basic') return 'Downgrade';
    return 'Upgrade';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <BackToDashboardButton />
        </div>
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-2 text-gray-600">Current Plan: {user?.subscriptionTier || 'Basic'}</p>
            {loading ? (
              <div className="mt-2 text-blue-500 text-sm flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                <span>Updating subscription information...</span>
              </div>
            ) : (
              <div className="mt-2 text-gray-600">
                {isLoading ? 'Updating subscription information...' : 'Subscription details...'}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
              <div className="mt-4 space-y-4">
                {[
                  { name: 'Basic', price: 'Free', listings: '75 Listings' },
                  { name: 'Starter', price: '$50/month', listings: '250 Listings' },
                  { name: 'Pro', price: '$100/month', listings: '750 Listings' },
                  { name: 'Premium', price: '$300/month', listings: 'Unlimited Listings' }
                ].map((tier) => (
                  <div key={tier.name} className="flex items-center justify-between p-4 bg-white rounded-md shadow-sm">
                    <div>
                      <h3 className="font-medium text-gray-900">{tier.name}</h3>
                      <p className="text-sm text-gray-500">
                        {tier.price} • {tier.listings}
                      </p>
                    </div>
                    {tier.name !== user?.subscriptionTier && tier.name !== 'Basic' && (
                      <button
                        onClick={() => handleUpgrade(tier.name)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        {getButtonText(tier.name, user?.subscriptionTier || 'Basic')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg relative">
              <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Current Plan: {user?.subscriptionTier || 'Basic'}</p>
                <p>Status: {
                  // Use type assertion to avoid TypeScript errors
                  user && 'subscription_id' in user 
                    ? 'Active' 
                    : 'Not active'
                }</p>
                <p>Next billing date: Coming soon</p>
                <p>Payment method: Not configured</p>
                
                {/* Manual refresh button - only shown when needed */}
                {false && (
                  <div className="mt-3">
                    <button
                      onClick={() => refreshUserData()}
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Updating...' : 'Refresh Subscription Status'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                Payment system is now active. Click on an upgrade button to subscribe to a plan.
                {!user && <span className="block mt-2 font-medium">You must be logged in to upgrade your subscription.</span>}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagementPage; 