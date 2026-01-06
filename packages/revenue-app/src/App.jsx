import React, { useEffect, useState } from 'react';
import { useAuth } from '@hybrid-ui/shared';
import { TopNavigation } from '@hybrid-ui/shared';
import { RevenueDashboard } from './components/RevenueDashboard';
import { InvoiceList } from './components/InvoiceList';
import './App.css';

/**
 * Revenue App - Main Component
 * Protected app that requires authentication
 *
 * Authentication Flow:
 * 1. Check URL for sessionToken + user (from frontdoor redirect)
 * 2. If found, store in localStorage and reload
 * 3. If not found and no local session, redirect to frontdoor
 * 4. Logout clears local session and redirects to frontdoor with ?logout=true
 */
function App() {
  const {
    user,
    loading,
    logout,
    isAuthenticated,
    initSessionFromURL,
    buildAuthUrl
  } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'invoices'

  useEffect(() => {
    // Check if session data is passed via URL (from frontdoor redirect)
    // initSessionFromURL() already updates React state via setSession(),
    // so no reload needed - just let React re-render with new state
    initSessionFromURL();
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    // Don't redirect if logout is in progress
    if (isLoggingOut) return;

    // If not authenticated and auth check is done, redirect to frontdoor login
    if (authChecked && !loading && !isAuthenticated) {
      // Redirect to frontdoor (port 5173) with full returnTo URL
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `http://localhost:5173/?returnTo=${returnUrl}`;
    }
  }, [authChecked, loading, isAuthenticated, isLoggingOut]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    window.location.href = 'http://localhost:5173/?logout=true';
  };

  // App links for navigation (with session data for cross-origin auth)
  const appLinks = [
    { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
    { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' }
  ];

  // Show loading state while checking authentication
  if (loading || !authChecked) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Loading Revenue Management...</p>
      </div>
    );
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="app">
      <TopNavigation user={user} onLogout={handleLogout} appLinks={appLinks} />

      <div className="view-tabs">
        <div className="view-tabs-container">
          <button
            className={currentView === 'dashboard' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="tab-icon">📊</span>
            Dashboard
          </button>
          <button
            className={currentView === 'invoices' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setCurrentView('invoices')}
          >
            <span className="tab-icon">📄</span>
            Invoices
          </button>
        </div>
      </div>

      <main className="main-content">
        {currentView === 'dashboard' ? <RevenueDashboard /> : <InvoiceList />}
      </main>
    </div>
  );
}

export default App;
