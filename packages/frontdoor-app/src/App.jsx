import React, { useEffect } from 'react';
import { useAuth } from '@hybrid-ui/shared';
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
 */
function App() {
  const {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    buildAuthUrl
  } = useAuth();

  // Note: logout parameter (?logout=true) is now handled automatically
  // in useAuth's checkSession() before reading localStorage

  // Handle returnTo when already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');

      if (returnTo) {
        // User is already logged in, redirect to returnTo with session data
        window.location.href = buildAuthUrl(returnTo);
      }
    }
  }, [isAuthenticated, loading, buildAuthUrl]);

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
    return <Login onLogin={handleLogin} loading={loading} error={error} />;
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
