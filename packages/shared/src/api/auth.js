/**
 * Auth Server API Client
 * Provides functions to communicate with the auth server for session management
 */

// Auth server configuration
export const AUTH_SERVER_URL = 'http://localhost:5176';

/**
 * Login with username and password
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{sessionToken?: string, user?: object, expiresAt?: string, error?: string}>}
 */
export async function serverLogin(username, password) {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

/**
 * Validate a session token
 * @param {string} sessionToken
 * @returns {Promise<{valid: boolean, user?: object, expiresAt?: string}>}
 */
export async function serverValidate(sessionToken) {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken })
  });
  return response.json();
}

/**
 * Logout and invalidate session
 * @param {string} sessionToken
 * @returns {Promise<{success: boolean}>}
 */
export async function serverLogout(sessionToken) {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken })
  });
  return response.json();
}

/**
 * Refresh session (extend TTL)
 * @param {string} sessionToken
 * @returns {Promise<{sessionToken?: string, expiresAt?: string, valid?: boolean}>}
 */
export async function serverRefresh(sessionToken) {
  const response = await fetch(`${AUTH_SERVER_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionToken })
  });
  return response.json();
}

/**
 * Check if auth server is available
 * @returns {Promise<boolean>}
 */
export async function isAuthServerAvailable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${AUTH_SERVER_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
