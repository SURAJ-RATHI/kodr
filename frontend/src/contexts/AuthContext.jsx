import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL ;

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

// Helper function to check if token is valid and not expired
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = decodeToken(token);
    return decoded && decoded.exp * 1000 > Date.now();
  } catch {
    return false;
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
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('selectedRole') || null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    console.log('[AuthContext] Initial token:', token);
    console.log('[AuthContext] Initial userData:', userData);
    
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
    console.log('[AuthContext] After init:', { user, loading, isAuthenticated: !loading && !!user && isTokenValid(token) });

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

  // Persist selectedRole to localStorage
  useEffect(() => {
    if (selectedRole) {
      localStorage.setItem('selectedRole', selectedRole);
    } else {
      localStorage.removeItem('selectedRole');
    }
  }, [selectedRole]);

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
        // Do not show popup, just return error
        return { success: false, error: errorData.message || 'Login failed' };
      }

      const { token, user: userData } = await response.json();
      
      // Clean up any existing auth data
      cleanupLocalStorage();
      
      // Store new auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      console.log('[AuthContext] After login:', { user: userData, token, isAuthenticated: isTokenValid(token) });
      // Role-based navigation with redirect support
      const decodedToken = decodeToken(token);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (decodedToken?.role === 'interviewer') {
        navigate('/interviewer-dashboard');
      } else {
        navigate('/home');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      // Do not show popup, just return error
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
      console.log('[AuthContext] After login:', { user: userData, token, isAuthenticated: isTokenValid(token) });
      // Role-based navigation with redirect support
      const decodedToken = decodeToken(token);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
      } else if (decodedToken?.role === 'interviewer') {
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
    isAuthenticated: !loading && !!user && isTokenValid(localStorage.getItem('token')),
    userRole: user?.role,
    selectedRole,
    setSelectedRole,
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
