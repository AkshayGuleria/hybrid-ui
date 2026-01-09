import { Router } from 'express';
import { TEST_USERS } from '../config.js';
import {
  createSession,
  validateSession,
  invalidateSession,
  refreshSession
} from '../services/session.js';

const router = Router();

/**
 * POST /auth/login
 * Authenticate user with username/password
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
 * Invalidate a session token
 * Request: { sessionToken }
 * Response: { success: true }
 */
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
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
