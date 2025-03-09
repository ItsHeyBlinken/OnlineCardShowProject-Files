import { useState, useEffect } from 'react';
import axios from 'axios';

interface ShippingPolicy {
  offers_free_shipping: boolean;
  standard_shipping_fee: number;
  shipping_policy?: string;
  uses_calculated_shipping: boolean;
}

/**
 * Custom hook to efficiently fetch shipping policies for multiple sellers
 * @param sellerIds Array of seller IDs to fetch policies for
 * @returns An object containing the shipping policies mapped by seller ID and loading state
 */
export const useShippingPolicies = (sellerIds: number[]) => {
  const [policies, setPolicies] = useState<Record<number, ShippingPolicy>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerIds.length) return;
    
    const fetchPolicies = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Remove duplicate seller IDs
        const uniqueSellerIds = Array.from(new Set(sellerIds));
        
        // Create a map to store shipping policies
        const policiesMap: Record<number, ShippingPolicy> = {};
        
        // Fetch all policies in parallel
        await Promise.all(
          uniqueSellerIds.map(async (sellerId) => {
            try {
              const response = await axios.get(`/api/shipping/policy/${sellerId}`);
              policiesMap[sellerId] = response.data;
            } catch (err) {
              console.error(`Error fetching shipping policy for seller ${sellerId}:`, err);
              // Set default values if fetch fails
              policiesMap[sellerId] = {
                offers_free_shipping: false,
                standard_shipping_fee: 0,
                shipping_policy: '',
                uses_calculated_shipping: false
              };
            }
          })
        );
        
        setPolicies(policiesMap);
      } catch (err) {
        console.error('Error fetching shipping policies:', err);
        setError('Failed to load shipping information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolicies();
  }, [sellerIds]);

  return { policies, loading, error };
};

export default useShippingPolicies; 