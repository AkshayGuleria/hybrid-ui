---
id: cross-origin-logout
title: Fix Cross-Origin Logout localStorage Clearing
status: review
priority: high
assignee: niko
created: 2026-01-07
updated: 2026-01-08
dependencies: []
blocks: []
---

# Fix Cross-Origin Logout localStorage Clearing

## Problem Statement

Currently, when a user logs out from one app (e.g., CRM), the logout only clears localStorage for that specific app and the frontdoor app. However, if the user has other apps open in different tabs (e.g., Revenue app), those apps remain "logged in" because their localStorage is not cleared.

**Root Cause:**
Each app runs on a different port:
- Frontdoor: `http://localhost:5173`
- CRM: `http://localhost:5174`
- Revenue: `http://localhost:5175`

Different ports = different origins = isolated localStorage (browser security model). There is no way to directly access or modify localStorage across different origins.

**Current Behavior:**
1. User logs out from CRM (`localhost:5174`)
2. CRM clears its own localStorage
3. CRM redirects to frontdoor with `?logout=true`
4. Frontdoor clears its localStorage
5. **Revenue app (`localhost:5175`) still has user data in its localStorage**
6. If user navigates to Revenue tab, they appear logged in

**Expected Behavior:**
Logout from any app should clear session across ALL apps, preventing the user from accessing protected content in any open tab.

## Proposed Solution

Implement a **two-phase approach**:

### Phase 1: Short-term Fix (Logout Cascade) - IMPLEMENTED
Implement a logout cascade using URL redirects with a "from" parameter to track visited apps.

**Flow (using "from" parameter for history tracking):**
```
CRM logout → Frontdoor (?logout=true&from=crm)
           → Revenue (?logout=true&from=crm|frontdoor)
           → Frontdoor (?logout=true&from=crm|frontdoor|revenue)
           → Cascade complete, show login page
```

**How it works:**
- Each app adds its name to the "from" parameter when redirecting
- Frontdoor orchestrates the cascade and knows all apps via `LOGOUT_APPS` config
- Frontdoor checks if all apps have been visited before showing login page
- Adding new apps only requires updating `LOGOUT_APPS` array in shared package

**Pros:**
- Quick to implement (no backend changes)
- Works with current architecture
- Guaranteed to clear all localStorage
- Self-documenting (URL shows cascade history)
- Scalable (only Frontdoor needs to know all apps)
- Easy debugging (can see which apps were visited)

**Cons:**
- Poor UX (user sees brief flashes of each app)
- URL grows with more apps (minor concern)

### Phase 2: Long-term Fix (Server-Side Session Validation)
Implement proper server-side session management with token invalidation.

**Architecture:**
1. Replace localStorage-only auth with server-backed sessions
2. Store session token in localStorage (or httpOnly cookie for web)
3. Each app validates token with auth server on critical operations
4. Logout endpoint invalidates session server-side
5. All apps periodically check session validity
6. Invalid session triggers auto-logout

**Pros:**
- Secure and robust
- Proper session lifecycle management
- Works across all tabs instantly (via periodic validation)
- Scalable to any number of apps
- Enables session timeout, device management, etc.

**Cons:**
- Requires backend auth service
- More complex implementation
- Need to handle network failures gracefully

## Acceptance Criteria

### Phase 1 (Short-term) - IMPLEMENTED
- [x] Logout from CRM clears localStorage in Frontdoor, CRM, and Revenue
- [x] Logout from Revenue clears localStorage in Frontdoor, CRM, and Revenue
- [x] User cannot access protected content in any app after logout
- [x] Logout cascade completes within 2-3 seconds
- [x] No JavaScript errors during cascade
- [x] Final redirect lands on frontdoor login page

### Phase 2 (Long-term)
- [ ] Auth server provides session validation endpoint
- [ ] All apps validate session token on mount and periodically
- [ ] Logout invalidates session server-side
- [ ] All open tabs detect invalid session within 30 seconds
- [ ] Auto-logout redirects to frontdoor with returnTo URL
- [ ] Session timeout is configurable
- [ ] Graceful handling of network failures

## Subtasks

### Phase 1: Logout Cascade - COMPLETED

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1 | Update useAuth hook with logout cascade logic | done | niko | Added "from" parameter handling, APP_CONFIG, LOGOUT_APPS |
| 2 | Update CRM logout to use from parameter | done | niko | Uses buildLogoutUrl('crm'), ProtectedRoute appName="crm" |
| 3 | Update Revenue logout to use from parameter | done | niko | Uses buildLogoutUrl('revenue'), ProtectedRoute appName="revenue" |
| 4 | Update frontdoor to handle logout cascade chain | done | niko | Orchestrates cascade, checks isLogoutCascadeComplete |
| 5 | Add loading indicator during cascade | done | niko | Shows "Logging out..." in all apps |
| 6 | Update ProtectedRoute to handle logout cascade | done | niko | Handles ?logout=true, adds appName to from param |
| 7 | Test logout from each app | done | | Verified cascade flow works |

### Phase 2: Server-Side Sessions (Future)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 8 | Design auth server API (validate, logout, refresh) | planned | | Architecture planning |
| 9 | Implement mock auth server | planned | habibi | Can be simple Express server |
| 10 | Update useAuth to validate session with server | planned | niko | Add periodic validation |
| 11 | Implement server-side logout endpoint | planned | habibi | Invalidate session token |
| 12 | Add auto-logout on invalid session | planned | niko | Redirect with returnTo |
| 13 | Implement session timeout | planned | niko | Configurable duration |
| 14 | Add session refresh mechanism | planned | niko | Extend session on activity |
| 15 | Migrate all apps to server-backed auth | planned | niko, yap, billman | Update all apps |
| 16 | Remove Phase 1 logout cascade | planned | niko | Clean up after Phase 2 complete |

## Technical Notes

### Current Logout Implementation

**packages/shared/src/hooks/useAuth.js:**
```javascript
const logout = () => {
  clearSession();  // Only clears local state
  setError(null);
};

const clearSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  setSessionToken(null);
  setUser(null);
};
```

**packages/crm-app/src/App.jsx:**
```javascript
const handleLogout = () => {
  logout();  // Clears CRM localStorage
  window.location.href = 'http://localhost:5173/?logout=true';  // Redirects to frontdoor
};
```

**packages/frontdoor-app/src/App.jsx:**
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const shouldLogout = params.get('logout') === 'true';

  if (shouldLogout) {
    logout();  // Clears frontdoor localStorage
    window.history.replaceState({}, '', '/');
  }
}, [logout]);
```

**Problem:** Revenue app localStorage is never touched during this flow.

### Phase 1 Implementation Details

**Logout Cascade Flow:**

1. **User clicks logout in CRM:**
   ```javascript
   const handleLogout = () => {
     logout();  // Clear CRM localStorage
     window.location.href = 'http://localhost:5173/?logout=true&next=revenue';
   };
   ```

2. **Frontdoor receives logout with next=revenue:**
   ```javascript
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const shouldLogout = params.get('logout') === 'true';
     const next = params.get('next');

     if (shouldLogout) {
       logout();  // Clear frontdoor localStorage

       if (next === 'revenue') {
         window.location.href = 'http://localhost:5175/?logout=true&next=done';
       } else if (next === 'done') {
         // Cascade complete, stay on frontdoor
         window.history.replaceState({}, '', '/');
       }
     }
   }, [logout]);
   ```

3. **Revenue receives logout with next=done:**
   ```javascript
   useEffect(() => {
     const params = new URLSearchParams(window.location.search);
     const shouldLogout = params.get('logout') === 'true';
     const next = params.get('next');

     if (shouldLogout) {
       logout();  // Clear Revenue localStorage
       window.location.href = 'http://localhost:5173/?logout=true&next=done';
     }
   }, [logout]);
   ```

4. **Frontdoor receives logout with next=done, cascade complete**

### Phase 2 Implementation Details

**Auth Server API:**
```javascript
// POST /auth/login
// Returns: { sessionToken, user, expiresAt }

// POST /auth/validate
// Body: { sessionToken }
// Returns: { valid: true, user } or { valid: false }

// POST /auth/logout
// Body: { sessionToken }
// Returns: { success: true }

// POST /auth/refresh
// Body: { sessionToken }
// Returns: { sessionToken, expiresAt }
```

**Updated useAuth Hook:**
```javascript
const useAuth = () => {
  // ... existing state

  const validateSession = useCallback(async () => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:3000/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token })
      });

      const data = await response.json();

      if (!data.valid) {
        clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      // Don't clear session on network error
      return true;  // Assume valid on network failure
    }
  }, [sessionToken]);

  // Periodic validation (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      validateSession().then(valid => {
        if (!valid) {
          // Auto-logout and redirect
          window.location.href = `http://localhost:5173/?returnTo=${encodeURIComponent(window.location.href)}`;
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [validateSession]);

  const logout = async () => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_KEY);

    // Invalidate session server-side
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token })
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }

    clearSession();
  };

  return { user, loading, error, login, logout, validateSession, isAuthenticated };
};
```

### Why Investigated Solutions Don't Work

**1. Broadcast Channel API**
```javascript
// WON'T WORK - requires same origin
const channel = new BroadcastChannel('logout');
channel.postMessage('logout');  // Only received by same origin
```
Same origin = same protocol + domain + port. Our apps have different ports.

**2. localStorage events**
```javascript
// WON'T WORK - only fires for same origin
window.addEventListener('storage', (e) => {
  if (e.key === 'user' && e.newValue === null) {
    // This never fires across different ports
  }
});
```

**3. Shared cookies**
Can't use httpOnly cookies across different ports in development (different origins).

## Progress Log

### 2026-01-08
- **Phase 1 IMPLEMENTED** using "from" parameter approach (per tommi's recommendation)
- Changed from "next" parameter to "from" parameter for better scalability
- Updated useAuth hook with APP_CONFIG, LOGOUT_APPS, and cascade helper functions
- Updated ProtectedRoute to handle logout cascade with appName prop
- Updated Frontdoor App to orchestrate the cascade
- Updated CRM and Revenue apps to use new logout flow
- Added "Logging out..." loading state to all apps
- Feature moved to review status

### 2026-01-07
- Initial spec created by tapsa based on tommi's analysis
- Problem identified: cross-origin localStorage isolation
- Two-phase approach designed: short-term cascade, long-term server sessions
- Assigned to niko (authentication domain)

## Related
- Depends on: (none)
- Blocks: (none)
- Related analysis: tommi's brainstorming session on logout issue
- Related components: useAuth hook, all App.jsx files
