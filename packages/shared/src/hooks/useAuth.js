import { useState, useEffect } from 'react';

// Storage keys
const SESSION_TOKEN_KEY = 'sessionToken';
const USER_KEY = 'user';

// App configuration for cross-origin logout cascade
export const APP_CONFIG = {
  frontdoor: { url: 'http://localhost:5173', name: 'frontdoor' },
  crm: { url: 'http://localhost:5174', name: 'crm' },
  revenue: { url: 'http://localhost:5175', name: 'revenue' }
};

// List of apps that need logout (excludes frontdoor - it's the orchestrator)
export const LOGOUT_APPS = ['crm', 'revenue'];

/**
 * Generate a unique session token
 * Uses crypto.randomUUID if available, falls back to custom implementation
 */
const generateSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Authentication hook for managing user session
 * Provides login, logout, and session state management
 *
 * Uses session tokens for cross-origin auth:
 * - sessionToken: unique identifier for the session
 * - user: cached user data
 *
 * Future: sessionToken will be used as Redis key for server-side session storage
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    setLoading(true);
    try {
      // Check for logout parameter FIRST, before reading localStorage
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'true') {
        clearSession();
        // Don't clear URL here - let the app handle cascade logic first
        // URL will be cleaned up after cascade completes
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      // Both token and user must exist for valid session
      if (storedToken && storedUser) {
        setSessionToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        clearSession();
      }
    } catch (err) {
      console.error('Error checking session:', err);
      clearSession();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all session data from localStorage and state
   */
  const clearSession = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSessionToken(null);
    setUser(null);
  };

  /**
   * Store session data in localStorage and state
   */
  const setSession = (token, userData) => {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setSessionToken(token);
    setUser(userData);
  };

  /**
   * Initialize session from URL parameters (for cross-origin auth)
   * Returns true if session was initialized from URL
   */
  const initSessionFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('sessionToken');
    const urlUser = params.get('user');

    if (urlToken && urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser));
        setSession(urlToken, userData);

        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      } catch (err) {
        console.error('Error parsing session from URL:', err);
      }
    }
    return false;
  };

  /**
   * Check if logout was requested via URL parameter
   * Returns true if logout was requested
   * Note: Does NOT clear URL - caller should handle URL cleanup after cascade
   */
  const checkLogoutFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
      clearSession();
      // Don't clear URL here - let cascade logic handle it
      return true;
    }
    return false;
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

      // Generate session token
      const token = generateSessionToken();

      // Mock user object
      const userData = {
        username,
        email: `${username}@example.com`,
        role: 'user',
        loginTime: new Date().toISOString()
      };

      // Store session
      setSession(token, userData);

      return { success: true, sessionToken: token, user: userData };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
    setError(null);
  };

  /**
   * Get session data for cross-origin transfer
   * Returns URL-safe parameters to pass to other apps
   */
  const getSessionParams = () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);

    if (token && userData) {
      return {
        sessionToken: token,
        user: encodeURIComponent(userData)
      };
    }
    return null;
  };

  /**
   * Build URL with session parameters for cross-origin navigation
   */
  const buildAuthUrl = (baseUrl) => {
    const params = getSessionParams();
    if (params) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}sessionToken=${params.sessionToken}&user=${params.user}`;
    }
    return baseUrl;
  };

  /**
   * Build logout URL with "from" parameter for cascade tracking
   * @param {string} currentApp - The app initiating or continuing the logout
   * @param {string} existingFrom - Existing "from" parameter value (if any)
   * @returns {string} - URL to redirect to for logout cascade
   */
  const buildLogoutUrl = (currentApp, existingFrom = '') => {
    const newFrom = existingFrom ? `${existingFrom}|${currentApp}` : currentApp;
    return `${APP_CONFIG.frontdoor.url}/?logout=true&from=${encodeURIComponent(newFrom)}`;
  };

  /**
   * Get the "from" parameter from current URL (for logout cascade)
   * @returns {string} - The "from" parameter value or empty string
   */
  const getLogoutFromParam = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') || '';
  };

  /**
   * Parse the "from" parameter into an array of visited apps
   * @param {string} fromParam - The "from" parameter value
   * @returns {string[]} - Array of app names that have been visited
   */
  const parseVisitedApps = (fromParam) => {
    if (!fromParam) return [];
    return fromParam.split('|').filter(Boolean);
  };

  /**
   * Check if all apps have been visited in the logout cascade
   * @param {string} fromParam - The "from" parameter value
   * @returns {boolean} - True if all apps have cleared their localStorage
   */
  const isLogoutCascadeComplete = (fromParam) => {
    const visited = parseVisitedApps(fromParam);
    return LOGOUT_APPS.every(app => visited.includes(app));
  };

  /**
   * Get the next app to visit in the logout cascade
   * @param {string} fromParam - The "from" parameter value
   * @returns {string|null} - Next app name or null if cascade complete
   */
  const getNextLogoutApp = (fromParam) => {
    const visited = parseVisitedApps(fromParam);
    return LOGOUT_APPS.find(app => !visited.includes(app)) || null;
  };

  return {
    user,
    sessionToken,
    loading,
    error,
    login,
    logout,
    checkSession,
    initSessionFromURL,
    checkLogoutFromURL,
    getSessionParams,
    buildAuthUrl,
    buildLogoutUrl,
    getLogoutFromParam,
    parseVisitedApps,
    isLogoutCascadeComplete,
    getNextLogoutApp,
    isAuthenticated: !!(user && sessionToken)
  };
}
