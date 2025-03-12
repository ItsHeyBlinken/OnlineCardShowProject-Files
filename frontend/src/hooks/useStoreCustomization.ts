import { useState, useEffect } from 'react';
import axios from 'axios';

export interface StoreCustomization {
  bannerImage?: string;
  colorMode?: 'light' | 'dark';
  backgroundColor?: string;
  backgroundImage?: string;
  storeLogo?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  welcomeMessage?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
  };
  viewMode?: 'grid' | 'list';
  featuredProductIds?: string[];
}

export const useStoreCustomization = (storeId: string) => {
  const [customization, setCustomization] = useState<StoreCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const response = await axios.get(`/api/stores/${storeId}`);
        setCustomization(response.data.customization);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          const savedCustomization = localStorage.getItem('storeCustomization');
          if (savedCustomization) {
            setCustomization(JSON.parse(savedCustomization));
          }
        } else {
          setError('Failed to load store customization');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomization();
  }, [storeId]);

  const updateCustomization = async (updates: Partial<StoreCustomization>) => {
    try {
      const updatedCustomization = {
        ...customization,
        ...updates
      };

      if (process.env.NODE_ENV === 'development') {
        // In development, save to localStorage
        localStorage.setItem('storeCustomization', JSON.stringify(updatedCustomization));
        setCustomization(updatedCustomization);
        return Promise.resolve();
      } else {
        // In production, send to API
        const response = await axios.put(`/api/stores/${storeId}`, {
          customization: updatedCustomization
        });
        setCustomization(response.data.customization);
        return response;
      }
    } catch (error) {
      setError('Failed to update store customization');
      return Promise.reject(error);
    }
  };

  return { customization, updateCustomization, loading, error };
};