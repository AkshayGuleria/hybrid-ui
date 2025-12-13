import { createContext, useContext, useState, useEffect } from 'react';
import iamService from '../services/iamService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Check if user has valid session
  const checkSession = () => {
    setLoading(true);
    const currentUser = iamService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  };

  // Login function
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iamService.login(username, password);

      if (result.success) {
        setUser(result.user);

        // Redirect to main-app after successful login
        window.location.href = 'http://localhost:5174';

        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = 'An error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function (placeholder for now)
  const logout = () => {
    iamService.clearSession();
    setUser(null);
    setError(null);
  };

  // Refresh session
  const refreshSession = () => {
    iamService.refreshSession();
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
