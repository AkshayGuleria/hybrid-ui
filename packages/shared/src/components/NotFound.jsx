import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NotFound Component
 * 404 page for unknown routes
 */
export function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem',
      background: '#f9fafb'
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>404</div>
      <h1 style={{
        fontSize: '2rem',
        color: '#111827',
        marginBottom: '0.5rem'
      }}>
        Page Not Found
      </h1>
      <p style={{
        color: '#6b7280',
        marginBottom: '2rem',
        maxWidth: '400px'
      }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '500',
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Go Home
      </button>
    </div>
  );
}
