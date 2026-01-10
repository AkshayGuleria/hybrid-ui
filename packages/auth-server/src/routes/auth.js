import { Router } from 'express';
import { TEST_USERS } from '../config.js';
import {
  createSession,
  validateSession,
  invalidateSession,
  refreshSession
} from '../services/session.js';
import {
  isAzureADConfigured,
  getAuthUrl,
  exchangeCodeForTokens,
  getUserInfo,
  storeAzureTokens,
  revokeAzureTokens
} from '../services/azure.js';

const router = Router();

/**
 * GET /auth/azure/login
 * Initiate Azure AD OAuth flow
 * Query params: { returnTo }
 * Redirects to Azure AD login page
 */
router.get('/azure/login', async (req, res) => {
  try {
    if (!isAzureADConfigured()) {
      console.error('Azure AD login attempted but Azure AD is not configured');
      return res.redirect('http://localhost:5173?error=azure_not_configured');
    }

    const returnTo = req.query.returnTo || 'http://localhost:5173';

    // Encode returnTo in state parameter
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64');

    const authUrl = await getAuthUrl(state);
    console.log(`Redirecting to Azure AD for authentication, returnTo: ${returnTo}`);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Azure AD login error:', error);
    res.redirect('http://localhost:5173?error=azure_login_failed');
  }
});

/**
 * GET /auth/azure/callback
 * Azure AD OAuth callback handler
 * Query params: { code, state }
 * Redirects to frontdoor with session token
 */
router.get('/azure/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      throw new Error('No authorization code received');
    }

    // Decode state to get returnTo URL
    const { returnTo } = JSON.parse(Buffer.from(state, 'base64').toString());

    console.log('Received Azure AD callback, exchanging code for tokens...');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info from Microsoft Graph
    const userInfo = await getUserInfo(tokens.accessToken);

    console.log(`Azure AD user authenticated: ${userInfo.username}`);

    // Create user session
    const user = {
      username: userInfo.username,
      email: userInfo.email,
      displayName: userInfo.displayName,
      role: userInfo.role,
      authProvider: 'azure-ad'
    };

    const { sessionToken, expiresAt } = await createSession(user);

    // Store Azure AD tokens in Redis
    await storeAzureTokens(sessionToken, tokens);

    console.log(`Session created for Azure AD user: ${sessionToken.substring(0, 8)}...`);

    // Redirect to frontdoor with session token
    const redirectUrl = new URL('http://localhost:5173/auth-success');
    redirectUrl.searchParams.set('sessionToken', sessionToken);
    redirectUrl.searchParams.set('returnTo', returnTo);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Azure AD callback error:', error);
    res.redirect('http://localhost:5173?error=azure_auth_failed');
  }
});

/**
 * POST /auth/login
 * Authenticate user with username/password (mock authentication for development)
 * Request: { username, password }
 * Response: { sessionToken, user, expiresAt } or { error }
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user exists and password matches
    const testUser = TEST_USERS[username];
    if (!testUser || testUser.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const user = {
      username,
      email: testUser.email,
      role: testUser.role
    };

    const { sessionToken, expiresAt } = await createSession(user);

    console.log(`User '${username}' logged in, session: ${sessionToken.substring(0, 8)}...`);

    res.json({
      sessionToken,
      user,
      expiresAt
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /auth/validate
 * Validate a session token
 * Request: { sessionToken }
 * Response: { valid: true, user, expiresAt } or { valid: false }
 */
router.post('/validate', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.json({ valid: false });
    }

    const sessionData = await validateSession(sessionToken);

    if (!sessionData) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      user: {
        username: sessionData.username,
        email: sessionData.email,
        role: sessionData.role
      },
      expiresAt: sessionData.expiresAt
    });
  } catch (err) {
    console.error('Validate error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

/**
 * POST /auth/logout
 * Invalidate a session token and revoke Azure AD tokens if present
 * Request: { sessionToken }
 * Response: { success: true }
 */
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      // Revoke Azure AD tokens if they exist (idempotent)
      await revokeAzureTokens(sessionToken);

      // Invalidate session
      const deleted = await invalidateSession(sessionToken);
      if (deleted) {
        console.log(`Session invalidated: ${sessionToken.substring(0, 8)}...`);
      }
    }

    // Always return success (idempotent)
    res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    // Still return success - logout should be idempotent
    res.json({ success: true });
  }
});

/**
 * POST /auth/refresh
 * Refresh a session (extend TTL)
 * Request: { sessionToken }
 * Response: { sessionToken, expiresAt } or { valid: false }
 */
router.post('/refresh', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(401).json({ valid: false });
    }

    const result = await refreshSession(sessionToken);

    if (!result) {
      return res.status(401).json({ valid: false });
    }

    console.log(`Session refreshed: ${sessionToken.substring(0, 8)}...`);

    res.json(result);
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

export default router;
