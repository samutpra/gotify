'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  admin: boolean;
}

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  credentials: AuthCredentials | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored authentication on mount
    const storedAuth = localStorage.getItem('gotify_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.user && authData.credentials) {
          setUser(authData.user);
          setCredentials(authData.credentials);
        }
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('gotify_auth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', username);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);

      if (response.ok) {
        const authData = await response.json();
        console.log('Login response data:', authData);

        if (authData.success) {
          console.log('Setting user data:', authData.user);
          setUser(authData.user);
          setCredentials(authData.credentials);
          localStorage.setItem('gotify_auth', JSON.stringify(authData));
          console.log('Login successful, user authenticated');
          return true;
        }
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCredentials(null);
    localStorage.removeItem('gotify_auth');
  };

  const value = {
    user,
    credentials,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}