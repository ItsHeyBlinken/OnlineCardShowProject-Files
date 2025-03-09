import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

interface ShippingAddress {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

const initialAddress: ShippingAddress = {
  name: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  phone: '',
  is_default: true
};

interface ShippingAddressFormProps {
  onSaved?: () => void;
}

const ShippingAddressForm: React.FC<ShippingAddressFormProps> = ({ onSaved }) => {
  const { user } = useAuth();
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // US states for dropdown
  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  // Fetch user's saved shipping address
  useEffect(() => {
    const fetchAddress = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/users/${user.id}/shipping-address`);
        if (response.data) {
          setAddress(response.data);
        }
      } catch (err) {
        console.error('Error fetching shipping address:', err);
        // If 404, it means no address is saved yet, which is fine
        if (axios.isAxiosError(err) && err.response?.status !== 404) {
          setError('Failed to load your shipping address. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAddress();
  }, [user]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setAddress(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setAddress(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Save shipping address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to save a shipping address');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);
      
      await axios.post(`/api/users/${user.id}/shipping-address`, address);
      
      setSaveSuccess(true);
      if (onSaved) onSaved();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving shipping address:', err);
      setError('Failed to save your shipping address. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-4">Loading your shipping information...</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={address.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* Address Line 1 */}
        <div className="mb-4">
          <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address
          </label>
          <input
            type="text"
            id="address_line1"
            name="address_line1"
            value={address.address_line1}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {/* Address Line 2 */}
        <div className="mb-4">
          <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
            Apartment, suite, etc. (optional)
          </label>
          <input
            type="text"
            id="address_line2"
            name="address_line2"
            value={address.address_line2}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        {/* City, State, Zip in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={address.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          {/* State */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <select
              id="state"
              name="state"
              value={address.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a state</option>
              {US_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          {/* Zip Code */}
          <div>
            <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
              ZIP / Postal Code
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={address.postal_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>
        
        {/* Country */}
        <div className="mb-4">
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={address.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            {/* Add more countries as needed */}
          </select>
        </div>
        
        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={address.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
          <p className="mt-1 text-sm text-gray-500">For shipping-related questions</p>
        </div>
        
        {/* Default Address Checkbox */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_default"
              checked={address.is_default}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Use as my default shipping address</span>
          </label>
        </div>
        
        {/* Error and Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
            {error}
          </div>
        )}
        
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-700">
            Your shipping address has been saved successfully!
          </div>
        )}
        
        {/* Save Button */}
        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
          >
            {isSaving ? 'Saving...' : 'Save Shipping Address'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShippingAddressForm; 