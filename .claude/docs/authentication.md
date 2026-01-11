# Authentication Architecture

## Overview

The Hybrid UI system implements a **session token-based cross-origin authentication** pattern with **Azure AD (Entra ID) integration** designed for micro-frontends running on different ports (different origins). This architecture enables secure authentication sharing across multiple independent React applications without relying on shared cookies or localStorage.

### Authentication Methods

The system supports two authentication methods:

1. **Azure AD (Entra ID)** - Enterprise OAuth 2.0 authentication via Microsoft
   - Production-ready authentication
   - OAuth 2.0 authorization code flow
   - Server-side token storage in Redis
   - Access and refresh tokens never exposed to browser

2. **Mock Authentication** - Development fallback
   - Accepts any username/password
   - Useful for local development without Azure AD subscription

### Why This Architecture?

**The Challenge:**
- Apps run on different ports (`localhost:5173`, `localhost:5174`, `localhost:5175`)
- Different ports = different origins = separate localStorage (browser security)
- Cannot use cookies (CORS restrictions for different origins)
- Cannot share localStorage directly (browser isolation)

**The Solution:**
- Session token-based authentication
- URL parameter passing for cross-origin auth transfer
- Each app maintains its own localStorage after initial auth transfer
- Centralized authentication via Frontdoor app

## Key Components

### 1. Session Token System

Each authenticated session has two pieces of data:

```javascript
// sessionToken: UUID for identifying the session
// Example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"

// user: JSON object with user data
{
  username: "john",
  email: "john@example.com",
  role: "user",
  loginTime: "2025-01-06T12:00:00.000Z"
}
```

**Storage:**
- `localStorage.setItem('sessionToken', token)`
- `localStorage.setItem('user', JSON.stringify(userData))`

**Server-Side Storage (Implemented):**
The sessionToken serves as a Redis key for server-side session storage:
- **Session Storage:** `session:{sessionToken}` - User data and expiry (30 min TTL)
- **Azure AD Tokens:** `azureToken:{sessionToken}` - Access/refresh tokens (30 min TTL)
- Centralized session management via Auth Server (port 5176)
- Periodic session validation (every 30 seconds)
- Remote session invalidation on logout
- Automatic session refresh 5 minutes before expiry

### 2. Authentication Flow States

```
┌─────────────────────────────────────────────────────┐
│                   Not Authenticated                 │
│  - No sessionToken in localStorage                  │
│  - No user data in localStorage                     │
│  - Redirect to frontdoor required                   │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│                 Authentication Transfer             │
│  - URL contains sessionToken + user parameters      │
│  - Data saved to localStorage                       │
│  - URL cleaned, page reloaded                       │
└─────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────┐
│                    Authenticated                    │
│  - sessionToken in localStorage ✓                   │
│  - user data in localStorage ✓                      │
│  - Can access protected app                         │
└─────────────────────────────────────────────────────┘
```

## Azure AD Authentication Flow

### Complete OAuth 2.0 Flow

```
1. User visits protected app (CRM) → Redirects to Frontdoor
   │
2. User clicks "Sign in with Microsoft" → Frontdoor initiates OAuth
   │
   └→ GET /auth/azure/login?returnTo=http://localhost:5173
      └→ Auth Server (5176) builds Azure AD authorization URL
         └→ Redirects to: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize

3. User authenticates with Microsoft credentials
   │
   └→ Azure AD validates credentials
      └→ Redirects back: http://localhost:5176/auth/azure/callback?code=ABC123&state=XYZ

4. Auth Server handles callback
   │
   ├→ Extract authorization code from URL
   ├→ Exchange code for tokens (POST to Azure AD token endpoint)
   │  └→ Receives: accessToken, refreshToken, expiresOn
   ├→ Fetch user info from Microsoft Graph API (GET /v1.0/me)
   │  └→ Receives: userPrincipalName, mail, displayName
   │
   ├→ Generate session token (UUID)
   │
   ├→ Store Azure AD tokens in Redis
   │  └→ Key: azureToken:{sessionToken}
   │  └→ Value: { accessToken, refreshToken, expiresOn }
   │  └→ TTL: 30 minutes
   │
   ├→ Create user session in Redis
   │  └→ Key: session:{sessionToken}
   │  └→ Value: { username, email, displayName, role, authProvider: 'azure-ad' }
   │  └→ TTL: 30 minutes
   │
   └→ Redirect: http://localhost:5173/auth-success?sessionToken=UUID&returnTo=CRM_URL

5. Frontdoor /auth-success handler
   │
   ├→ Receive sessionToken from URL
   ├→ Validate session with Auth Server (POST /auth/validate)
   ├→ Store session in frontdoor localStorage
   ├→ Build auth URL with session params
   └→ Redirect to returnTo app: http://localhost:5174?sessionToken=UUID&user={...}

6. Protected app (CRM) receives authentication
   │
   └→ Same as standard flow - stores session in localStorage
```

**Key Security Features:**
- Access tokens NEVER touch the browser - stored only in Redis
- Refresh tokens NEVER exposed - server-side only
- Frontend only receives session UUIDs
- Tokens automatically refreshed before expiration
- Logout revokes both session and Azure AD tokens

### Azure AD Logout Flow

```
1. User clicks logout → App calls POST /auth/logout
   │
   ├→ Auth Server receives logout request with sessionToken
   │
   ├→ Delete Azure AD tokens from Redis
   │  └→ DEL azureToken:{sessionToken}
   │
   ├→ Delete session from Redis
   │  └→ DEL session:{sessionToken}
   │
   └→ Return success

2. App clears localStorage and starts logout cascade
   │
   └→ Standard cross-origin logout cascade continues
```

## Detailed Authentication Flows

### Flow 1: Initial Access to Protected App

User tries to access CRM directly without authentication:

```
Step 1: User visits http://localhost:5174 (CRM)
   │
   ├─→ CRM checks localStorage
   │   - localStorage.getItem('sessionToken') → null
   │   - localStorage.getItem('user') → null
   │
Step 2: Redirect to Frontdoor
   │
   └─→ window.location.href =
       "http://localhost:5173/?returnTo=http%3A%2F%2Flocalhost%3A5174"
```

**Code Implementation (CRM App.jsx:48-52):**

```javascript
useEffect(() => {
  if (authChecked && !loading && !isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `http://localhost:5173/?returnTo=${returnUrl}`;
  }
}, [authChecked, loading, isAuthenticated]);
```

### Flow 2: Frontdoor Login & Redirect

User logs in at Frontdoor and gets redirected back:

```
Step 1: User enters credentials at Frontdoor
   │
   ├─→ login(username, password)
   │   - Validate credentials (mock: any non-empty)
   │   - Generate sessionToken = crypto.randomUUID()
   │   - Create user object
   │   - Store in frontdoor's localStorage
   │
Step 2: Build redirect URL with session data
   │
   ├─→ const returnTo = "http://localhost:5174" (from URL param)
   │   const separator = returnTo.includes('?') ? '&' : '?'
   │   const encodedUser = encodeURIComponent(JSON.stringify(user))
   │
   └─→ Redirect URL:
       "http://localhost:5174?sessionToken=f47ac10b...&user=%7B%22username%22..."
```

**Code Implementation (Frontdoor App.jsx:43-58):**

```javascript
const handleLogin = async (username, password) => {
  const result = await login(username, password);
  if (result.success) {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');

    if (returnTo) {
      const separator = returnTo.includes('?') ? '&' : '?';
      const encodedUser = encodeURIComponent(JSON.stringify(result.user));
      const redirectUrl = `${returnTo}${separator}sessionToken=${result.sessionToken}&user=${encodedUser}`;
      window.location.href = redirectUrl;
    }
  }
};
```

### Flow 3: Protected App Receives Authentication

CRM receives the redirect with session data:

```
Step 1: Page loads with URL parameters
   │
   └─→ http://localhost:5174?sessionToken=f47ac10b...&user=%7B%22username%22...

Step 2: Extract and store session data
   │
   ├─→ const urlToken = params.get('sessionToken')
   ├─→ const urlUser = params.get('user')
   ├─→ const userData = JSON.parse(decodeURIComponent(urlUser))
   │
   └─→ localStorage.setItem('sessionToken', urlToken)
       localStorage.setItem('user', JSON.stringify(userData))

Step 3: Clean URL and reload
   │
   ├─→ window.history.replaceState({}, '', window.location.pathname)
   │   URL becomes: http://localhost:5174 (no parameters)
   │
   └─→ window.location.reload()
       Page reloads with session in localStorage

Step 4: Second page load (after reload)
   │
   ├─→ Check localStorage
   │   - sessionToken ✓
   │   - user ✓
   │
   └─→ isAuthenticated = true → Show protected content
```

**Code Implementation (CRM App.jsx:30-41):**

```javascript
useEffect(() => {
  // Check if session data is passed via URL (from frontdoor redirect)
  const sessionFromURL = initSessionFromURL();

  if (sessionFromURL) {
    // Session was initialized from URL, reload to pick up the new state
    window.location.reload();
    return;
  }

  setAuthChecked(true);
}, []);
```

**Code Implementation (useAuth.js:98-116):**

```javascript
const initSessionFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get('sessionToken');
  const urlUser = params.get('user');

  if (urlToken && urlUser) {
    try {
      const userData = JSON.parse(decodeURIComponent(urlUser));
      setSession(urlToken, userData);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      return true;
    } catch (err) {
      console.error('Error parsing session from URL:', err);
    }
  }
  return false;
};
```

### Flow 4: Cross-App Navigation

User navigates from CRM to Revenue while already authenticated:

```
Step 1: User clicks "Revenue" link in CRM
   │
   ├─→ CRM reads its localStorage
   │   - sessionToken: "f47ac10b..."
   │   - user: {username: "john", ...}
   │
   └─→ Builds auth URL:
       "http://localhost:5175?sessionToken=f47ac10b...&user=%7B%22username%22..."

Step 2: Revenue receives navigation
   │
   └─→ Same as Flow 3 (Protected App Receives Authentication)
       - Extract session from URL
       - Store in Revenue's localStorage
       - Clean URL and reload
       - Show authenticated content
```

**Code Implementation (useAuth.js:194-202):**

```javascript
const buildAuthUrl = (baseUrl) => {
  const params = getSessionParams();
  if (params) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}sessionToken=${params.sessionToken}&user=${params.user}`;
  }
  return baseUrl;
};
```

**Usage in Navigation (CRM App.jsx:62-65):**

```javascript
const appLinks = [
  { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
  { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' }
];
```

### Flow 5: Logout

User clicks logout from any app:

```
Step 1: User clicks logout in CRM
   │
   ├─→ Clear CRM's localStorage
   │   - localStorage.removeItem('sessionToken')
   │   - localStorage.removeItem('user')
   │
   └─→ Redirect to frontdoor with logout parameter:
       "http://localhost:5173/?logout=true"

Step 2: Frontdoor receives logout request
   │
   ├─→ Check URL parameter BEFORE reading localStorage
   │   if (params.get('logout') === 'true') {
   │     clearSession()  // Clear frontdoor's session
   │     window.history.replaceState({}, '', window.location.pathname)
   │   }
   │
   └─→ Show login screen

Result: All apps maintain separate localStorage, but logout clears:
   - CRM localStorage: cleared by CRM
   - Frontdoor localStorage: cleared by ?logout=true parameter
   - Revenue localStorage: will be cleared when user visits Revenue
```

**Code Implementation (CRM App.jsx:55-59):**

```javascript
const handleLogout = () => {
  setIsLoggingOut(true);
  logout();
  window.location.href = 'http://localhost:5173/?logout=true';
};
```

**Code Implementation (useAuth.js:44-54):**

```javascript
const checkSession = () => {
  setLoading(true);
  try {
    // Check for logout parameter FIRST, before reading localStorage
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
      clearSession();
      window.history.replaceState({}, '', window.location.pathname);
      setLoading(false);
      return;
    }
    // ... continue with normal session check
  }
};
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Journey                                 │
└─────────────────────────────────────────────────────────────────────┘

1. Direct Access to CRM
   ↓
   User → http://localhost:5174
          └→ No localStorage
             └→ Redirect → http://localhost:5173/?returnTo=http%3A%2F%2Flocalhost%3A5174

2. Frontdoor Login
   ↓
   User enters credentials
          └→ Generate sessionToken
             └→ Store in frontdoor localStorage
                └→ Redirect → http://localhost:5174?sessionToken=abc&user={...}

3. CRM Receives Auth
   ↓
   Extract URL params
          └→ Store in CRM localStorage
             └→ Clean URL
                └→ Reload page
                   └→ Check localStorage ✓
                      └→ Show CRM content

4. Navigate to Revenue
   ↓
   Click Revenue link
          └→ Read CRM localStorage
             └→ Build auth URL
                └→ Navigate → http://localhost:5175?sessionToken=abc&user={...}
                   └→ Same process as step 3

5. Logout from Revenue
   ↓
   Click logout
          └→ Clear Revenue localStorage
             └→ Redirect → http://localhost:5173/?logout=true
                └→ Clear frontdoor localStorage
                   └→ Show login screen
```

## Implementation Guide

### For New Protected Apps

When creating a new app that requires authentication:

**1. Add useAuth hook usage:**

```javascript
import { useAuth } from '@hybrid-ui/shared';

function App() {
  const {
    user,
    loading,
    logout,
    isAuthenticated,
    initSessionFromURL,
    buildAuthUrl
  } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
```

**2. Handle URL session initialization:**

```javascript
useEffect(() => {
  // Check if session data is passed via URL (from frontdoor redirect)
  const sessionFromURL = initSessionFromURL();

  if (sessionFromURL) {
    // Session was initialized from URL, reload to pick up the new state
    window.location.reload();
    return;
  }

  setAuthChecked(true);
}, []);
```

**3. Redirect to frontdoor if not authenticated:**

```javascript
useEffect(() => {
  // If not authenticated and auth check is done, redirect to frontdoor login
  if (authChecked && !loading && !isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `http://localhost:5173/?returnTo=${returnUrl}`;
  }
}, [authChecked, loading, isAuthenticated]);
```

**4. Implement logout handler:**

```javascript
const handleLogout = () => {
  logout();
  window.location.href = 'http://localhost:5173/?logout=true';
};
```

**5. Build navigation links with auth:**

```javascript
const appLinks = [
  { label: 'CRM', href: buildAuthUrl('http://localhost:5174'), icon: '📊' },
  { label: 'Revenue', href: buildAuthUrl('http://localhost:5175'), icon: '💰' },
  { label: 'Your App', href: buildAuthUrl('http://localhost:5176'), icon: '🎯' }
];
```

## Security Considerations

### Current Implementation (Mock Auth)

The current implementation uses **mock authentication** for development:

```javascript
// useAuth.js:133-157
const login = async (username, password) => {
  // Mock authentication - accepts any non-empty username/password
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  // Generate session token
  const token = generateSessionToken();

  // Mock user object
  const userData = {
    username,
    email: `${username}@example.com`,
    role: 'user',
    loginTime: new Date().toISOString()
  };

  // Store session
  setSession(token, userData);

  return { success: true, sessionToken: token, user: userData };
};
```

### Production Security Requirements

For production deployment, implement:

**1. Server-Side Session Storage**
```javascript
// Replace mock login with API call
const login = async (username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const { sessionToken, user } = await response.json();
  setSession(sessionToken, user);
  return { success: true, sessionToken, user };
};
```

**2. Session Validation**
```javascript
// Use sessionToken as Redis key
const validateSession = async (sessionToken) => {
  const response = await fetch('/api/auth/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`
    }
  });

  return response.ok;
};
```

**3. Security Features to Add**
- Session expiration (TTL in Redis)
- Session refresh tokens
- CSRF protection
- Rate limiting on login
- Secure session token generation (server-side)
- HTTPOnly cookies for sensitive data (when same-origin)
- Session invalidation on logout (server-side)

### XSS Protection

**Current Risk:** User data stored in localStorage is vulnerable to XSS attacks.

**Mitigation:**
1. Content Security Policy (CSP) headers
2. Input sanitization for all user data
3. Avoid `dangerouslySetInnerHTML`
4. Use React's built-in XSS protection

### URL Parameter Exposure

**Risk:** Session tokens visible in URL during transfer.

**Mitigation:**
1. Session tokens are immediately moved to localStorage and URL is cleaned
2. Browser history is replaced (not added), preventing back button exposure
3. Implement short-lived tokens (future: server-side validation)
4. Use HTTPS in production (prevents network sniffing)

## Troubleshooting

### Issue: Infinite Redirect Loop

**Symptoms:** App keeps redirecting to frontdoor and back.

**Causes:**
1. `initSessionFromURL()` not storing session correctly
2. URL not being cleaned after session transfer
3. `authChecked` state not being set

**Solution:**
```javascript
// Ensure reload happens AFTER storing session
if (sessionFromURL) {
  window.location.reload();  // Must reload to pick up localStorage
  return;                    // Must return to prevent further execution
}
```

### Issue: Session Lost After Navigation

**Symptoms:** User authenticated in one app, but redirected to login when visiting another.

**Causes:**
1. `buildAuthUrl()` not being used for navigation links
2. Session data not in localStorage of source app

**Solution:**
```javascript
// WRONG: Direct navigation without auth
<a href="http://localhost:5175">Revenue</a>

// CORRECT: Navigation with auth transfer
<a href={buildAuthUrl('http://localhost:5175')}>Revenue</a>
```

### Issue: Logout Not Working Across Apps

**Symptoms:** Logout from one app doesn't clear other app sessions.

**Causes:**
1. Each app has separate localStorage (by design)
2. Not using `?logout=true` parameter

**Solution:**
This is expected behavior. Each app maintains its own session. When user revisits an app after logout, they'll be redirected to login. To force clear all sessions, user must:
1. Logout from one app (redirects to frontdoor)
2. Frontdoor session is cleared via `?logout=true`
3. Any subsequent app access will redirect to login

### Issue: Session Data Corrupted

**Symptoms:** `JSON.parse()` errors in console, authentication fails.

**Causes:**
1. Manual localStorage editing
2. Incomplete session transfer
3. URL encoding/decoding issues

**Solution:**
```javascript
// useAuth handles this gracefully
try {
  const userData = JSON.parse(decodeURIComponent(urlUser));
  setSession(urlToken, userData);
} catch (err) {
  console.error('Error parsing session from URL:', err);
  // Session initialization fails, will redirect to login
}
```

Clear localStorage manually if corrupted:
```javascript
// In browser console
localStorage.removeItem('sessionToken');
localStorage.removeItem('user');
location.reload();
```

## Implemented Features

### 1. Server-Side Session Management ✅

Redis-backed sessions implemented with Auth Server:

**Endpoints:**
```javascript
GET  /auth/azure/login      // Initiate Azure AD OAuth
GET  /auth/azure/callback   // Handle Azure AD callback
POST /auth/login            // Mock authentication (development)
POST /auth/validate         // Validate session token
POST /auth/logout           // Invalidate session + revoke Azure tokens
POST /auth/refresh          // Extend session TTL
GET  /health                // Health check
```

**Redis Storage:**
```javascript
// User session
session:{uuid} = {
  username: "john@company.com",
  email: "john@company.com",
  displayName: "John Doe",
  role: "user",
  authProvider: "azure-ad",
  createdAt: "2025-01-06T12:00:00.000Z",
  expiresAt: "2025-01-06T12:30:00.000Z"
}

// Azure AD tokens (server-side only)
azureToken:{uuid} = {
  accessToken: "eyJ0eXAiOiJKV1QiLCJub25jZSI6...",
  refreshToken: "0.AXoA...",
  expiresOn: "2025-01-06T13:00:00.000Z"
}
```

**Features:**
- ✅ Centralized session management
- ✅ Periodic session validation (30 seconds)
- ✅ Server-side token storage (Azure AD)
- ✅ Automatic session refresh (5 min before expiry)
- ✅ Remote session invalidation

### 2. Single Sign-Out (SSO) ✅

Implemented with dual-phase logout mechanism:

**Phase 1: Logout Cascade (Immediate)**
```javascript
// URL-based cascade clears all app localStorage
CRM logout → Frontdoor → Revenue → Frontdoor (complete)
// Uses `?logout=true&from=app1|app2` parameter tracking
// Completes in 2-3 seconds
```

**Phase 2: Server-Side Validation (Ongoing)**
```javascript
// When user logs out from any app
POST /auth/logout
Headers: { sessionToken: <uuid> }

// Server deletes session from Redis
await invalidateSession(sessionToken);  // Delete session:{uuid}
await revokeAzureTokens(sessionToken);  // Delete azureToken:{uuid}

// All apps detect invalid session within 30 seconds
// Periodic validation fails → Auto-redirect to login
```

## Future Enhancements

### 3. Persistent Sessions

Add "Remember Me" functionality:

```javascript
// Long-lived refresh token in localStorage
// Short-lived access token in memory
// Refresh access token on app load if expired
// Configurable session TTL based on user preference
```

### 4. Multi-Factor Authentication (MFA)

Integrate Azure AD MFA requirements:

```javascript
// Azure AD Conditional Access policies
// Require MFA for sensitive operations
// Step-up authentication for admin actions
```

### 5. Session Analytics

Track and analyze session usage:

```javascript
// Session activity logging
// User login patterns
// Security anomaly detection
// Concurrent session limits
```

## Reference Files

- **useAuth Hook:** `packages/shared/src/hooks/useAuth.js`
- **Frontdoor App:** `packages/frontdoor-app/src/App.jsx`
- **CRM App:** `packages/crm-app/src/App.jsx`
- **Revenue App:** `packages/revenue-app/src/App.jsx`
- **TopNavigation:** `packages/shared/src/components/TopNavigation.jsx`

## Architecture Decision Records

### Why Session Tokens Instead of JWT?

**Decision:** Use simple UUID session tokens instead of JWT.

**Rationale:**
1. Session data stored in localStorage (client-side), not in token
2. No need for cryptographic signing (no server validation yet)
3. Simpler implementation for cross-origin transfer
4. Easier to transition to server-side session storage (Redis keys)
5. JWTs would be overkill without server-side validation

**Future:** When server-side session validation is added, JWTs could be reconsidered for stateless auth, but session tokens + Redis provides more control (revocation, updates, etc.).

### Why URL Parameters Instead of Cookies?

**Decision:** Use URL parameters for cross-origin auth transfer.

**Rationale:**
1. Different ports = different origins = cookies not shared
2. SameSite cookie restrictions prevent cross-origin sharing
3. URL parameters work reliably across origins
4. No CORS complexity
5. Temporary exposure (immediately moved to localStorage)

**Trade-off:** URL parameters are briefly visible, but this is acceptable for local development. In production with HTTPS, risk is minimal, and tokens are short-lived.

### Why Reload After Session Transfer?

**Decision:** Reload page after storing session from URL parameters.

**Rationale:**
1. React state needs to re-initialize with new localStorage data
2. Ensures consistent state across all hooks and components
3. Simpler than manually updating all dependent state
4. Prevents race conditions between URL cleanup and state updates

**Alternative Considered:** Manual state updates without reload, but this proved fragile and error-prone.
