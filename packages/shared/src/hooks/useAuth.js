import { useState, useEffect, useCallback } from 'react';
import {
  serverLogin,
  serverValidate,
  serverLogout,
  serverRefresh,
  isAuthServerAvailable,
  AUTH_SERVER_URL
} from '../api/auth.js';

// Storage keys
const SESSION_TOKEN_KEY = 'sessionToken';
const USER_KEY = 'user';
const EXPIRES_AT_KEY = 'expiresAt';

// Session validation configuration
export const VALIDATION_INTERVAL_MS = 30000; // 30 seconds
export const SESSION_REFRESH_BUFFER_MS = 300000; // 5 minutes before expiry

// Re-export auth server URL for other components
export { AUTH_SERVER_URL };

// App configuration for cross-origin logout cascade (Phase 1 - kept for fallback)
export const APP_CONFIG = {
  frontdoor: { url: 'http://localhost:5173', name: 'frontdoor' },
  crm: { url: 'http://localhost:5174', name: 'crm' },
  revenue: { url: 'http://localhost:5175', name: 'revenue' }
};

// List of apps that need logout (excludes frontdoor - it's the orchestrator)
export const LOGOUT_APPS = ['crm', 'revenue'];

/**
 * Generate a unique session token (fallback for mock auth)
 */
const generateSessionToken = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Authentication hook for managing user session
 * Supports both server-side sessions (Phase 2) and fallback mock auth
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
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
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedExpiresAt = localStorage.getItem(EXPIRES_AT_KEY);

      if (storedToken && storedUser) {
        setSessionToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedExpiresAt) {
          setExpiresAt(storedExpiresAt);
        }
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
    localStorage.removeItem(EXPIRES_AT_KEY);
    setSessionToken(null);
    setUser(null);
    setExpiresAt(null);
  };

  /**
   * Store session data in localStorage and state
   */
  const setSession = (token, userData, expires = null) => {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    if (expires) {
      localStorage.setItem(EXPIRES_AT_KEY, expires);
      setExpiresAt(expires);
    }
    setSessionToken(token);
    setUser(userData);
  };

  /**
   * Initialize session from URL parameters (for cross-origin auth)
   */
  const initSessionFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('sessionToken');
    const urlUser = params.get('user');

    if (urlToken && urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser));
        setSession(urlToken, userData);
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
   */
  const checkLogoutFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
      clearSession();
      return true;
    }
    return false;
  };

  /**
   * Login with username and password
   * Uses server auth if available, falls back to mock auth
   */
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Try server auth first
      const serverAvailable = await isAuthServerAvailable();

      if (serverAvailable) {
        const result = await serverLogin(username, password);

        if (result.error) {
          setError(result.error);
          return { success: false, error: result.error };
        }

        const { sessionToken: token, user: userData, expiresAt: expires } = result;
        setSession(token, userData, expires);

        return { success: true, sessionToken: token, user: userData };
      } else {
        // Fallback to mock auth
        console.warn('Auth server unavailable, using mock auth');
        await new Promise(resolve => setTimeout(resolve, 500));

        const token = generateSessionToken();
        const userData = {
          username,
          email: `${username}@example.com`,
          role: 'user',
          loginTime: new Date().toISOString()
        };

        setSession(token, userData);
        return { success: true, sessionToken: token, user: userData };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout - invalidates session server-side and clears local storage
   */
  const logout = async () => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);

    // Invalidate server-side FIRST (await to ensure it completes)
    if (token) {
      try {
        await serverLogout(token);
        console.log('Server session invalidated successfully');
      } catch (err) {
        console.warn('Server logout failed:', err);
      }
    }

    // Then clear local session
    clearSession();
    setError(null);
  };

  /**
   * Validate session with server
   * Returns true if session is valid, false if invalid
   */
  const validateSession = useCallback(async () => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    try {
      const result = await serverValidate(token);

      if (!result.valid) {
        clearSession();
        return false;
      }

      // Update user data and expiry from server
      if (result.user) {
        setUser(result.user);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      }
      if (result.expiresAt) {
        setExpiresAt(result.expiresAt);
        localStorage.setItem(EXPIRES_AT_KEY, result.expiresAt);
      }

      return true;
    } catch (err) {
      console.warn('Session validation failed (network error):', err);
      // Graceful degradation: assume valid on network error
      return true;
    }
  }, [sessionToken]);

  /**
   * Refresh session if nearing expiry
   */
  const refreshSessionIfNeeded = useCallback(async () => {
    const expires = expiresAt || localStorage.getItem(EXPIRES_AT_KEY);
    if (!expires) return;

    const expiryTime = new Date(expires).getTime();
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;

    // Refresh if within 5 minutes of expiry
    if (timeUntilExpiry <= SESSION_REFRESH_BUFFER_MS && timeUntilExpiry > 0) {
      const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        try {
          const result = await serverRefresh(token);
          if (result.expiresAt) {
            setExpiresAt(result.expiresAt);
            localStorage.setItem(EXPIRES_AT_KEY, result.expiresAt);
          }
        } catch (err) {
          console.warn('Session refresh failed:', err);
        }
      }
    }
  }, [expiresAt, sessionToken]);

  /**
   * Get session data for cross-origin transfer
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

  // === Phase 1 Logout Cascade Functions (kept for fallback) ===

  const buildLogoutUrl = (currentApp, existingFrom = '') => {
    const newFrom = existingFrom ? `${existingFrom}|${currentApp}` : currentApp;
    return `${APP_CONFIG.frontdoor.url}/?logout=true&from=${encodeURIComponent(newFrom)}`;
  };

  const getLogoutFromParam = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('from') || '';
  };

  const parseVisitedApps = (fromParam) => {
    if (!fromParam) return [];
    return fromParam.split('|').filter(Boolean);
  };

  const isLogoutCascadeComplete = (fromParam) => {
    const visited = parseVisitedApps(fromParam);
    return LOGOUT_APPS.every(app => visited.includes(app));
  };

  const getNextLogoutApp = (fromParam) => {
    const visited = parseVisitedApps(fromParam);
    return LOGOUT_APPS.find(app => !visited.includes(app)) || null;
  };

  return {
    user,
    sessionToken,
    expiresAt,
    loading,
    error,
    login,
    logout,
    checkSession,
    initSessionFromURL,
    checkLogoutFromURL,
    validateSession,
    refreshSessionIfNeeded,
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
