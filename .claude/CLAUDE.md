# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hybrid UI** multi-app system implementing a micro-frontend architecture where multiple React applications run on different ports and share authentication through a centralized frontdoor application. Each app is a separate Vite-based React application managed through npm workspaces.

### Architecture Pattern: Hybrid Shell (#5)

The system uses a "hybrid shell" architecture where:
- Apps run on **different ports** (different origins)
- **localStorage is NOT shared** between apps (different origins = different storage)
- Authentication is **passed via URL parameters** when navigating between apps
- Each app maintains its own localStorage session after initial auth transfer

## Key Applications

| App | Port | Purpose | Path |
|-----|------|---------|------|
| **Frontdoor** | 5173 | Authentication & App Launcher | `packages/frontdoor-app/` |
| **CRM** | 5174 | Customer Relationship Management | `packages/crm-app/` |
| **Revenue** | 5175 | Financial Analytics & Billing | `packages/revenue-app/` |
| **Shared** | N/A | Shared components & utilities | `packages/shared/` |

## Development Commands

```bash
# Start individual apps (each runs on its own port)
npm run dev:frontdoor    # Port 5173
npm run dev:crm          # Port 5174
npm run dev:revenue      # Port 5175

# Build individual apps
npm run build:frontdoor
npm run build:crm
npm run build:revenue

# Install dependencies (run from root)
npm install
```

## Critical Authentication Flow

**This is the most important architectural pattern to understand:**

### 1. Initial Access to Protected App (CRM/Revenue)
```javascript
// User visits http://localhost:5174 (CRM)
// CRM checks localStorage for user data
// If not found, redirects to:
window.location.href = `http://localhost:5173/?returnTo=${encodeURIComponent(window.location.href)}`;
```

### 2. Frontdoor Login & Redirect
```javascript
// After successful login, frontdoor:
// 1. Gets user data from its localStorage
// 2. Encodes it as URL parameter
// 3. Redirects back with user data:
const encodedUser = encodeURIComponent(JSON.stringify(userData));
window.location.href = `${returnTo}?user=${encodedUser}`;
```

### 3. Protected App Receives Auth
```javascript
// CRM/Revenue on load:
// 1. Checks URL for 'user' parameter
// 2. Stores user data in its own localStorage
// 3. Cleans up URL
// 4. Reloads to pick up auth state
const userData = params.get('user');
localStorage.setItem('user', JSON.stringify(decodedUser));
window.history.replaceState({}, '', window.location.pathname);
window.location.reload();
```

### Why This Pattern?

- **Different ports = different origins = separate localStorage**
- Cannot use cookies (different origins)
- Cannot use shared localStorage (browser security)
- URL parameter passing is the solution for cross-origin auth transfer

## Shared Package Architecture

The `@hybrid-ui/shared` package provides:

### 1. `useAuth` Hook
Located: `packages/shared/src/hooks/useAuth.js`

```javascript
const { user, loading, error, login, logout, isAuthenticated } = useAuth();
```

- Manages localStorage-based authentication
- Mock authentication (accepts any credentials)
- Returns user object: `{ username, email, role, loginTime }`

### 2. `TopNavigation` Component
Located: `packages/shared/src/components/TopNavigation.jsx`

Shared navigation bar with:
- Clickable "🏠 Hybrid UI" brand (redirects to frontdoor)
- App navigation links
- User info display
- Logout button

**Important:** App links must use full URLs with ports:
```javascript
const appLinks = [
  { label: 'CRM', href: 'http://localhost:5174', icon: '📊' },
  { label: 'Revenue', href: 'http://localhost:5175', icon: '💰' }
];
```

## Agent Skills

The repository includes specialized Claude Code agents for different domains:

- **niko** (`/niko`) - Frontdoor agent: authentication UI, login flows, navigation shell
- **yap** (`/yap`) - CRM agent: customer management, contact tracking, sales pipeline
- **billman** (`/billman`) - Revenue agent: financial analytics, billing, invoicing
- **habibi** (`/habibi`) - DevOps agent: Docker, nginx, deployment, infrastructure
- **brainstorming-with-tommi** - Brainstorming and validation before implementation

Each agent has exclusive ownership of their package directory and should not modify other apps.

## Adding a New App

When adding a new app to the system:

1. **Create package structure:**
   ```
   packages/new-app/
   ├── src/
   │   ├── components/
   │   ├── App.jsx
   │   ├── main.jsx
   │   └── index.css
   ├── index.html
   ├── vite.config.js
   └── package.json
   ```

2. **Configure Vite for unique port:**
   ```javascript
   // vite.config.js
   export default defineConfig({
     server: { port: 5176 }  // Next available port
   });
   ```

3. **Implement auth protection pattern:**
   ```javascript
   // App.jsx must include:
   // - URL parameter check for user data
   // - localStorage storage
   // - Redirect to frontdoor if not authenticated
   ```

4. **Add scripts to root package.json:**
   ```json
   {
     "scripts": {
       "dev:newapp": "npm run dev --workspace=@hybrid-ui/new-app",
       "build:newapp": "npm run build --workspace=@hybrid-ui/new-app"
     }
   }
   ```

5. **Update frontdoor navigation:**
   - Add app link to `appLinks` array
   - Add clickable card in app launcher

## Important Gotchas

### Cross-Origin Authentication
- **Never assume localStorage is shared** between apps
- Always implement the URL parameter auth transfer pattern
- Protected apps must check URL params on mount before checking localStorage

### Navigation Between Apps
- Use **full URLs** with `http://localhost:PORT` format
- Relative URLs like `/crm` will not work (wrong port)
- Example: `href="http://localhost:5174"` not `href="/crm"`

### Logout Flow
- Logout button must redirect to frontdoor: `window.location.href = 'http://localhost:5173/'`
- This ensures user returns to login screen

### Workspace Dependencies
- Shared package uses `"@hybrid-ui/shared": "*"` in dependencies
- Not `"workspace:*"` (npm workspaces syntax issue)

## Tech Stack

- **React** 18.3.1
- **Vite** 6.0.3 (build tool & dev server)
- **npm workspaces** (monorepo management)
- **localStorage** (per-origin session storage)
- **URL parameters** (cross-origin auth transfer)

## Design System

- **Frontdoor**: Purple gradient (`#667eea` to `#764ba2`)
- **CRM**: Same purple gradient
- **Revenue**: Green gradient (`#10b981` to `#059669`)
- All apps share common spacing, typography, and component patterns
