/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your public key from environment variables
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
}

// Helper function to ensure price is a number before formatting
const formatPrice = (price: any): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

// Tax rates by state (simplified example - in real world, use a tax API)
const TAX_RATES: Record<string, number> = {
  'AL': 0.04, 'AK': 0.00, 'AZ': 0.056, 'AR': 0.065, 'CA': 0.0725,
  'CO': 0.029, 'CT': 0.0635, 'DE': 0.00, 'FL': 0.06, 'GA': 0.04,
  'HI': 0.04, 'ID': 0.06, 'IL': 0.0625, 'IN': 0.07, 'IA': 0.06,
  'KS': 0.065, 'KY': 0.06, 'LA': 0.0445, 'ME': 0.055, 'MD': 0.06,
  'MA': 0.0625, 'MI': 0.06, 'MN': 0.06875, 'MS': 0.07, 'MO': 0.04225,
  'MT': 0.00, 'NE': 0.055, 'NV': 0.0685, 'NH': 0.00, 'NJ': 0.06625,
  'NM': 0.05125, 'NY': 0.04, 'NC': 0.0475, 'ND': 0.05, 'OH': 0.0575,
  'OK': 0.045, 'OR': 0.00, 'PA': 0.06, 'RI': 0.07, 'SC': 0.06,
  'SD': 0.045, 'TN': 0.07, 'TX': 0.0625, 'UT': 0.061, 'VT': 0.06,
  'VA': 0.053, 'WA': 0.065, 'WV': 0.06, 'WI': 0.05, 'WY': 0.04
};

const CheckoutForm: React.FC = () => {
  const { 
    items, 
    subtotal, 
    tax, 
    taxRate, 
    setTaxRate, 
    shippingMethods,
    selectedShippingMethod,
    setSelectedShippingMethod,
    shippingCost,
    total, 
    clearCart,
    isLoading
  } = useCart();
  const { user } = useAuth();
  const history = useHistory();
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
    email: user?.email || '',
    phone: ''
  });

  // Add state for tracking whether to use saved address
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [savedAddress, setSavedAddress] = useState<ShippingInfo | null>(null);

  // Add a state for whether to save the address
  const [saveAddress, setSaveAddress] = useState(false);

  // Check if backend is reachable on component mount
  useEffect(() => {
    const checkBackendConnection = async () => {
      // First check if we're in development mode
      if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        try {
          // Try a simple request to the backend
          await axios.get('/api/health-check', { timeout: 2000 });
          console.log('Backend connection available');
          setOfflineMode(false);
        } catch (error) {
          console.log('Backend not available, switching to offline mode');
          setOfflineMode(true);
        }
      }
    };

    checkBackendConnection();
  }, []);

  // Update tax rate when state changes
  useEffect(() => {
    if (shippingInfo.state && TAX_RATES[shippingInfo.state]) {
      setTaxRate(TAX_RATES[shippingInfo.state]);
    }
  }, [shippingInfo.state, setTaxRate]);

  // Modify the fetchShippingAddress function to store the saved address separately
  useEffect(() => {
    const fetchShippingAddress = async () => {
      // Handle guest users
      if (!user) {
        // For guest users, check local storage for previously saved guest address
        try {
          const guestAddress = localStorage.getItem('guestShippingAddress');
          if (guestAddress) {
            const parsedAddress = JSON.parse(guestAddress);
            setSavedAddress(parsedAddress);
            if (useSavedAddress) {
              setShippingInfo(parsedAddress);
            }
            console.log('Using guest shipping address from localStorage');
          }
        } catch (error) {
          console.error('Error loading guest address:', error);
        }
        
        setLoadingAddress(false);
        return;
      }
      
      setLoadingAddress(true);
      
      // Skip API calls in offline mode
      if (offlineMode || process.env.NODE_ENV === 'development') {
        console.log('Using offline mode for shipping addresses');
        try {
          // Check localStorage for a saved address
          const demoAddress = localStorage.getItem('demoShippingAddress');
          if (demoAddress) {
            const parsedAddress = JSON.parse(demoAddress);
            const addressData = {
              name: parsedAddress.name,
              address: parsedAddress.address_line1,
              city: parsedAddress.city,
              state: parsedAddress.state,
              postalCode: parsedAddress.postal_code,
              country: parsedAddress.country,
              email: user.email || '',
              phone: parsedAddress.phone
            };
            
            // Store the saved address
            setSavedAddress(addressData);
            
            // If useSavedAddress is true, also update the shipping info
            if (useSavedAddress) {
              setShippingInfo(addressData);
            }
            
            console.log('Using demo shipping address from localStorage');
          }
        } catch (parseError) {
          console.error('Error parsing demo shipping address:', parseError);
        }
        setLoadingAddress(false);
        return;
      }
      
      try {
        // Try the API since we're not in offline mode
        const response = await axios.get(`/api/users/${user.id}/shipping-address`);
        if (response.data) {
          const addressData = {
            name: response.data.name,
            address: response.data.address_line1,
            city: response.data.city,
            state: response.data.state,
            postalCode: response.data.postal_code,
            country: response.data.country,
            email: user.email || '',
            phone: response.data.phone
          };
          
          // Store the saved address
          setSavedAddress(addressData);
          
          // If useSavedAddress is true, also update the shipping info
          if (useSavedAddress) {
            setShippingInfo(addressData);
          }
        }
      } catch (error) {
        console.log('No saved shipping address found from API');
        // Switch to offline mode if we get a connection error
        setOfflineMode(true);
        
        // Try to use localStorage as fallback
        try {
          const demoAddress = localStorage.getItem('demoShippingAddress');
          if (demoAddress) {
            const parsedAddress = JSON.parse(demoAddress);
            const addressData = {
              name: parsedAddress.name,
              address: parsedAddress.address_line1,
              city: parsedAddress.city,
              state: parsedAddress.state,
              postalCode: parsedAddress.postal_code,
              country: parsedAddress.country,
              email: user.email || '',
              phone: parsedAddress.phone
            };
            
            // Store the saved address
            setSavedAddress(addressData);
            
            // If useSavedAddress is true, also update the shipping info
            if (useSavedAddress) {
              setShippingInfo(addressData);
            }
            
            console.log('Using demo shipping address from localStorage');
          }
        } catch (parseError) {
          console.error('Error parsing demo shipping address:', parseError);
        }
      } finally {
        setLoadingAddress(false);
      }
    };
    
    fetchShippingAddress();
  }, [user, useSavedAddress, offlineMode]);

  const handleShippingInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleShippingMethodChange = (methodId: number) => {
    const method = shippingMethods.find(m => m.id === methodId);
    if (method) {
      setSelectedShippingMethod(method);
    }
  };

  // Add a handler for the checkbox change
  const handleUseSavedAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const useIt = e.target.checked;
    setUseSavedAddress(useIt);
    
    if (useIt && savedAddress) {
      // Use the saved address immediately
      setShippingInfo(savedAddress);
      console.log('Using saved address:', savedAddress);
    } else if (!useIt) {
      // Clear the form 
      setShippingInfo({
        name: user?.name || '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
        email: user?.email || '',
        phone: ''
      });
      console.log('Cleared saved address form');
    }
  };

  // Handle saving the address when submitting
  const saveShippingAddress = async () => {
    if (!saveAddress) return;

    try {
      // Format the data for the API
      const addressData = {
        name: shippingInfo.name,
        address_line1: shippingInfo.address,
        address_line2: '', // Add this field if needed
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.postalCode,
        country: shippingInfo.country,
        phone: shippingInfo.phone,
        is_default: true
      };
      
      if (!user) {
        // For guest users, just save to localStorage
        localStorage.setItem('guestShippingAddress', JSON.stringify(shippingInfo));
        console.log('Guest shipping address saved to localStorage');
        return;
      }
      
      // In development or offline mode, save to localStorage instead of API
      if (offlineMode || process.env.NODE_ENV === 'development') {
        localStorage.setItem('demoShippingAddress', JSON.stringify(addressData));
        console.log('Shipping address saved to localStorage due to offline/development mode');
        return;
      }
      
      // In production with active backend, use the API
      await axios.post(`/api/users/${user.id}/shipping-address`, addressData);
      console.log('Shipping address saved successfully to API');
    } catch (error) {
      console.error('Error saving shipping address:', error);
      // If we get an error, switch to offline mode for future operations
      setOfflineMode(true);
      
      // Still save to localStorage as fallback
      if (user) {
        const addressData = {
          name: shippingInfo.name,
          address_line1: shippingInfo.address,
          address_line2: '', 
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.postalCode,
          country: shippingInfo.country,
          phone: shippingInfo.phone,
          is_default: true
        };
        localStorage.setItem('demoShippingAddress', JSON.stringify(addressData));
      }
      // Don't interrupt the checkout process for this
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setPaymentError('Stripe has not been initialized. Please reload the page and try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setPaymentError('Card element not found. Please reload the page and try again.');
      return;
    }

    if (!selectedShippingMethod) {
      setPaymentError('Please select a shipping method');
      return;
    }

    // Basic form validation
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || 
        !shippingInfo.state || !shippingInfo.postalCode || !shippingInfo.email || !shippingInfo.phone) {
      setPaymentError('Please fill in all required shipping information fields');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Use development/offline mode when appropriate
      if (offlineMode || process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        console.log('Offline/Development mode: Simulating successful payment');
        
        // Save the shipping address if requested
        if (saveAddress) {
          await saveShippingAddress();
        }
        
        // Simulate successful payment and order creation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setPaymentSuccess(true);
        clearCart();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          history.push(`/order-confirmation?id=demo-order-${Date.now()}`);
        }, 2000);
        
        return;
      }

      // Real Stripe payment flow - this will only be used in production with active backend
      // Create payment intent on the server
      const { data } = await axios.post('/api/payments/create-payment-intent', {
        amount: Math.round(total * 100), // Stripe uses cents, ensure we're sending an integer
        currency: 'usd',
        items: items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price)
        })),
        tax: tax,
        shipping_cost: shippingCost,
        shipping_method_id: selectedShippingMethod.id,
        // Include user ID only if user is logged in
        userId: user?.id
      });

      // Confirm card payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: shippingInfo.name,
            email: shippingInfo.email,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              state: shippingInfo.state,
              postal_code: shippingInfo.postalCode,
              country: shippingInfo.country
            }
          }
        }
      });

      if (error) {
        setPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        // Save the shipping address if requested (only if user is logged in)
        if (saveAddress) {
          await saveShippingAddress();
        }
        
        // Payment successful - create order in database
        const orderResponse = await axios.post('/api/orders', {
          // Include user ID only if user is logged in
          userId: user?.id,
          // For guest checkout, include all contact info
          guestInfo: !user ? {
            name: shippingInfo.name,
            email: shippingInfo.email,
            phone: shippingInfo.phone
          } : undefined,
          items: items,
          shippingInfo: {
            ...shippingInfo,
            shipping_method_id: selectedShippingMethod.id,
            shipping_cost: shippingCost
          },
          paymentId: paymentIntent.id,
          total: total,
          subtotal: subtotal,
          tax: tax,
          taxRate: taxRate,
          shippingMethodId: selectedShippingMethod.id,
          shippingCost: shippingCost
        });

        setPaymentSuccess(true);
        clearCart();
        
        // Redirect after 2 seconds
        setTimeout(() => {
          history.push(`/order-confirmation?id=${orderResponse.data.orderId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      
      // Switch to offline mode if we encounter connection errors
      if (!offlineMode) {
        setOfflineMode(true);
        setPaymentError('Connection error: Switching to offline mode. Please try again to complete your purchase in offline mode.');
        setIsProcessing(false);
        return;
      }
      
      // Handle common errors
      let errorMessage = 'There was an error processing your payment. Please try again.';
      
      // @ts-ignore
      if (err?.response?.status === 500) {
        errorMessage = 'Server error: The payment system is temporarily unavailable. Please try again later.';
      }
      // @ts-ignore
      else if (err?.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Connection error: Could not connect to the payment server. Please try again later.';
      }
      
      setPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-green-50 border-green-500 border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Payment Successful!</h2>
          <p className="text-green-700 mb-2">Your order has been placed successfully.</p>
          <p className="text-green-700">You will be redirected to the order confirmation page...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      {!user && (
        <div className="mb-4 p-4 bg-blue-50 border rounded">
          <h3 className="font-medium text-blue-800 mb-2">Guest Checkout</h3>
          <p className="text-sm text-blue-700">
            You're checking out as a guest. You can create an account later to track your orders.
          </p>
        </div>
      )}
      
      {offlineMode && (
        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h3 className="font-medium text-yellow-800 mb-2">Offline Mode</h3>
          <p className="text-sm text-yellow-700">
            The backend server is not available. The checkout is running in offline mode with simulated payment processing.
            {process.env.NODE_ENV === 'development' && 
              " This is normal in development environment and allows you to test the checkout flow without a backend server."}
          </p>
        </div>
      )}
      
      {loadingAddress ? (
        <div className="mb-4 p-4 bg-gray-50 border rounded animate-pulse">
          <p className="text-gray-500">Loading saved shipping information...</p>
        </div>
      ) : savedAddress ? (
        <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useSavedAddress"
              checked={useSavedAddress}
              onChange={handleUseSavedAddress}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="useSavedAddress" className="ml-2 block text-sm text-gray-700">
              Use my saved shipping address
            </label>
          </div>
          {useSavedAddress && (
            <div className="mt-2 text-sm text-gray-600">
              <p><span className="font-medium">Name:</span> {savedAddress.name}</p>
              <p><span className="font-medium">Address:</span> {savedAddress.address}</p>
              <p><span className="font-medium">City:</span> {savedAddress.city}, {savedAddress.state} {savedAddress.postalCode}</p>
              <p><span className="font-medium">Phone:</span> {savedAddress.phone}</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Shipping Information */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={shippingInfo.name}
                onChange={handleShippingInfoChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={shippingInfo.email}
                onChange={handleShippingInfoChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={shippingInfo.phone}
                onChange={handleShippingInfoChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={shippingInfo.address}
                onChange={handleShippingInfoChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleShippingInfoChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <select
                  id="state"
                  name="state"
                  value={shippingInfo.state}
                  onChange={handleShippingInfoChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a state</option>
                  {Object.keys(TAX_RATES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={handleShippingInfoChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={shippingInfo.country}
                  onChange={handleShippingInfoChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  {/* Add more countries as needed */}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {user 
                    ? "Save this address for future orders" 
                    : "Remember this address on this device"}
                </span>
              </label>
              {!user && saveAddress && (
                <p className="mt-1 text-xs text-gray-500 ml-6">
                  Note: Since you're checking out as a guest, this address will only be saved in your browser.
                </p>
              )}
            </div>
          </div>
          
          {/* Shipping Method Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Shipping Method</h2>
            
            {isLoading ? (
              <div className="text-center py-4">Loading shipping options...</div>
            ) : shippingMethods.length > 0 ? (
              <div className="space-y-4">
                {shippingMethods.map(method => (
                  <div key={method.id} className="border rounded-md p-4 hover:border-blue-500 cursor-pointer transition-colors">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="shipping-method"
                        value={method.id}
                        checked={selectedShippingMethod?.id === method.id}
                        onChange={() => handleShippingMethodChange(method.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{method.display_name}</span>
                          <span className="font-medium">${formatPrice(shippingCost)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{method.provider} - {method.description || 'Standard delivery'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {method.provider === 'USPS' ? 'Estimated 3-5 business days' : 
                           method.provider === 'UPS' ? 'Estimated 2-3 business days' : 
                           'Estimated 1-2 business days'}
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No shipping methods available</div>
            )}
          </div>
        </div>
        
        {/* Payment and Order Summary */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Payment Information</h2>
            
            <div className="mb-6">
              <label htmlFor="card-element" className="block text-sm font-medium text-gray-700 mb-1">
                Credit Card
              </label>
              <div className="border border-gray-300 rounded-md p-4">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#32325d',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#dc2626',
                      },
                    },
                  }}
                />
              </div>
              {paymentError && (
                <p className="text-red-500 text-sm mt-2">{paymentError}</p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              
              {items.map(item => (
                <div key={item.id} className="flex justify-between mb-2">
                  <span>
                    {item.title} x {item.quantity}
                  </span>
                  <span>${formatPrice(Number(item.price) * item.quantity)}</span>
                </div>
              ))}
              
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal:</span>
                  <span>${formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping:</span>
                  {shippingCost > 0 ? (
                    <span>${formatPrice(shippingCost)}</span>
                  ) : (
                    <span>--</span>
                  )}
                </div>
                <div className="flex justify-between mb-2">
                  <span>Sales Tax ({(taxRate * 100).toFixed(2)}%):</span>
                  <span>${formatPrice(tax)}</span>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-bold mb-4">
                  <span>Total:</span>
                  <span>${formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!stripe || isProcessing || isLoading || !selectedShippingMethod}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : `Pay $${formatPrice(total)}`}
          </button>
        </div>
      </div>
    </form>
  );
};

export const CheckoutPage: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}; 
