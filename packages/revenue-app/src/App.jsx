import React, { useEffect, useState } from 'react';
import { useAuth } from '@hybrid-ui/shared';
import { TopNavigation } from '@hybrid-ui/shared';
import { RevenueDashboard } from './components/RevenueDashboard';
import { InvoiceList } from './components/InvoiceList';
import './App.css';

/**
 * Revenue App - Main Component
 * Protected app that requires authentication
 */
function App() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or 'invoices'

  useEffect(() => {
    // Check if user data is passed via URL (from frontdoor redirect)
    const checkAuthFromURL = async () => {
      const params = new URLSearchParams(window.location.search);
      const userData = params.get('user');

      if (userData) {
        try {
          // Decode and parse user data from URL
          const decodedUser = JSON.parse(decodeURIComponent(userData));

          // Store in localStorage for this origin
          localStorage.setItem('user', JSON.stringify(decodedUser));

          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);

          // Reload to pick up the new auth state
          window.location.reload();
          return;
        } catch (err) {
          console.error('Error parsing user data from URL:', err);
        }
      }

      setAuthChecked(true);
    };

    checkAuthFromURL();
  }, []);

  useEffect(() => {
    // If not authenticated and auth check is done, redirect to frontdoor login
    if (authChecked && !loading && !isAuthenticated) {
      // Redirect to frontdoor (port 5173) with full returnTo URL
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `http://localhost:5173/?returnTo=${returnUrl}`;
    }
  }, [authChecked, loading, isAuthenticated]);

  const handleLogout = () => {
    logout();
    // Redirect to frontdoor on port 5173
    window.location.href = 'http://localhost:5173/';
  };

  // App links for navigation
  const appLinks = [
    { label: 'CRM', href: 'http://localhost:5174', icon: '📊' },
    { label: 'Revenue', href: 'http://localhost:5175', icon: '💰' }
  ];

  // Show loading state while checking authentication
  if (loading) {
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

      <main className="main-content">
        {currentView === 'dashboard' ? <RevenueDashboard /> : <InvoiceList />}
      </main>
    </div>
  );
}

export default App;
