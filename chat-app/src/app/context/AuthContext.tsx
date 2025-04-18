'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Determine the API URL based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
                (process.env.NODE_ENV === 'production' 
                  ? '/api'  // In production, use relative path
                  : 'http://localhost:5000/api'); // In development, use localhost

interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
  gender: string;
  lookingFor: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<any>;
  logout: () => void;
  clearError: () => void;
  verifyEmail: (token: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  gender: string;
  lookingFor: string;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from local storage on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        
        if (!storedToken) {
          setLoading(false);
          return;
        }
        
        setToken(storedToken);
        
        // Configure axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Get user data
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Register user
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate VIT email
      if (!userData.email.endsWith('@vitstudent.ac.in')) {
        setError('Please use a valid VIT student email (@vitstudent.ac.in)');
        setLoading(false);
        return null;
      }
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Don't automatically log in - user needs to verify email
      setLoading(false);
      
      // Return the response data for special handling
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
      return null;
    }
  };

  // Verify email
  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed.');
      setLoading(false);
    }
  };

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate VIT email
      if (!email.endsWith('@vitstudent.ac.in')) {
        setError('Please use a valid VIT student email (@vitstudent.ac.in)');
        setLoading(false);
        return;
      }
      
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      // Save token to local storage
      localStorage.setItem('token', res.data.token);
      
      // Set auth header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Clear error message
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        verifyEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 