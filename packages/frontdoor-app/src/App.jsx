import React, { useEffect, useState } from 'react';
import { useAuth, APP_CONFIG } from '@hybrid-ui/shared';
import { TopNavigation } from '@hybrid-ui/shared';
import { Login } from './components/Login';
import './App.css';

/**
 * Frontdoor App - Main Component
 * Handles authentication and navigation to other apps
 *
 * Authentication Flow:
 * 1. User logs in -> generates sessionToken + user data
 * 2. Navigation to other apps -> passes sessionToken + user via URL
 * 3. Logout -> clears session, other apps redirect here with ?logout=true
 *
 * Cross-Origin Logout Cascade:
 * Frontdoor orchestrates the logout cascade using the "from" parameter.
 * Flow: App logout → Frontdoor → Next App → Frontdoor → ... → Complete
 * The "from" param tracks which apps have cleared their localStorage.
 */
function App() {
  const {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    buildAuthUrl,
    isLogoutCascadeComplete,
    getNextLogoutApp
  } = useAuth();

  // Track if we're in the middle of a logout cascade
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Local error state for session expired message
  const [sessionExpiredError, setSessionExpiredError] = useState(null);

  // Handle Azure AD auth success callback
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Check if we're on the /auth-success route
    if (path === '/auth-success') {
      const sessionToken = params.get('sessionToken');
      const returnTo = params.get('returnTo');

      if (sessionToken && returnTo) {
        // Store session in frontdoor's localStorage
        localStorage.setItem('sessionToken', sessionToken);

        // Fetch user data from session validation
        fetch('http://localhost:5176/auth/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        })
          .then(res => res.json())
          .then(data => {
            if (data.valid) {
              localStorage.setItem('user', JSON.stringify(data.user));
              localStorage.setItem('expiresAt', data.expiresAt);

              // Redirect to original destination with session params
              const authUrl = buildAuthUrl(returnTo);
              window.location.href = authUrl;
            } else {
              console.error('Session validation failed');
              window.location.href = '/?error=session_validation_failed';
            }
          })
          .catch(err => {
            console.error('Session validation failed:', err);
            window.location.href = '/?error=session_validation_failed';
          });
      } else {
        // Missing parameters, redirect to home
        window.location.href = '/';
      }

      // Prevent the rest of the component from rendering during redirect
      return;
    }
  }, [buildAuthUrl]);

  // Handle logout cascade orchestration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldLogout = params.get('logout') === 'true';
    const fromParam = params.get('from') || '';

    if (shouldLogout) {
      setIsLoggingOut(true);

      // Async IIFE to await logout before continuing cascade
      (async () => {
        // Clear frontdoor localStorage and invalidate server session
        await logout();

        // Check if cascade is complete
        if (isLogoutCascadeComplete(fromParam)) {
          // All apps have logged out - stay on login page
          window.history.replaceState({}, '', '/');
          setIsLoggingOut(false);
        } else {
          // Find next app to logout
          const nextApp = getNextLogoutApp(fromParam);
          if (nextApp) {
            // Add frontdoor to the "from" chain and redirect to next app
            const newFrom = fromParam ? `${fromParam}|frontdoor` : 'frontdoor';
            const nextUrl = `${APP_CONFIG[nextApp].url}/?logout=true&from=${encodeURIComponent(newFrom)}`;
            window.location.href = nextUrl;
          } else {
            // Fallback: no next app found, complete
            window.history.replaceState({}, '', '/');
            setIsLoggingOut(false);
          }
        }
      })();
    }
  }, [logout, isLogoutCascadeComplete, getNextLogoutApp]);

  // Handle session expired message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sessionExpired') === 'true') {
      setSessionExpiredError('Your session has expired. Please log in again.');
      // Clean up URL
      params.delete('sessionExpired');
      const newSearch = params.toString();
      const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Handle returnTo when already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading && !isLoggingOut) {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');

      if (returnTo) {
        // User is already logged in, redirect to returnTo with session data
        window.location.href = buildAuthUrl(returnTo);
      }
    }
  }, [isAuthenticated, loading, buildAuthUrl, isLoggingOut]);

  const handleLogin = async (username, password) => {
    const result = await login(username, password);
    if (result.success) {
      // Check for returnTo parameter
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');

      if (returnTo) {
        // Build redirect URL with session data
        const separator = returnTo.includes('?') ? '&' : '?';
        const encodedUser = encodeURIComponent(JSON.stringify(result.user));
        const redirectUrl = `${returnTo}${separator}sessionToken=${result.sessionToken}&user=${encodedUser}`;
        window.location.href = redirectUrl;
      }
    }
  };

  const handleLogout = () => {
    logout();
  };

  // App links for navigation (with session data for cross-origin auth)
  const appLinks = [
    { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
    { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' }
  ];

  // Show logging out state during cascade
  if (isLoggingOut) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔄</div>
        <p>Logging out...</p>
      </div>
    );
  }

  // Show loading state while checking session
  if (loading && !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} loading={loading} error={sessionExpiredError || error} />;
  }

  // Show authenticated view with navigation
  return (
    <div className="app">
      <TopNavigation user={user} onLogout={handleLogout} appLinks={appLinks} />

      <main className="main-content">
        <div className="welcome-section">
          <h1>Welcome, {user.username}! 👋</h1>
          <p className="welcome-message">
            You're successfully logged in to the Frontdoor app.
          </p>

          <div className="app-launcher">
            <h2>Available Applications</h2>
            <p className="launcher-description">
              Your applications will appear here once they're integrated.
            </p>

            <div className="app-grid">
              <a href={buildAuthUrl('http://localhost:5174')} className="app-card">
                <div className="app-icon">📊</div>
                <h3>CRM</h3>
                <p>Customer Relationship Management</p>
              </a>

              <a href={buildAuthUrl('http://localhost:5175')} className="app-card">
                <div className="app-icon">💰</div>
                <h3>Revenue Management</h3>
                <p>Financial Analytics & Billing</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
