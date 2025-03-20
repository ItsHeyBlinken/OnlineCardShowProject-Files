import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SellerRegistrationComplete: React.FC = () => {
  const history = useHistory();
  const { checkAuth, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Processing your subscription...');
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    const completeRegistration = async () => {
      try {
        setLoading(true);
        
        // Debug info - current user
        console.log('Current user on registration complete page:', user);
        setDebug((prev: any) => ({ ...prev, user }));
        
        // Get the stored seller details
        const sellerDetailsString = sessionStorage.getItem('sellerDetails');
        console.log('Session storage data exists:', !!sellerDetailsString);
        setDebug((prev: any) => ({ ...prev, hasSessionData: !!sellerDetailsString }));
        
        if (!sellerDetailsString) {
          throw new Error('Seller details not found. Please try the registration process again.');
        }
        
        const sellerDetails = JSON.parse(sellerDetailsString);
        console.log('Retrieved seller details from session storage:', sellerDetails);
        setDebug((prev: any) => ({ ...prev, sellerDetails }));
        
        // Check if user already has a subscription in our database
        let subscriptionActive = false;
        try {
          // Wait a moment to give webhook time to process (in case it hasn't yet)
          await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time
          
          setStatus('Checking subscription status...');
          const subscriptionResponse = await axios.get('/api/users/subscription');
          
          // If the above endpoint fails, try the alternate endpoint
          try {
            const subscriptionResponse = await axios.get('/api/users/subscription');
            console.log('Subscription response from /api/users/subscription:', subscriptionResponse.data);
            setDebug((prev: any) => ({ ...prev, subscriptionResponse: subscriptionResponse.data }));
            
            if (subscriptionResponse.data && 
                subscriptionResponse.data.tier && 
                subscriptionResponse.data.tier !== 'Basic') {
              console.log('User already has a subscription:', subscriptionResponse.data);
              subscriptionActive = true;
            }
          } catch (userEndpointError) {
            console.log('Trying alternate endpoint...');
            // Try the alternate endpoint
            try {
              const altResponse = await axios.get('/api/user/subscription');
              console.log('Subscription response from /api/user/subscription:', altResponse.data);
              setDebug((prev: any) => ({ ...prev, altSubscriptionResponse: altResponse.data }));
              
              if (altResponse.data && 
                  altResponse.data.tier && 
                  altResponse.data.tier !== 'Basic') {
                console.log('User already has a subscription (alt endpoint):', altResponse.data);
                subscriptionActive = true;
              }
            } catch (altEndpointError) {
              console.log('Both subscription endpoints failed:', userEndpointError, altEndpointError);
              setDebug((prev: any) => ({ 
                ...prev, 
                userEndpointError, 
                altEndpointError 
              }));
            }
          }
        } catch (subError) {
          console.log('Error checking subscription:', subError);
          setDebug((prev: any) => ({ ...prev, subscriptionError: subError }));
        }
        
        // Register as a seller
        setStatus('Setting up your seller account...');
        console.log('Sending become-seller request with data:', {
          storeName: sellerDetails.storeName,
          description: sellerDetails.description,
          contactEmail: sellerDetails.contactEmail,
          shippingPreferences: sellerDetails.shippingPreferences,
          subscriptionTier: sellerDetails.subscriptionTier,
          subscriptionActive: subscriptionActive || sellerDetails.subscriptionTier === 'Free' || true
        });
        
        const response = await axios.post('/api/auth/become-seller', {
          storeName: sellerDetails.storeName,
          description: sellerDetails.description,
          contactEmail: sellerDetails.contactEmail,
          shippingPreferences: sellerDetails.shippingPreferences,
          subscriptionTier: sellerDetails.subscriptionTier,
          subscriptionActive: subscriptionActive || sellerDetails.subscriptionTier === 'Free' || true,
          verified: sellerDetails.verified
        });
        
        console.log('Seller registration response:', response.data);
        setDebug((prev: any) => ({ ...prev, becomeSellerResponse: response.data }));
        
        // Clear the session storage
        sessionStorage.removeItem('sellerDetails');
        
        // Update auth context with new user role
        setStatus('Updating your profile...');
        await checkAuth();
        
        // Get updated user info after checkAuth
        const currentUser = await axios.get('/api/auth/current-user');
        console.log('User after checkAuth:', currentUser.data);
        setDebug((prev: any) => ({ ...prev, updatedUser: currentUser.data }));
        
        // Redirect to seller dashboard
        setStatus('Redirecting to dashboard...');
        setTimeout(() => {
          console.log('About to redirect to seller dashboard');
          history.push('/seller/dashboard');
        }, 2000);
      } catch (error: any) {
        console.error('Error completing seller registration:', error);
        // Log more detailed error information
        if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          setDebug((prev: any) => ({ 
            ...prev, 
            errorData: error.response.data, 
            errorStatus: error.response.status 
          }));
        }
        setError(error.message || 'Failed to complete seller registration');
      } finally {
        setLoading(false);
      }
    };
    
    completeRegistration();
  }, [checkAuth, history, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Setting Up Your Seller Account</h1>
        
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600">
              Your payment was successful! {status}
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
            <h3 className="text-lg font-medium text-red-800">Registration Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={() => history.push('/become-seller')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Return to Registration
            </button>
            
            {/* Debug information - only show in development */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 text-xs text-left overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                <h4 className="font-bold">Debug Info:</h4>
                <pre>{JSON.stringify(debug, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-md border border-green-200">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-800">Registration Complete!</h3>
            <p className="text-green-700 mt-1">Your seller account has been successfully created.</p>
            <p className="text-green-700 mt-1">Redirecting you to your seller dashboard...</p>
            
            {/* Debug information - only show in development */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-4 text-xs text-left overflow-auto max-h-40 p-2 bg-gray-100 rounded">
                <h4 className="font-bold">Debug Info:</h4>
                <pre>{JSON.stringify(debug, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerRegistrationComplete; 