import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  setAuthToken,
} from '../services/api';
import logger from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if we have a stored token
      const token = localStorage.getItem('auth_token');
      const expiry = localStorage.getItem('auth_expiry');

      if (!token || !expiry) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (Date.now() >= parseInt(expiry)) {
        logger.info('Token expired, clearing');
        clearAuthData();
        setIsLoading(false);
        return;
      }

      // Set token in axios headers
      setAuthToken(token);

      // Verify token by fetching current user
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);

      logger.info('Auth initialized successfully', { userId: currentUser.id });
    } catch (error) {
      logger.error('Failed to initialize auth', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiLogin({ username, password });
      const { user: loggedInUser, token, expiresIn } = response;

      // Save token and expiry
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', (Date.now() + expiresIn).toString());

      // Set token in axios headers
      setAuthToken(token);

      // Update state
      setUser(loggedInUser);

      logger.info('Login successful', { userId: loggedInUser.id });
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await apiRegister({ username, password });
      const { user: newUser, token, expiresIn } = response;

      // Save token and expiry
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_expiry', (Date.now() + expiresIn).toString());

      // Set token in axios headers
      setAuthToken(token);

      // Update state
      setUser(newUser);

      logger.info('Registration successful', { userId: newUser.id });
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    logger.info('Logout successful');
  };

  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expiry');
    setAuthToken(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
