import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';

const AuthContext = createContext(null);

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function to clean up localStorage
const cleanupLocalStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('admin');
  localStorage.removeItem('guestMode');
  localStorage.removeItem('selectedRole');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const decodedToken = decodeToken(token);
        const parsedUserData = JSON.parse(userData);
        
        // Verify token hasn't expired
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
          setUser(parsedUserData);
        } else {
          // Token expired, clean up
          cleanupLocalStorage();
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        cleanupLocalStorage();
      }
    }
    setLoading(false);

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) script.remove();
    };
  }, []);

  // Regular login
  const login = async (email, password, role) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user: userData } = await response.json();
      
      // Clean up any existing auth data
      cleanupLocalStorage();
      
      // Store new auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Role-based navigation
      const decodedToken = decodeToken(token);
      if (decodedToken?.role === 'interviewer') {
        navigate('/interviewer-dashboard');
      } else {
        navigate('/home');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Google login/signup
  const handleGoogleAuth = async (googleData) => {
    try {
      const payload = JSON.parse(atob(googleData.credential.split('.')[1]));

      const requestData = {
        ...googleData,
        userData: {
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        }
      };

      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google authentication failed');
      }

      const { token, user: userData } = await response.json();
      
      // Clean up any existing auth data
      cleanupLocalStorage();
      
      // Store new auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Role-based navigation using decoded token
      const decodedToken = decodeToken(token);
      if (decodedToken?.role === 'interviewer') {
        navigate('/interviewer-dashboard');
      } else {
        navigate('/home');
      }

      return { success: true };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    cleanupLocalStorage();
    setUser(null);
    navigate('/');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    handleGoogleAuth,
    isAuthenticated: !!user,
    userRole: user?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
