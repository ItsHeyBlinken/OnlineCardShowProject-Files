import React, { FC, useState, useEffect } from 'react';
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

// The subscription tier levels for comparison
const TIER_LEVELS: Record<string, number> = {
  'Basic': 0,
  'Starter': 1,
  'Pro': 2,
  'Premium': 3
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
  const { user, getAuthHeaders, checkAuth, forceRefreshUserData } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [pendingDowngradeTier, setPendingDowngradeTier] = useState<string | null>(null);
  
  // Function to refresh user data - only use when absolutely necessary
  const refreshUserData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      await forceRefreshUserData(); // Use the force refresh instead of regular checkAuth
      setIsLoading(false);
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setIsLoading(false);
    }
  }, [forceRefreshUserData]);

  // Only refresh on initial component mount - no polling
  useEffect(() => {
    // Initial data load - REMOVED to prevent duplicate API calls
    // The AuthContext already makes this call when the component mounts
    
    // No polling mechanism
  }, []); // Empty dependency array - only runs once
  
  // Check if user is returning from a successful checkout
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const success = query.get('success');
    const cancelled = query.get('cancelled');
    const downgrade = query.get('downgrade');
    
    if (success === 'true') {
      // Set checkout success flag
      setCheckoutSuccess(true);
      
      // Clear the URL parameters
      history.replace('/subscription-management');
      
      // Show success message
      alert('Your subscription has been successfully updated! The change will be reflected in your account shortly.');
      
      // Give webhooks a chance to process, then check auth again
      setTimeout(async () => {
        try {
          setIsLoading(true);
          await forceRefreshUserData(); // Use force refresh instead of regular checkAuth
          setRetryCount(1); // Start retry counter
          setIsLoading(false);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          setIsLoading(false);
        }
      }, 5000); // Increased waiting time to 5 seconds for webhook processing
    } else if (downgrade === 'true') {
      // Clear the URL parameters
      history.replace('/subscription-management');
      
      // Show success message for downgrade
      alert('Your subscription will be downgraded at the end of your current billing period.');
      
      // Refresh user data to get latest subscription status
      refreshUserData();
    } else if (cancelled === 'true') {
      // Clear the URL parameters
      history.replace('/subscription-management');
      
      // Show cancellation message
      alert('Subscription change was cancelled.');
    }
  }, [history, forceRefreshUserData, refreshUserData]);
  
  // Set up retry mechanism for subscriptions
  useEffect(() => {
    // Only proceed if checkout was successful and we're still trying to refresh
    if (!checkoutSuccess || retryCount === 0) return;
    
    // If user has a subscription status of "active", redirect to dashboard
    if (user?.subscription_status === 'active') {
      // Successfully updated! Redirect to dashboard
      setTimeout(() => {
        history.push('/seller/dashboard?refresh=true');
      }, 1000);
      return;
    }

    // If we're showing the Basic tier (which is free), consider it successful
    if (user?.subscriptionTier === 'Basic' && user?.role === 'seller') {
      // Even Basic tier sellers should have active status
      setTimeout(() => {
        // Call the refresh endpoint to update the basic tier status
        const refreshBasicTier = async () => {
          try {
            const token = localStorage.getItem('token');
            await fetch('/api/webhooks/refresh-subscription-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ userId: user.id })
            });
            
            // Redirect to dashboard with refresh parameter
            history.push('/seller/dashboard?refresh=true');
          } catch (error) {
            console.error('Error refreshing basic tier:', error);
            // Still redirect even if refresh fails
            history.push('/seller/dashboard?refresh=true');
          }
        };
        
        refreshBasicTier();
      }, 1000);
      return;
    }
    
    // If we've reached max retries (3), give up and direct user to contact support
    if (retryCount >= 3) {
      alert('Your payment was successful, but your subscription status is taking longer than expected to update. Please refresh the dashboard in a few minutes or contact support if the issue persists.');
      setTimeout(() => {
        history.push('/seller/dashboard?refresh=true');
      }, 1000);
      return;
    }
    
    // Set up a retry
    const retryTimer = setTimeout(async () => {
      console.log(`Retry #${retryCount} to check subscription status...`);
      try {
        await forceRefreshUserData();
        setRetryCount(prev => prev + 1);
      } catch (error) {
        console.error('Error during retry:', error);
      }
    }, 5000); // 5 second intervals
    
    return () => clearTimeout(retryTimer);
  }, [user, retryCount, checkoutSuccess, history, forceRefreshUserData]);

  // Check if pending downgrade info is stored in local storage
  useEffect(() => {
    const storedDowngrade = localStorage.getItem(`subscription_downgrade_${user?.id}`);
    if (storedDowngrade) {
      try {
        const downgradeInfo = JSON.parse(storedDowngrade);
        if (downgradeInfo.tier) {
          setPendingDowngradeTier(downgradeInfo.tier);
        }
      } catch (e) {
        console.error('Error parsing stored downgrade info:', e);
        localStorage.removeItem(`subscription_downgrade_${user?.id}`);
      }
    }
  }, [user?.id]);

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
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(`An error occurred during checkout process: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false); // Set loading to false after the operation completes
    }
  };

  const handleDowngrade = async (tierName: string) => {
    setLoading(true);
    try {
      // Get authentication headers from the auth context
      const authHeaders = getAuthHeaders();
      
      // Ensure we have a token for authentication
      if (!authHeaders.Authorization) {
        console.error('No authentication token found');
        alert('Please log in to downgrade your subscription.');
        return;
      }
      
      // Add client-side validation to prevent downgrading to the same tier
      const currentTier = user?.subscriptionTier || 'Basic';
      if (tierName === currentTier) {
        alert('You are already on this subscription tier.');
        setLoading(false);
        return;
      }
      
      // Check if the tier is actually a downgrade
      if (TIER_LEVELS[tierName] >= TIER_LEVELS[currentTier]) {
        alert('You can only downgrade to a lower tier than your current one.');
        setLoading(false);
        return;
      }
      
      // Confirm with user that downgrade will happen at end of current billing period
      const confirmDowngrade = window.confirm(
        `Are you sure you want to downgrade to the ${tierName} plan? This change will take effect at the end of your current billing period.`
      );
      
      if (!confirmDowngrade) {
        setLoading(false);
        return;
      }
      
      // Make API call to downgrade subscription
      const response = await fetch('/api/payments/downgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          newTier: tierName,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to downgrade subscription';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If not JSON
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Downgrade response:', result);
      
      // Store downgrade info in localStorage to persist across page refreshes
      localStorage.setItem(`subscription_downgrade_${user?.id}`, JSON.stringify({
        tier: tierName,
        timestamp: new Date().toISOString()
      }));
      
      // Set the pending downgrade tier in state
      setPendingDowngradeTier(tierName);
      
      // Redirect to success page
      history.push('/subscription-management?downgrade=true');
    } catch (error: any) {
      console.error('Downgrade error:', error);
      alert(`Error downgrading subscription: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = (tier: string, currentTier: string) => {
    // If this is the current tier, show no button
    if (tier === currentTier) return null;
    
    // If this tier is lower than current, show downgrade
    if (TIER_LEVELS[tier] < TIER_LEVELS[currentTier || 'Basic']) {
      return 'Downgrade';
    }
    
    // Otherwise show upgrade
    return 'Upgrade';
  };

  const renderActionButton = (tier: { name: string, price: string, listings: string }) => {
    const currentTier = user?.subscriptionTier || 'Basic';
    
    // If this is the current tier, don't show any button
    if (tier.name === currentTier) {
      return <span className="px-4 py-2 text-sm font-medium text-gray-500">Current Plan</span>;
    }
    
    // Determine if this is an upgrade or downgrade
    const isUpgrade = TIER_LEVELS[tier.name] > TIER_LEVELS[currentTier];
    const isDowngrade = TIER_LEVELS[tier.name] < TIER_LEVELS[currentTier];
    
    // If this is the pending downgrade tier, show special message
    if (tier.name === pendingDowngradeTier) {
      return (
        <span className="px-4 py-2 text-sm font-medium text-amber-600">
          Scheduled Change
        </span>
      );
    }
    
    // For Basic tier, only show downgrade button if user is on a paid plan
    // Basic is already the lowest tier, so we never need to show a downgrade button for it
    if (tier.name === 'Basic') {
      if (currentTier === 'Basic') {
        // User is already on Basic - don't show any button
        return null;
      }
      return (
        <button
          onClick={() => handleDowngrade(tier.name)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
        >
          Downgrade
        </button>
      );
    }
    
    // For paid tiers
    if (isUpgrade) {
      return (
        <button
          onClick={() => handleUpgrade(tier.name)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Upgrade
        </button>
      );
    }
    
    if (isDowngrade) {
      return (
        <button
          onClick={() => handleDowngrade(tier.name)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
        >
          Downgrade
        </button>
      );
    }
    
    return null;
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
            {pendingDowngradeTier && user?.subscriptionTier !== pendingDowngradeTier && (
              <p className="mt-2 text-orange-600">
                Your subscription will downgrade to {pendingDowngradeTier} at the end of your current billing period.
              </p>
            )}
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
                    {renderActionButton(tier)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg relative">
              <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>Current Plan: {user?.subscriptionTier || 'Basic'}</p>
                <p>Status: {
                  // Display subscription status with appropriate styling
                  user?.subscription_status === 'active' ? (
                    <span className="font-medium text-green-600">Active</span>
                  ) : (
                    <span className="font-medium text-red-600">Inactive</span>
                  )
                }</p>
                {user?.subscription_period_end && (
                  <p>Renewal Date: {new Date(user.subscription_period_end).toLocaleDateString()}</p>
                )}
                {pendingDowngradeTier && user?.subscriptionTier !== pendingDowngradeTier && (
                  <p className="font-medium text-orange-600">
                    Downgrading to {pendingDowngradeTier} after current period
                  </p>
                )}
                {user?.subscription_id && (
                  <p>Subscription ID: <span className="font-mono text-xs">{user.subscription_id}</span></p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={refreshUserData}
                  disabled={isLoading}
                  className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoading ? 'Updating...' : 'Refresh Subscription Status'}
                </button>
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