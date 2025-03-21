import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Extend the User type from types/index.ts with additional properties needed in AuthContext
interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  subscriptionTier?: string;
  subscription_id?: string;
  subscription_status?: string;
  subscription_period_end?: string;
  pending_subscription_tier?: string;
  name?: string;
  created_at?: string;
  favoriteSport?: string;
  favoriteTeam?: string;
  favoritePlayers?: string;
  image_url?: string;
  is_seller?: boolean;
  store_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  forceRefreshUserData: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Check if image_url exists, if not, assign placeholder
      if (userData && !userData.image_url) {
        userData.image_url = '/images/logo1.jpg';
      }
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setLoading(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/user');
        console.log('User data from checkAuth:', response.data);
        
        // Update the user state with the refreshed data
        if (response.data) {
          // Check if image_url exists, if not, assign placeholder
          if (!response.data.image_url) {
            // Use the placeholder image when user has no image
            response.data.image_url = '/images/logo1.jpg';
          } else {
            // Add a timestamp to the image URL to prevent caching if it exists
            response.data.image_url = `${response.data.image_url}?t=${new Date().getTime()}`;
          }
          setUser(response.data);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    }
  }, []);

  const forceRefreshUserData = async () => {
    try {
      // Clear any cached user data
      setUser(null);
      
      // Force a new API call with cache busting
      const response = await fetch(`/api/auth/user?_=${new Date().getTime()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('Refreshed user data:', userData);
        setUser(userData);
        return userData;
      } else {
        console.error('Failed to refresh user data');
        return null;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, forceRefreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
