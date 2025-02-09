import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  role: string;
  created_at: string;
  favoriteSport: string | null;
  favoriteTeam: string | null;
  favoritePlayers: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return null;
      }

      const response = await axios.get('/api/auth/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      return null;
    }
  };

  const login = async (userData: User) => {
    setUser(userData);
    setLoading(false);
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
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