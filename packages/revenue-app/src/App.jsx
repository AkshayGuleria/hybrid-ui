import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, TopNavigation, ProtectedRoute, NotFound } from '@hybrid-ui/shared';
import { RevenueDashboard } from './components/RevenueDashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceDetail } from './components/InvoiceDetail';
import './App.css';

/**
 * Revenue App - Main Component
 * Protected app that requires authentication
 *
 * Routes:
 * - / → Redirect to /dashboard
 * - /dashboard → Revenue dashboard
 * - /invoices → Invoice list
 * - /invoices/:id → Invoice detail view
 * - * → 404 Not Found
 */
function AppContent() {
  const { user, logout, buildAuthUrl } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = 'http://localhost:5173/?logout=true';
  };

  // App links for navigation (with session data for cross-origin auth)
  const appLinks = [
    { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
    { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' }
  ];

  // Determine current view from URL
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const isInvoices = location.pathname.startsWith('/invoices');

  return (
    <div className="app">
      <TopNavigation user={user} onLogout={handleLogout} appLinks={appLinks} />

      <div className="view-tabs">
        <div className="view-tabs-container">
          <button
            className={isDashboard ? 'tab-btn active' : 'tab-btn'}
            onClick={() => navigate('/dashboard')}
          >
            <span className="tab-icon">📊</span>
            Dashboard
          </button>
          <button
            className={isInvoices ? 'tab-btn active' : 'tab-btn'}
            onClick={() => navigate('/invoices')}
          >
            <span className="tab-icon">📄</span>
            Invoices
          </button>
        </div>
      </div>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<RevenueDashboard />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
