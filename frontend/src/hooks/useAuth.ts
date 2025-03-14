import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  subscription_id?: string;
}

// Custom hook to access auth context with added helpers
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Add a helper function to get auth headers for API calls
  const getAuthHeaders = (): Record<string, string> => {
    // Get token from localStorage (as used in the AuthContext)
    const token = localStorage.getItem('token');
    
    if (!token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // Return the context plus the additional function
  return {
    ...context,
    getAuthHeaders
  };
}; 