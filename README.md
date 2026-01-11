# Hybrid UI

A modern multi-app system implementing a micro-frontend architecture where multiple React applications share authentication and run independently on different ports.

## Overview

Hybrid UI is a production-ready platform consisting of:
- **Frontdoor** - Authentication hub and application launcher
- **CRM** - Customer Relationship Management with full CRUD operations
- **Revenue** - Financial analytics and invoice management
- **Auth Server** - Server-side session management with Redis
- **Shared Package** - Common components, hooks, and utilities

### Key Features

✅ **Enterprise Authentication**
- **Azure AD (Entra ID) integration** - OAuth 2.0 with Microsoft authentication
- Server-side session and token management with Redis
- Periodic session validation (every 30 seconds)
- Cross-origin authentication via URL parameters
- Automatic logout detection across all apps
- Graceful fallback to mock auth for development

✅ **Micro-Frontend Architecture**
- Independent apps on separate ports
- Shared component library
- Cross-origin communication
- Client-side routing with React Router v6

✅ **Developer Experience**
- npm workspaces for monorepo management
- Hot module replacement in development
- Comprehensive feature tracking system
- Specialized AI agents for different domains

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (for authentication server)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hybrid-ui

# Install all dependencies
npm install
```

### Start Redis

Choose one option:

**Option A: Docker (Recommended)**
```bash
docker run -d --name redis-auth -p 6379:6379 redis:7-alpine
```

**Option B: Homebrew (macOS)**
```bash
brew install redis
brew services start redis
```

**Option C: Direct (if already installed)**
```bash
redis-server
```

### Start the Application

**Start all apps:**
```bash
npm run dev:all
```

This starts:
- Auth Server: http://localhost:5176
- Frontdoor: http://localhost:5173
- CRM: http://localhost:5174
- Revenue: http://localhost:5175

**Or start apps individually:**
```bash
npm run dev:auth        # Auth server
npm run dev:frontdoor   # Frontdoor app
npm run dev:crm         # CRM app
npm run dev:revenue     # Revenue app
```

### Login

Navigate to http://localhost:5173 and choose your authentication method:

**Option A: Azure AD (Recommended for Production)**
- Click "Sign in with Microsoft"
- Login with your Azure AD credentials
- Requires Azure AD app registration (see Configuration section)

**Option B: Mock Authentication (Development)**
Use test credentials for local development:

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin    | admin |
| user     | user     | user  |
| demo     | demo     | demo  |

## Project Structure

```
hybrid-ui/
├── packages/
│   ├── auth-server/          # Express + Redis authentication server
│   │   ├── src/
│   │   │   ├── index.js      # Server entry point
│   │   │   ├── config.js     # Configuration (Azure AD, Redis, test users)
│   │   │   ├── routes/       # Auth endpoints (mock + Azure AD)
│   │   │   └── services/     # Session + Azure AD token management
│   │   │       ├── session.js
│   │   │       └── azure.js  # Azure AD OAuth integration
│   │   └── package.json
│   │
│   ├── frontdoor-app/        # Authentication & app launcher (port 5173)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── Login.jsx
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── vite.config.js
│   │
│   ├── crm-app/              # Customer management (port 5174)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── CustomerList.jsx
│   │   │   │   └── CustomerDetail.jsx
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── vite.config.js
│   │
│   ├── revenue-app/          # Financial analytics (port 5175)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── InvoiceList.jsx
│   │   │   ├── App.jsx
│   │   │   └── main.jsx
│   │   └── vite.config.js
│   │
│   └── shared/               # Shared components, hooks, and utilities
│       ├── src/
│       │   ├── api/          # API clients
│       │   │   ├── auth.js   # Auth server API
│       │   │   ├── customers.js
│       │   │   └── invoices.js
│       │   ├── components/   # Shared UI components
│       │   │   ├── TopNavigation.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── NotFound.jsx
│       │   ├── hooks/        # Shared React hooks
│       │   │   ├── useAuth.js
│       │   │   ├── useCustomers.js
│       │   │   └── useInvoices.js
│       │   └── index.js
│       └── package.json
│
├── features/                 # Feature specs and tracking
│   ├── README.md             # Status overview
│   ├── routing/
│   ├── api-layer/
│   ├── crm-crud/
│   └── cross-origin-logout/
│
├── package.json              # Root workspace configuration
└── README.md                 # This file
```

## Architecture

### Multi-App System

Each app runs on a different port and is completely independent:

| App | Port | Purpose | Routes |
|-----|------|---------|--------|
| Frontdoor | 5173 | Auth & launcher | `/`, `/auth-success` |
| CRM | 5174 | Customer management | `/`, `/customers`, `/customers/:id` |
| Revenue | 5175 | Financial analytics | `/`, `/dashboard`, `/invoices`, `/invoices/:id` |
| Auth Server | 5176 | Session & OAuth | `/auth/login`, `/auth/azure/login`, `/auth/azure/callback`, `/auth/validate`, `/auth/logout` |

### Cross-Origin Authentication

Since apps run on different ports (different origins), they cannot share localStorage or cookies directly. The system uses **URL parameter passing** for authentication transfer:

**Flow:**
1. User logs in at Frontdoor (5173)
2. Frontdoor stores session in localStorage
3. When navigating to CRM, URL includes session data: `http://localhost:5174?sessionToken=xxx&user=yyy`
4. CRM reads URL params and stores session in its own localStorage
5. CRM cleans up URL for security
6. All apps periodically validate session with auth server

### Server-Side Sessions

**Session Storage:**
- Redis stores active sessions with 30-minute TTL
- Session key pattern: `session:{sessionToken}`
- Sessions include user data and expiry timestamp

**Session Lifecycle:**
1. Login creates session in Redis
2. Frontend stores sessionToken in localStorage
3. Apps validate token every 30 seconds
4. Session auto-refreshes 5 minutes before expiry
5. Logout deletes Redis key immediately
6. All apps detect invalid session and auto-logout

### Logout Cascade

When a user logs out, two mechanisms ensure all apps logout:

**Phase 1: URL Cascade (Immediate)**
- Logout initiates cascade across all apps via URL redirects
- Each app clears its localStorage and passes to next
- Completes in 2-3 seconds

**Phase 2: Server Validation (Ongoing)**
- Logout invalidates Redis session
- All apps detect invalid session within 30 seconds
- Automatic redirect to login page

## Development

### Available Scripts

**Development:**
```bash
npm run dev:all         # Start all apps (auth + frontdoor + crm + revenue)
npm run dev:auth        # Start auth server only
npm run dev:frontdoor   # Start frontdoor only
npm run dev:crm         # Start CRM only
npm run dev:revenue     # Start Revenue only
```

**Production Builds:**
```bash
npm run build:frontdoor  # Build frontdoor app
npm run build:crm        # Build CRM app
npm run build:revenue    # Build Revenue app
```

**Workspace Commands:**
```bash
# Install dependency in specific package
npm install <package> --workspace=@hybrid-ui/crm-app

# Run command in specific package
npm run <command> --workspace=@hybrid-ui/shared
```

### Adding a New App

1. **Create package structure:**
   ```bash
   mkdir -p packages/new-app/src/components
   cd packages/new-app
   npm init -y
   ```

2. **Configure package.json:**
   ```json
   {
     "name": "@hybrid-ui/new-app",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build"
     },
     "dependencies": {
       "@hybrid-ui/shared": "*",
       "react": "^18.3.1",
       "react-dom": "^18.3.1",
       "react-router-dom": "^6.28.0"
     },
     "devDependencies": {
       "@vitejs/plugin-react": "^4.3.4",
       "vite": "^6.0.3"
     }
   }
   ```

3. **Configure Vite (vite.config.js):**
   ```javascript
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     server: {
       port: 5176  // Choose next available port
     }
   });
   ```

4. **Wrap with ProtectedRoute:**
   ```javascript
   import { ProtectedRoute } from '@hybrid-ui/shared';

   function App() {
     return (
       <ProtectedRoute appName="new-app">
         {/* Your app content */}
       </ProtectedRoute>
     );
   }
   ```

5. **Add to root package.json:**
   ```json
   {
     "scripts": {
       "dev:newapp": "npm run dev --workspace=@hybrid-ui/new-app",
       "build:newapp": "npm run build --workspace=@hybrid-ui/new-app"
     }
   }
   ```

6. **Update shared package:**
   - Add app to `LOGOUT_APPS` in `packages/shared/src/hooks/useAuth.js`
   - Add app link to Frontdoor navigation

### Working with Features

This project uses a feature tracking system managed by the **tapsa** agent:

```bash
# View project status
/tapsa status

# Create new feature
/tapsa create [feature-name] - [description]

# Update feature status
/tapsa update [feature-id] [status]

# Show feature details
/tapsa show [feature-id]
```

All features are documented in the `features/` directory. See [features/README.md](./features/README.md) for details.

## API Reference

### Auth Server API

**Base URL:** `http://localhost:5176`

#### GET /auth/azure/login
Initiate Azure AD OAuth flow (redirects to Microsoft login).

**Query Parameters:**
- `returnTo` - URL to redirect after successful authentication

**Response:**
- HTTP 302 redirect to Azure AD login page

**Example:**
```
GET /auth/azure/login?returnTo=http://localhost:5173
→ Redirects to: https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize...
```

#### GET /auth/azure/callback
Azure AD OAuth callback handler (internal - called by Azure AD).

**Query Parameters:**
- `code` - Authorization code from Azure AD
- `state` - Encoded returnTo URL

**Response:**
- HTTP 302 redirect to frontdoor `/auth-success` with sessionToken

#### POST /auth/login
Login with username and password (mock authentication for development).

**Request:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "sessionToken": "uuid-token",
  "user": {
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "expiresAt": "2024-01-10T12:30:00Z"
}
```

#### POST /auth/validate
Validate a session token.

**Request:**
```json
{
  "sessionToken": "uuid-token"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "username": "admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "expiresAt": "2024-01-10T12:30:00Z"
}
```

#### POST /auth/logout
Invalidate a session.

**Request:**
```json
{
  "sessionToken": "uuid-token"
}
```

**Response:**
```json
{
  "success": true
}
```

#### POST /auth/refresh
Refresh session TTL.

**Request:**
```json
{
  "sessionToken": "uuid-token"
}
```

**Response:**
```json
{
  "sessionToken": "uuid-token",
  "expiresAt": "2024-01-10T13:00:00Z"
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Technology Stack

- **Frontend Framework:** React 18.3.1
- **Build Tool:** Vite 6.0.3
- **Routing:** React Router v6
- **Backend:** Express.js
- **Authentication:** Azure AD (Entra ID) via @azure/msal-node
- **Session Store:** Redis (sessions + OAuth tokens)
- **HTTP Client:** Axios
- **Monorepo:** npm workspaces
- **Package Manager:** npm

## Configuration

### Environment Variables

**Auth Server (.env in packages/auth-server/):**
```bash
# Server Configuration
PORT=5176
REDIS_URL=redis://localhost:6379
SESSION_TTL_SECONDS=1800  # 30 minutes
NODE_ENV=development

# Azure AD Configuration (Optional - for production authentication)
# Obtain from Azure Portal > App Registrations
# Leave empty to use mock authentication only
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_REDIRECT_URI=http://localhost:5176/auth/azure/callback
```

### Azure AD Setup

To enable Azure AD authentication:

1. **Create App Registration in Azure Portal:**
   - Go to Azure Portal > App registrations > New registration
   - Name: "Hybrid UI Authentication"
   - Redirect URI: `http://localhost:5176/auth/azure/callback` (Web)
   - Click Register

2. **Configure API Permissions:**
   - Microsoft Graph > Delegated permissions
   - Add: `User.Read`, `openid`, `profile`, `email`
   - Grant admin consent (if you have admin rights)

3. **Create Client Secret:**
   - Go to Certificates & secrets > New client secret
   - Copy the secret value immediately (shown only once)

4. **Update .env file:**
   - Copy Tenant ID, Client ID, and Client Secret to `.env`
   - Restart auth server

5. **Production Deployment:**
   - Update `AZURE_AD_REDIRECT_URI` to production HTTPS URL
   - Update redirect URI in Azure App Registration
   - Use environment variables or Azure Key Vault for secrets

### Session Configuration

Default session settings (in `packages/shared/src/hooks/useAuth.js`):
```javascript
VALIDATION_INTERVAL_MS = 30000      // Validate every 30 seconds
SESSION_REFRESH_BUFFER_MS = 300000  // Refresh 5 minutes before expiry
```

## Troubleshooting

### Redis Connection Failed

**Problem:** Auth server can't connect to Redis

**Solution:**
```bash
# Check if Redis is running
docker ps | grep redis-auth

# Start Redis if not running
docker start redis-auth

# Or start new Redis container
docker run -d --name redis-auth -p 6379:6379 redis:7-alpine
```

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Find process using the port
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use a different port in vite.config.js
```

### Apps Not Sharing Authentication

**Problem:** Logged in to Frontdoor but CRM asks for login again

**Possible causes:**
1. Session params not in URL - check network tab for redirect
2. ProtectedRoute not implemented in app
3. localStorage being cleared - check browser console
4. Auth server down - check `http://localhost:5176/health`

### Session Expired Immediately

**Problem:** User logged out right after login

**Possible causes:**
1. Redis not running
2. Session TTL too short
3. System clock skew
4. Check auth server logs for errors

### Azure AD Login Not Working

**Problem:** Clicking "Sign in with Microsoft" shows error

**Possible causes:**
1. Azure AD not configured - check `.env` file has all values
2. Auth server not restarted after adding credentials
3. Azure AD subscription expired
4. Redirect URI mismatch - must match Azure Portal exactly
5. Missing API permissions in Azure Portal

**Solution:**
```bash
# Verify configuration loaded
cd packages/auth-server
node -e "import('./src/config.js').then(c => console.log('MSAL_CONFIG:', c.MSAL_CONFIG ? 'CONFIGURED' : 'NULL'))"

# Check auth server logs for errors
# Restart auth server to reload .env
npm run dev:auth

# Fall back to mock authentication for development
# Use username/password instead of Azure AD button
```

## Contributing

### Code Style

- Use functional components with hooks
- Prefer async/await over promises
- Export named functions, not default
- Use descriptive variable names
- Add comments for complex logic

### Commit Messages

Follow conventional commits format:
```
feat: add customer export functionality
fix: resolve session timeout issue
docs: update API documentation
refactor: simplify auth flow
```

### Feature Development Workflow

1. Create feature spec using `/tapsa create`
2. Implement in appropriate app/package
3. Update feature status with `/tapsa update`
4. Test across all apps
5. Mark feature as done
6. Commit with descriptive message

## Links

- [Feature Tracking](./features/README.md)
- [CLAUDE.md - AI Assistant Guide](./.claude/CLAUDE.md)
- [Auth Server Documentation](./packages/auth-server/README.md) *(if exists)*
- [Shared Package Documentation](./packages/shared/README.md) *(if exists)*

## License

[Specify your license]

## Support

For issues or questions:
1. Check existing feature specs in `features/`
2. Review CLAUDE.md for architectural patterns
3. Ask the AI agents for help (tapsa, niko, yap, billman, habibi, tommi)
