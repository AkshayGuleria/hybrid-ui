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

### Authentication Methods

The system supports **two authentication methods**:

1. **Azure AD (Entra ID) OAuth** - Production-ready Microsoft authentication
2. **Mock Authentication** - Development fallback (accepts any credentials)

### Azure AD Authentication Flow

```
1. User clicks "Sign in with Microsoft" → Frontdoor redirects to Auth Server
2. Auth Server → Azure AD OAuth page (login.microsoftonline.com)
3. User authenticates with Azure AD credentials
4. Azure AD → Auth Server callback with authorization code
5. Auth Server exchanges code for access/refresh tokens
6. Auth Server stores tokens in Redis (server-side only)
7. Auth Server creates session → Frontdoor /auth-success with sessionToken
8. Frontdoor validates session → Redirects to target app with URL params
9. Protected app stores session in localStorage
```

### Mock Authentication Flow (Development)

### 1. Initial Access to Protected App (CRM/Revenue)
```javascript
// User visits http://localhost:5174 (CRM)
// CRM checks localStorage for user data
// If not found, redirects to:
window.location.href = `http://localhost:5173/?returnTo=${encodeURIComponent(window.location.href)}`;
```

### 2. Frontdoor Login & Redirect
```javascript
// After successful login (mock or Azure AD):
// 1. Gets user data from session validation
// 2. Encodes it as URL parameter
// 3. Redirects back with session data:
const encodedUser = encodeURIComponent(JSON.stringify(userData));
window.location.href = `${returnTo}?sessionToken=${token}&user=${encodedUser}`;
```

### 3. Protected App Receives Auth
```javascript
// CRM/Revenue on load:
// 1. Checks URL for 'sessionToken' and 'user' parameters
// 2. Stores session data in its own localStorage
// 3. Cleans up URL
// 4. Reloads to pick up auth state
const sessionToken = params.get('sessionToken');
const userData = params.get('user');
localStorage.setItem('sessionToken', sessionToken);
localStorage.setItem('user', JSON.stringify(decodedUser));
window.history.replaceState({}, '', window.location.pathname);
window.location.reload();
```

### Why This Pattern?

- **Different ports = different origins = separate localStorage**
- Cannot use cookies (different origins)
- Cannot use shared localStorage (browser security)
- URL parameter passing is the solution for cross-origin auth transfer
- **Azure AD tokens stored server-side** (never exposed to browser)
- Frontend only receives session UUIDs for security

## Shared Package Architecture

The `@hybrid-ui/shared` package provides:

### 1. `useAuth` Hook
Located: `packages/shared/src/hooks/useAuth.js`

```javascript
const { user, loading, error, login, logout, isAuthenticated } = useAuth();
```

- Manages localStorage-based authentication with server-side validation
- Supports both Azure AD and mock authentication
- Periodic session validation (every 30 seconds)
- Automatic session refresh before expiration
- Returns user object: `{ username, email, role, loginTime, authProvider }`
- `authProvider` is either `'azure-ad'` or `'mock'`

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

| Agent | Command | Domain | Territory |
|-------|---------|--------|-----------|
| **niko** | `/niko` | Frontdoor | Auth UI, login flows, navigation shell |
| **yap** | `/yap` | CRM | Customer management, contacts, pipeline |
| **billman** | `/billman` | Revenue | Financial analytics, billing, invoicing |
| **habibi** | `/habibi` | DevOps | Docker, nginx, deployment, infrastructure |
| **tapsa** | `/tapsa` | Project Management | Feature specs, task tracking, progress |
| **tommi** | `/brainstorming-with-tommi` | Brainstorming | Idea validation, approach exploration |

Each agent has exclusive ownership of their domain and should not modify other areas.

### Agent Workflow

```
tommi (brainstorms) → tapsa (specs & tracks) → niko/yap/billman/habibi (implements)
                              ↑
                       auto-updates status
```

## Feature Management

Features and project progress are tracked in the `features/` directory, managed by **tapsa**.

### Features Directory Structure

```
features/
├── README.md           # Overview and quick status table
├── _template.md        # Template for new features
├── routing/            # Feature: Client-side routing
│   └── README.md
├── api-layer/          # Feature: Shared API abstraction
│   └── README.md
└── [feature-name]/     # Future features
    └── README.md
```

### Tapsa Commands

```bash
# Create a new feature
/tapsa create [feature-name] - [description]

# Check project status
/tapsa status

# Update feature status
/tapsa update [feature-id] [status]

# View feature details
/tapsa show [feature-id]

# Generate progress report
/tapsa report

# Add subtask to feature
/tapsa add-task [feature-id] - [task description]

# Mark subtask complete
/tapsa complete [feature-id] [subtask-number]
```

### Feature Status Workflow

```
planned → in-progress → review → done
              ↓
           blocked
```

### Feature Spec Format

Each feature has a README.md with YAML frontmatter:

```markdown
---
id: feature-id
title: Feature Title
status: planned | in-progress | blocked | review | done
priority: critical | high | medium | low
assignee: niko | yap | billman | habibi | null
created: YYYY-MM-DD
updated: YYYY-MM-DD
dependencies: []
blocks: []
---

# Feature Title

## Problem Statement
## Proposed Solution
## Acceptance Criteria
## Subtasks (table with status)
## Technical Notes
## Progress Log
```

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

### Azure AD Authentication
- **Token Security**: Access and refresh tokens are NEVER exposed to browser
- All tokens stored server-side in Redis with pattern: `azureToken:{sessionToken}`
- Frontend only receives session UUIDs
- **Logout**: Must revoke both session and Azure tokens
- **Configuration**: Requires .env file with Azure AD credentials
- **Fallback**: Mock authentication always available for development
- **Redirect URI**: Must exactly match Azure Portal app registration
- **Production**: Update redirect URI to HTTPS domain before deployment

## Auth Server Architecture

The auth server (`packages/auth-server/`) provides:

**Files:**
- `src/index.js` - Express server entry point
- `src/config.js` - Azure AD config, Redis config, test users
- `src/routes/auth.js` - Authentication endpoints
- `src/services/session.js` - Redis session management
- `src/services/azure.js` - Azure AD OAuth integration

**Endpoints:**
- `GET /auth/azure/login` - Initiate Azure AD OAuth flow
- `GET /auth/azure/callback` - Handle Azure AD callback
- `POST /auth/login` - Mock authentication (development)
- `POST /auth/validate` - Validate session token
- `POST /auth/logout` - Invalidate session + revoke Azure tokens
- `POST /auth/refresh` - Extend session TTL
- `GET /health` - Health check

**Redis Storage:**
- `session:{uuid}` - User session data (30 min TTL)
- `azureToken:{uuid}` - Azure AD access/refresh tokens (30 min TTL)

## Tech Stack

- **React** 18.3.1
- **Vite** 6.0.3 (build tool & dev server)
- **npm workspaces** (monorepo management)
- **Express.js** (auth server backend)
- **Redis** (session and token storage)
- **Azure AD (Entra ID)** - OAuth 2.0 authentication via @azure/msal-node
- **Axios** - HTTP client for Microsoft Graph API
- **localStorage** (per-origin session storage)
- **URL parameters** (cross-origin auth transfer)

## Design System

- **Frontdoor**: Purple gradient (`#667eea` to `#764ba2`)
- **CRM**: Same purple gradient
- **Revenue**: Green gradient (`#10b981` to `#059669`)
- All apps share common spacing, typography, and component patterns
