import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_URL, SESSION_TTL_SECONDS } from '../config.js';

// Initialize Redis client
const redis = new Redis(REDIS_URL, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

// Connect to Redis
export async function connectRedis() {
  try {
    await redis.connect();
    return true;
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
    return false;
  }
}

// Session key prefix
const SESSION_PREFIX = 'session:';

/**
 * Create a new session in Redis
 * @param {Object} user - User data to store in session
 * @returns {Object} - { sessionToken, expiresAt }
 */
export async function createSession(user) {
  const sessionToken = uuidv4();
  const sessionKey = `${SESSION_PREFIX}${sessionToken}`;
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  const sessionData = {
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt,
    expiresAt
  };

  await redis.setex(sessionKey, SESSION_TTL_SECONDS, JSON.stringify(sessionData));

  return { sessionToken, expiresAt };
}

/**
 * Validate a session token and return user data if valid
 * @param {string} sessionToken - The session token to validate
 * @returns {Object|null} - Session data if valid, null if invalid
 */
export async function validateSession(sessionToken) {
  if (!sessionToken) return null;

  const sessionKey = `${SESSION_PREFIX}${sessionToken}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) return null;

  try {
    const parsed = JSON.parse(sessionData);
    // Get remaining TTL to calculate new expiresAt
    const ttl = await redis.ttl(sessionKey);
    if (ttl > 0) {
      parsed.expiresAt = new Date(Date.now() + ttl * 1000).toISOString();
    }
    return parsed;
  } catch (err) {
    console.error('Error parsing session data:', err);
    return null;
  }
}

/**
 * Invalidate a session (logout)
 * @param {string} sessionToken - The session token to invalidate
 * @returns {boolean} - True if session was deleted
 */
export async function invalidateSession(sessionToken) {
  if (!sessionToken) return false;

  const sessionKey = `${SESSION_PREFIX}${sessionToken}`;
  const result = await redis.del(sessionKey);

  return result > 0;
}

/**
 * Refresh a session (extend TTL)
 * @param {string} sessionToken - The session token to refresh
 * @returns {Object|null} - { expiresAt } if refreshed, null if session not found
 */
export async function refreshSession(sessionToken) {
  if (!sessionToken) return null;

  const sessionKey = `${SESSION_PREFIX}${sessionToken}`;
  const sessionData = await redis.get(sessionKey);

  if (!sessionData) return null;

  // Reset the TTL
  await redis.expire(sessionKey, SESSION_TTL_SECONDS);

  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();

  // Update the expiresAt in the session data
  try {
    const parsed = JSON.parse(sessionData);
    parsed.expiresAt = expiresAt;
    await redis.setex(sessionKey, SESSION_TTL_SECONDS, JSON.stringify(parsed));
  } catch (err) {
    console.error('Error updating session data:', err);
  }

  return { sessionToken, expiresAt };
}

/**
 * Get Redis client for direct access if needed
 */
export function getRedisClient() {
  return redis;
}
