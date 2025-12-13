/**
 * Mock IAM Service
 * Simulates authentication and session management
 */

// Mock user database
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
    role: 'user',
  },
  {
    id: '3',
    username: 'demo',
    password: 'demo123',
    email: 'demo@example.com',
    role: 'user',
  },
];

// Session management
const SESSION_KEY = 'hybrid_ui_session';
const SESSION_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

class IAMService {
  /**
   * Authenticate user with username and password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{success: boolean, user?: object, token?: string, error?: string}>}
   */
  async login(username, password) {
    // Simulate API delay
    await this.delay(500);

    // Find user
    const user = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      return {
        success: false,
        error: 'Invalid username or password',
      };
    }

    // Generate mock session token
    const token = this.generateToken();
    const sessionData = {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      expiresAt: Date.now() + SESSION_EXPIRY_MS,
    };

    // Store session
    this.saveSession(sessionData);

    return {
      success: true,
      user: sessionData.user,
      token,
    };
  }

  /**
   * Get current session
   * @returns {object|null} Session data or null if not authenticated
   */
  getSession() {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Get current user
   * @returns {object|null}
   */
  getCurrentUser() {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Validate session token
   * @param {string} token
   * @returns {boolean}
   */
  validateToken(token) {
    const session = this.getSession();
    return session && session.token === token;
  }

  /**
   * Clear session (logout)
   */
  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Save session to localStorage
   * @private
   */
  saveSession(sessionData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  }

  /**
   * Generate mock session token
   * @private
   */
  generateToken() {
    return (
      'mock_token_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Simulate API delay
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get session expiry time
   * @returns {number|null} Timestamp when session expires, or null if no session
   */
  getSessionExpiry() {
    const session = this.getSession();
    return session ? session.expiresAt : null;
  }

  /**
   * Refresh session expiry
   */
  refreshSession() {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + SESSION_EXPIRY_MS;
      this.saveSession(session);
    }
  }
}

// Export singleton instance
export default new IAMService();
