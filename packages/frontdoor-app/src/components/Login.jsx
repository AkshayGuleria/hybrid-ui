import React, { useState } from 'react';
import './Login.css';

/**
 * Login Component
 * Handles user authentication with username and password
 */
export function Login({ onLogin, loading, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  const handleAzureLogin = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo') || 'http://localhost:5173';

    // Redirect to auth server Azure AD login
    const azureLoginUrl = new URL('http://localhost:5176/auth/azure/login');
    azureLoginUrl.searchParams.set('returnTo', returnTo);
    window.location.href = azureLoginUrl.toString();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏠</div>
          <h1>Welcome to Hybrid UI</h1>
          <p>Sign in to access your applications</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <button
          onClick={handleAzureLogin}
          className="azure-login-button"
          type="button"
        >
          <span className="microsoft-icon">🔒</span>
          Sign in with Microsoft
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p className="hint-text">
            💡 Development: Use Azure AD or mock login (any username/password)
          </p>
        </div>
      </div>
    </div>
  );
}
