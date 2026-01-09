import 'dotenv/config';

// Server configuration
export const PORT = process.env.PORT || 5176;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Redis configuration
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Session configuration
export const SESSION_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || '1800', 10); // 30 minutes

// CORS configuration - allowed origins for cross-origin requests
export const CORS_ORIGINS = [
  'http://localhost:5173', // Frontdoor
  'http://localhost:5174', // CRM
  'http://localhost:5175'  // Revenue
];

// Test users (username -> { password, role, email })
export const TEST_USERS = {
  admin: {
    password: 'admin',
    role: 'admin',
    email: 'admin@example.com'
  },
  user: {
    password: 'user',
    role: 'user',
    email: 'user@example.com'
  },
  demo: {
    password: 'demo',
    role: 'demo',
    email: 'demo@example.com'
  }
};
