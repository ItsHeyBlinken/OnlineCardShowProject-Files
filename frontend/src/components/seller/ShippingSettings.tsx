import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface ShippingPreferences {
  offers_free_shipping: boolean;
  standard_shipping_fee: number;
  shipping_policy: string;
  uses_calculated_shipping: boolean;
}

const ShippingSettings: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState<ShippingPreferences>({
    offers_free_shipping: false,
    standard_shipping_fee: 0,
    shipping_policy: '',
    uses_calculated_shipping: false
  });

  // Load shipping preferences when component mounts
  useEffect(() => {
    const fetchShippingPreferences = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/shipping/policy/${user.id}`);
        setPreferences(response.data);
      } catch (error) {
        console.error('Error fetching shipping preferences:', error);
        setError('Unable to load your shipping preferences. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchShippingPreferences();
  }, [user?.id]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setPreferences(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (name === 'standard_shipping_fee') {
      const fee = parseFloat(value);
      setPreferences(prev => ({
        ...prev,
        [name]: isNaN(fee) ? 0 : fee
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('You must be logged in to update shipping preferences');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);
      
      await axios.put(`/api/shipping/policy/${user.id}`, preferences);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating shipping preferences:', error);
      setError('Unable to save your shipping preferences. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Shipping Settings</h2>
      
      {isLoading ? (
        <div className="text-center py-4">Loading your shipping preferences...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Free Shipping Option */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="offers_free_shipping"
                checked={preferences.offers_free_shipping}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Offer Free Shipping on all my listings</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Enable this option to provide free shipping on all your items. A "Free Shipping" badge will be displayed on all your product listings.
            </p>
          </div>
          
          {/* Standard Shipping Fee */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Standard Shipping Fee
            </label>
            <div className="relative rounded-md shadow-sm mt-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                name="standard_shipping_fee"
                value={preferences.standard_shipping_fee}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                disabled={preferences.offers_free_shipping}
                className={`block w-full pl-7 pr-12 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  preferences.offers_free_shipping ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">USD</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Set a standard shipping fee for all your listings. This will be displayed on product detail pages.
            </p>
          </div>
          
          {/* Use Calculated Shipping */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="uses_calculated_shipping"
                checked={preferences.uses_calculated_shipping}
                onChange={handleInputChange}
                disabled={preferences.offers_free_shipping || preferences.standard_shipping_fee > 0}
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                  (preferences.offers_free_shipping || preferences.standard_shipping_fee > 0) ? 'cursor-not-allowed' : ''
                }`}
              />
              <span className="ml-2 text-gray-700">Use calculated shipping based on weight and destination</span>
            </label>
            <p className="text-sm text-gray-500 mt-1 ml-6">
              Enable this to calculate shipping costs based on item weight and buyer's location. Buyers will see this information during checkout.
            </p>
          </div>
          
          {/* Shipping Policy */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipping Policy
            </label>
            <textarea
              name="shipping_policy"
              value={preferences.shipping_policy}
              onChange={handleInputChange}
              rows={4}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your shipping policy here. E.g., processing times, shipping carriers, international options, etc."
            />
            <p className="text-sm text-gray-500 mt-1">
              This information will be displayed on product detail pages for customers to see before purchasing.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {saveSuccess && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Your shipping preferences have been saved successfully!</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Shipping Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShippingSettings; 