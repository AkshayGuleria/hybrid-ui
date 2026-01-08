import React, { useEffect, useState } from 'react';
import { useAuth, APP_CONFIG } from '../hooks/useAuth.js';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 *
 * Handles:
 * - Checking for session data in URL params (cross-origin auth)
 * - Handling logout cascade (cross-origin logout)
 * - Redirecting to frontdoor if not authenticated
 * - Showing loading state during auth check
 */
export function ProtectedRoute({ children, appName = 'unknown' }) {
  const {
    isAuthenticated,
    loading,
    logout,
    initSessionFromURL,
    buildLogoutUrl,
    getLogoutFromParam
  } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldLogout = params.get('logout') === 'true';

    if (shouldLogout) {
      // Handle logout cascade - clear this app's localStorage
      setIsLoggingOut(true);
      logout();

      // Get existing "from" param and add this app
      const existingFrom = getLogoutFromParam();
      const redirectUrl = buildLogoutUrl(appName, existingFrom);
      window.location.href = redirectUrl;
      return;
    }

    // Check for session data in URL params (from frontdoor redirect)
    // This handles cross-origin auth transfer on any route
    initSessionFromURL();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    // Once auth check is complete and not loading, check if we need to redirect
    if (authChecked && !loading && !isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      // Redirect to frontdoor with returnTo set to current full URL
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `http://localhost:5173/?returnTo=${returnUrl}`;
    }
  }, [authChecked, loading, isAuthenticated, isRedirecting]);

  // Show logging out state during cascade
  if (isLoggingOut) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>Logging out...</div>
      </div>
    );
  }

  // Show loading spinner while checking auth
  if (loading || !authChecked) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '2rem' }}>Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return children;
}
