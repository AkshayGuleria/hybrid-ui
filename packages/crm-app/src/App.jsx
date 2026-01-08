import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, TopNavigation, ProtectedRoute, NotFound } from '@hybrid-ui/shared';
import { CustomerList } from './components/CustomerList';
import { CustomerDetail } from './components/CustomerDetail';
import { ToastProvider } from './components/Toast';
import './App.css';

/**
 * CRM App - Main Component
 * Protected app that requires authentication
 *
 * Routes:
 * - / → Redirect to /customers
 * - /customers → Customer list
 * - /customers/:id → Customer detail view
 * - * → 404 Not Found
 *
 * Cross-Origin Logout:
 * Logout initiates cascade: CRM → Frontdoor → Revenue → Frontdoor (complete)
 */
function AppContent() {
  const { user, logout, buildAuthUrl, buildLogoutUrl } = useAuth();

  const handleLogout = () => {
    logout();
    // Start logout cascade with "from=crm"
    window.location.href = buildLogoutUrl('crm');
  };

  // App links for navigation (with session data for cross-origin auth)
  const appLinks = [
    { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
    { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' }
  ];

  return (
    <div className="app">
      <TopNavigation user={user} onLogout={handleLogout} appLinks={appLinks} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/customers" replace />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route
            path="/*"
            element={
              <ProtectedRoute appName="crm">
                <AppContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
