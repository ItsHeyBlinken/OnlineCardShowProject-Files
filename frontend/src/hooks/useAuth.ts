import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  subscriptionTier?: string;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 