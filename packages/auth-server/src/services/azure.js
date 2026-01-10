import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import { MSAL_CONFIG, AZURE_AD_SCOPES, AZURE_AD_REDIRECT_URI } from '../config.js';
import { getRedisClient } from './session.js';

let msalClient = null;

// Initialize MSAL client only if configuration is available
if (MSAL_CONFIG) {
  msalClient = new ConfidentialClientApplication(MSAL_CONFIG);
}

/**
 * Check if Azure AD is configured
 */
export function isAzureADConfigured() {
  return msalClient !== null;
}

/**
 * Get authorization URL for user to login
 */
export async function getAuthUrl(state) {
  if (!msalClient) {
    throw new Error('Azure AD is not configured');
  }

  return msalClient.getAuthCodeUrl({
    scopes: AZURE_AD_SCOPES,
    redirectUri: AZURE_AD_REDIRECT_URI,
    state // Will contain returnTo URL
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  if (!msalClient) {
    throw new Error('Azure AD is not configured');
  }

  const tokenResponse = await msalClient.acquireTokenByCode({
    code,
    scopes: AZURE_AD_SCOPES,
    redirectUri: AZURE_AD_REDIRECT_URI
  });

  return {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresOn: tokenResponse.expiresOn,
    account: tokenResponse.account
  };
}

/**
 * Get user info from Microsoft Graph API
 */
export async function getUserInfo(accessToken) {
  const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return {
    username: response.data.userPrincipalName,
    email: response.data.mail || response.data.userPrincipalName,
    displayName: response.data.displayName,
    role: 'user' // Default role, customize as needed
  };
}

/**
 * Store Azure AD tokens in Redis
 */
export async function storeAzureTokens(sessionToken, tokens) {
  const redis = getRedisClient();
  const key = `azureToken:${sessionToken}`;
  const data = JSON.stringify({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresOn: tokens.expiresOn.toISOString()
  });

  // Store with same TTL as session (30 minutes)
  await redis.setex(key, 1800, data);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(sessionToken) {
  if (!msalClient) {
    throw new Error('Azure AD is not configured');
  }

  const redis = getRedisClient();
  const key = `azureToken:${sessionToken}`;
  const tokenData = await redis.get(key);

  if (!tokenData) {
    throw new Error('No tokens found');
  }

  const tokens = JSON.parse(tokenData);

  const tokenResponse = await msalClient.acquireTokenByRefreshToken({
    refreshToken: tokens.refreshToken,
    scopes: AZURE_AD_SCOPES
  });

  const newTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken || tokens.refreshToken,
    expiresOn: tokenResponse.expiresOn
  };

  await storeAzureTokens(sessionToken, newTokens);
  return newTokens;
}

/**
 * Revoke tokens on logout
 */
export async function revokeAzureTokens(sessionToken) {
  const redis = getRedisClient();
  const key = `azureToken:${sessionToken}`;
  await redis.del(key);
}
