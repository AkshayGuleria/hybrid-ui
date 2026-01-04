import React from 'react';
import './TopNavigation.css';

/**
 * Top Navigation Bar - Shared Component
 * Displays app branding, user info, and logout button
 *
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Function} props.onLogout - Logout handler
 * @param {Array} props.appLinks - Optional navigation links to other apps
 */
export function TopNavigation({ user, onLogout, appLinks = [] }) {
  return (
    <nav className="top-navigation">
      <div className="nav-container">
        <a href="http://localhost:5173" className="nav-brand">
          <span className="nav-icon">🏠</span>
          <span className="nav-title">Hybrid UI</span>
        </a>

        <div className="nav-links">
          {appLinks.map((link, index) => (
            <a key={index} href={link.href} className="nav-link">
              {link.icon && <span className="link-icon">{link.icon}</span>}
              {link.label}
            </a>
          ))}
        </div>

        <div className="nav-user">
          {user && (
            <>
              <div className="user-info">
                <span className="user-icon">👤</span>
                <span className="user-name">{user.username}</span>
              </div>
              <button onClick={onLogout} className="logout-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
