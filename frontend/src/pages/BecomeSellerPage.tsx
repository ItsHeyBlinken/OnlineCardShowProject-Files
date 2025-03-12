import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Progress steps for the seller onboarding process
const STEPS = [
  'Store Details',
  'Subscription Plan',
  'ID Verification',
  'Stripe Connect'
];

const BecomeSellerPage = () => {
  const { user, checkAuth } = useAuth();
  const history = useHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [verified, setVerified] = useState(false);
  
  // Store details form
  const [storeDetails, setStoreDetails] = useState({
    storeName: '',
    description: '',
    contactEmail: user?.email || '',
    shippingPreferences: {
      freeShipping: false,
      domesticShippingPrice: '3.99',
      internationalShippingPrice: '12.99',
      processingTime: '1-2 business days'
    }
  });
  
  // Subscription tier selection
  const [selectedTier, setSelectedTier] = useState('Free');
  
  // ID verification details
  const [idDetails, setIdDetails] = useState({
    fullName: user?.name || '',
    idNumber: '',
    idImage: null as File | null
  });
  
  // File input handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdDetails({
        ...idDetails,
        idImage: file
      });
    }
  };
  
  // Handle store details form change
  const handleStoreDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      // Handle nested objects like shippingPreferences.domesticShippingPrice
      const [parent, child] = name.split('.');
      
      if (parent === 'shippingPreferences') {
        setStoreDetails({
          ...storeDetails,
          shippingPreferences: {
            ...storeDetails.shippingPreferences,
            [child]: value
          }
        });
      } else {
        // For any future nested objects we might add
        setStoreDetails({
          ...storeDetails,
          [parent]: {
            ...(storeDetails[parent as keyof typeof storeDetails] as any),
            [child]: value
          }
        });
      }
    } else {
      setStoreDetails({
        ...storeDetails,
        [name]: value
      });
    }
  };
  
  // Handle ID details form change
  const handleIdDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setIdDetails({
      ...idDetails,
      [name]: value
    });
  };
  
  // Handle next step button
  const handleNextStep = async () => {
    setError('');
    setSuccess('');
    
    // Validate current step before proceeding
    if (currentStep === 0) {
      // Validate store details
      if (!storeDetails.storeName || !storeDetails.description || !storeDetails.contactEmail) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (currentStep === 2) {
      // Validate ID verification
      if (!idDetails.fullName || !idDetails.idNumber || !idDetails.idImage) {
        setError('Please fill in all ID verification fields');
        return;
      }
      
      // Simulate ID verification API call
      setLoadingVerification(true);
      try {
        // In a real app, you would upload the ID image and details to a verification service
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
        setVerified(true);
        setSuccess('ID verification successful!');
      } catch (err) {
        setError('ID verification failed. Please try again.');
      } finally {
        setLoadingVerification(false);
      }
      
      // Only proceed if verification was successful
      if (!verified) return;
    }
    
    // Move to next step if not on the last step
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Handle previous step button
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle final submission - create seller account and redirect to customization page
  const handleFinalSubmit = async () => {
    try {
      // Register as a seller
      await axios.post('/api/auth/become-seller', {
        storeName: storeDetails.storeName,
        description: storeDetails.description,
        contactEmail: storeDetails.contactEmail,
        shippingPreferences: storeDetails.shippingPreferences,
        subscriptionTier: selectedTier,
        verified: true // In a real app, this would come from the verification service
      });
      
      // Update auth context with new user role
      await checkAuth();
      
      // Redirect to storefront customization page
      history.push('/seller/customize');
    } catch (error: unknown) {
      console.error('Error creating seller account:', error);
      const errorMsg = error instanceof Error 
        ? error.message 
        : (error as any)?.response?.data?.message || 'An error occurred during seller registration';
      setError(errorMsg);
    }
  };
  
  // Connect to Stripe
  const connectToStripe = () => {
    // In a real app, this would redirect to Stripe Connect OAuth flow
    // For now, we'll simulate a successful connection and move to the next step
    setSuccess('Stripe account connected successfully!');
    handleFinalSubmit();
  };
  
  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Store Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Name*</label>
              <input
                type="text"
                name="storeName"
                value={storeDetails.storeName}
                onChange={handleStoreDetailsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Description*</label>
              <textarea
                name="description"
                value={storeDetails.description}
                onChange={handleStoreDetailsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email*</label>
              <input
                type="email"
                name="contactEmail"
                value={storeDetails.contactEmail}
                onChange={handleStoreDetailsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Shipping Preferences</h4>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="shippingPreferences.freeShipping"
                    checked={storeDetails.shippingPreferences.freeShipping}
                    onChange={(e) => {
                      setStoreDetails({
                        ...storeDetails,
                        shippingPreferences: {
                          ...storeDetails.shippingPreferences,
                          freeShipping: e.target.checked,
                          domesticShippingPrice: e.target.checked ? '0.00' : storeDetails.shippingPreferences.domesticShippingPrice
                        }
                      });
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Offer Free Domestic Shipping</span>
                </label>
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Offering free shipping can increase your sales by attracting more buyers.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domestic Shipping Price ($)</label>
                  <input
                    type="number"
                    name="shippingPreferences.domesticShippingPrice"
                    value={storeDetails.shippingPreferences.domesticShippingPrice}
                    onChange={handleStoreDetailsChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    disabled={storeDetails.shippingPreferences.freeShipping}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">International Shipping Price ($)</label>
                  <input
                    type="number"
                    name="shippingPreferences.internationalShippingPrice"
                    value={storeDetails.shippingPreferences.internationalShippingPrice}
                    onChange={handleStoreDetailsChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Time</label>
                <select
                  name="shippingPreferences.processingTime"
                  value={storeDetails.shippingPreferences.processingTime}
                  onChange={handleStoreDetailsChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1-2 business days">1-2 business days</option>
                  <option value="3-5 business days">3-5 business days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="More than 2 weeks">More than 2 weeks</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 1: // Subscription Plan
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Your Subscription Tier</h3>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              {/* Free Tier */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTier === 'Free' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedTier('Free')}
              >
                <h4 className="text-lg font-medium text-gray-900">Free</h4>
                <p className="text-xl font-bold mt-2">$0/month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 75 listings
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic store customization
                  </li>
                </ul>
              </div>

              {/* Basic Tier */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTier === 'Basic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedTier('Basic')}
              >
                <h4 className="text-lg font-medium text-gray-900">Basic</h4>
                <p className="text-xl font-bold mt-2">$50/month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 250 listings
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Basic store customization
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                </ul>
              </div>

              {/* Pro Tier */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTier === 'Pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedTier('Pro')}
              >
                <h4 className="text-lg font-medium text-gray-900">Pro</h4>
                <p className="text-xl font-bold mt-2">$100/month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Up to 750 listings
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced store customization
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Analytics dashboard
                  </li>
                </ul>
              </div>

              {/* Premium Tier */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTier === 'Premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setSelectedTier('Premium')}
              >
                <h4 className="text-lg font-medium text-gray-900">Premium</h4>
                <p className="text-xl font-bold mt-2">$300/month</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited listings
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Premium store customization
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    24/7 priority support
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Featured seller placement
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
        
      case 2: // ID Verification
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">ID Verification</h3>
            <p className="text-sm text-gray-500 mb-4">
              For security and compliance reasons, we need to verify your identity before you can start selling.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name*</label>
              <input
                type="text"
                name="fullName"
                value={idDetails.fullName}
                onChange={handleIdDetailsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={verified}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID Number (Driver's License, Passport, etc.)*</label>
              <input
                type="text"
                name="idNumber"
                value={idDetails.idNumber}
                onChange={handleIdDetailsChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={verified}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload ID Document*</label>
              <input
                type="file"
                name="idImage"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                accept="image/*,.pdf"
                required
                disabled={verified}
              />
              <p className="text-xs text-gray-500 mt-1">
                Please upload a clear photo of your government-issued ID (passport, driver's license, or national ID card).
              </p>
            </div>
            
            {loadingVerification && (
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-2">Verifying your ID...</span>
              </div>
            )}
            
            {verified && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center">
                <svg className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-medium text-green-800">Verification Successful</h4>
                  <p className="text-sm text-green-600">Your ID has been verified successfully.</p>
                </div>
              </div>
            )}
          </div>
        );
        
      case 3: // Stripe Connect
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Stripe</h3>
            <p className="text-sm text-gray-500 mb-4">
              To receive payments for your sales, you need to connect your Stripe account. 
              We'll use Stripe to securely process payments and transfer funds to your bank account.
            </p>
            
            <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex flex-col items-center text-center">
                <svg className="w-16 h-16 text-blue-500 mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Connect your Stripe account</h4>
                <p className="text-sm text-gray-500 mb-4">
                  By connecting to Stripe, you'll be able to receive payments directly to your bank account.
                </p>
                <button
                  type="button"
                  onClick={connectToStripe}
                  className="px-6 py-3 bg-[#625AF8] text-white rounded-md hover:bg-[#4b44c9] transition-colors"
                >
                  Connect with Stripe
                </button>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Progress indicator */}
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-2xl font-bold text-gray-900">Become a Seller</h2>
            <p className="mt-1 text-sm text-gray-500">Complete the following steps to create your seller account</p>
            
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flex flex-col items-center">
                      <div 
                        className={`flex items-center justify-center h-10 w-10 rounded-full ${
                          index < currentStep 
                            ? 'bg-green-500' 
                            : index === currentStep 
                              ? 'bg-blue-600 text-white border-2 border-blue-600' 
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index < currentStep ? (
                          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step}
                      </span>
                    </div>
                    
                    {index < STEPS.length - 1 && (
                      <div 
                        className={`flex-1 h-1 mx-2 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          
          {/* Step content */}
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <p className="text-sm text-green-700 mt-1">{success}</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderStepContent()}
          </div>
          
          {/* Navigation buttons */}
          <div className="px-4 py-4 bg-gray-50 sm:px-6 flex justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className={`px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md ${
                currentStep === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <button
              type="button"
              onClick={currentStep === STEPS.length - 1 ? connectToStripe : handleNextStep}
              className="ml-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              {currentStep === STEPS.length - 1 ? 'Complete Registration' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeSellerPage; 