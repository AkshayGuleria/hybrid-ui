import { useState, useEffect } from 'react';

/**
 * Authentication hook for managing user session
 * Provides login, logout, and session state management
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error checking session:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Mock authentication - replace with real API call later
      // For now, accept any non-empty username/password
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock user object
      const userData = {
        username,
        email: `${username}@example.com`,
        role: 'user',
        loginTime: new Date().toISOString()
      };

      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkSession,
    isAuthenticated: !!user
  };
}
