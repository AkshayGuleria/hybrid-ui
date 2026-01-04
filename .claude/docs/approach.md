# Hybrid UI Architecture Approaches

This document outlines different architectural approaches for building a multi-app hybrid UI system, with detailed analysis of the approach implemented in this repository.

## Approach #5: Hybrid Shell (Implemented)

### Overview

The **Hybrid Shell** approach uses multiple independent React applications running on different development ports, sharing authentication through a centralized "frontdoor" application. Each app is completely independent but integrated through a shared authentication and navigation system.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (User)                            │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
        Port 5173      Port 5174      Port 5175
               ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │Frontdoor │   │   CRM    │   │ Revenue  │
        │   App    │   │   App    │   │   App    │
        └────┬─────┘   └────┬─────┘   └────┬─────┘
             │              │              │
             └──────────────┴──────────────┘
                           │
                    ┌──────▼──────┐
                    │   Shared    │
                    │  Package    │
                    │ (useAuth,   │
                    │TopNavigation)│
                    └─────────────┘
```

### Key Characteristics

**1. Independent Applications**
- Each app runs on its own port (different origin)
- Separate Vite dev servers
- Independent build processes
- Own node_modules and dependencies

**2. Shared Package Architecture**
- Common `@hybrid-ui/shared` package
- Exports `useAuth` hook and `TopNavigation` component
- Managed through npm workspaces

**3. Cross-Origin Authentication**
- Apps on different ports = different localStorage contexts
- Auth data passed via URL parameters
- Each app stores auth in its own localStorage
- Frontdoor acts as authentication gateway

### Implementation Details

#### Authentication Flow

```javascript
// Step 1: User visits protected app (e.g., CRM on port 5174)
// CRM detects no auth in localStorage
window.location.href = `http://localhost:5173/?returnTo=${encodeURIComponent(currentUrl)}`;

// Step 2: User logs in at Frontdoor (port 5173)
const result = await login(username, password);
// User data stored in frontdoor's localStorage

// Step 3: Frontdoor redirects back with user data in URL
const encodedUser = encodeURIComponent(JSON.stringify(userData));
window.location.href = `${returnTo}?user=${encodedUser}`;

// Step 4: Protected app receives and stores auth
const userData = params.get('user');
localStorage.setItem('user', JSON.stringify(decodedUser));
window.history.replaceState({}, '', window.location.pathname);
window.location.reload(); // Pick up new auth state
```

#### Navigation Between Apps

```javascript
// All inter-app navigation uses full URLs with ports
<a href="http://localhost:5174">Go to CRM</a>
<a href="http://localhost:5175">Go to Revenue</a>

// Home navigation
<a href="http://localhost:5173">🏠 Hybrid UI</a>
```

### Advantages

✅ **Complete Isolation**
- Apps cannot interfere with each other
- Bugs in one app don't affect others
- Independent deployment cycles

✅ **Technology Flexibility**
- Each app can use different versions of libraries
- Can potentially use different frameworks
- No version conflicts

✅ **Development Independence**
- Teams can work on apps independently
- No shared build system complexities
- Fast development iteration (only one app running)

✅ **Simple Build & Deploy**
- Standard Vite build process per app
- No special bundlers or configurations
- Each app can be deployed separately

✅ **Clear Ownership**
- Agent skills map directly to apps (niko, yap, billman)
- Clear boundaries and responsibilities
- Easy to understand and maintain

### Disadvantages

❌ **Cross-Origin Complexity**
- Cannot share localStorage directly
- Requires URL parameter auth transfer
- Full page reloads on navigation
- More complex authentication flow

❌ **No Code Sharing at Runtime**
- React loaded separately for each app
- Larger total bundle size
- Duplicate dependencies across apps

❌ **Development Experience**
- Must run multiple dev servers
- Port management required
- Cannot use relative URLs for navigation

❌ **Not Production-Ready**
- Hardcoded localhost URLs
- Requires nginx/reverse proxy for production
- Manual port coordination

### Production Considerations

To deploy this architecture to production, you would need:

1. **Reverse Proxy (nginx)**
   ```nginx
   location / {
     proxy_pass http://frontdoor:5173;
   }
   location /crm {
     proxy_pass http://crm:5174;
   }
   location /revenue {
     proxy_pass http://revenue:5175;
   }
   ```

2. **Same-Origin Mounting**
   - All apps served from same domain
   - Different paths instead of ports
   - Enables shared cookies/localStorage

3. **Environment-Based URLs**
   - Replace hardcoded localhost URLs
   - Use environment variables
   - Build-time URL configuration

---

## Alternative Approaches (Not Implemented)

### Approach #1: Single SPA

**Concept:** One shell application dynamically loads micro-frontends as modules at runtime.

**Pros:**
- Shared dependencies (single React instance)
- Smaller bundle sizes
- Client-side navigation (no full page reloads)

**Cons:**
- Complex build configuration
- Tight coupling between apps
- Version conflicts between micro-frontends
- Single point of failure

**Why Not Chosen:** Too complex for development setup, requires build-time coordination.

---

### Approach #2: Module Federation (Webpack 5)

**Concept:** Webpack's Module Federation allows apps to dynamically import modules from other apps at runtime.

**Pros:**
- Share dependencies efficiently
- True micro-frontend architecture
- Dynamic loading of remote modules
- Version management built-in

**Cons:**
- Requires Webpack (we use Vite)
- Complex configuration
- Runtime overhead
- Difficult debugging

**Why Not Chosen:** Would require switching from Vite to Webpack, adds significant complexity.

---

### Approach #3: iFrame-Based Composition

**Concept:** Each app runs in an iframe with postMessage communication.

**Pros:**
- Perfect isolation (security)
- No dependency conflicts
- Simple to implement
- Works with any framework

**Cons:**
- Poor UX (iframe scrolling issues)
- Complex communication via postMessage
- SEO challenges
- Difficult styling/theming
- Browser history problems

**Why Not Chosen:** Poor user experience, complex parent-child communication.

---

### Approach #4: Server-Side Composition (SSI/ESI)

**Concept:** Server assembles HTML from multiple services before sending to client.

**Pros:**
- No client-side complexity
- Good for SEO
- Fast initial load
- Cacheable fragments

**Cons:**
- Requires backend infrastructure
- No client-side interactivity between apps
- Complex cache invalidation
- Not suitable for SPAs

**Why Not Chosen:** Doesn't fit the SPA/React architecture we're building.

---

### Approach #6: Monolith with Lazy Loading

**Concept:** Single React app with code-split routes and lazy-loaded modules.

**Pros:**
- Simple development setup
- Shared state management
- Single build process
- Easy navigation

**Cons:**
- Not truly "hybrid" or "micro-frontend"
- All code in one repository
- Tight coupling
- Difficult for multi-team development

**Why Not Chosen:** Doesn't provide the isolation and independence we need.

---

## Comparison Matrix

| Feature | #5 Hybrid Shell | #1 Single SPA | #2 Module Federation | #3 iFrames | #4 SSI | #6 Monolith |
|---------|----------------|---------------|---------------------|-----------|--------|-------------|
| **Isolation** | ✅ Strong | ⚠️ Weak | ⚠️ Medium | ✅ Perfect | ✅ Strong | ❌ None |
| **Bundle Size** | ❌ Large | ✅ Small | ✅ Small | ❌ Large | N/A | ✅ Small |
| **Dev Experience** | ⚠️ Medium | ❌ Complex | ❌ Complex | ✅ Simple | ⚠️ Medium | ✅ Simple |
| **Tech Flexibility** | ✅ High | ❌ Low | ⚠️ Medium | ✅ High | ✅ High | ❌ Low |
| **Production Ready** | ⚠️ Needs Work | ✅ Yes | ✅ Yes | ⚠️ Needs Work | ✅ Yes | ✅ Yes |
| **Team Independence** | ✅ High | ❌ Low | ⚠️ Medium | ✅ High | ✅ High | ❌ Low |

---

## Implementation Recommendations

### For This Project (Development)
✅ **Hybrid Shell (#5)** is the right choice because:
- Prioritizes development simplicity
- Clear separation for agent skills
- Easy to understand and maintain
- Good isolation for independent work

### For Production Deployment
Consider adding:
1. **Nginx reverse proxy** for same-origin mounting
2. **Environment-based URLs** instead of hardcoded localhost
3. **Shared authentication service** (OAuth/JWT tokens)
4. **Service mesh** for inter-app communication

### For Scale (Future)
If the system grows significantly, consider migrating to:
- **Module Federation** for better bundle sizes
- **Shared component library** for consistent UI
- **Micro-frontends orchestration framework** (qiankun, single-spa)

---

## Key Architectural Decisions

### Decision 1: URL-Based Auth Transfer
**Chosen:** Pass user data via URL parameters
**Alternative:** Shared cookie, OAuth tokens, iframe postMessage
**Rationale:** Simplest for development, works across different ports

### Decision 2: Separate Dev Servers
**Chosen:** Each app on different port
**Alternative:** Single dev server with routing
**Rationale:** True isolation, independent development, clear boundaries

### Decision 3: localStorage for Session
**Chosen:** Per-origin localStorage
**Alternative:** Cookies, sessionStorage, IndexedDB
**Rationale:** Simple, no backend required, appropriate for mock auth

### Decision 4: Full Page Navigation
**Chosen:** window.location.href for app switching
**Alternative:** Client-side routing, iframe communication
**Rationale:** Simplest implementation, works with different origins

### Decision 5: Shared Package via npm Workspaces
**Chosen:** @hybrid-ui/shared workspace package
**Alternative:** Copy-paste code, npm package, git submodule
**Rationale:** Easy to share code, consistent versions, simple imports

---

## Migration Path to Production

### Phase 1: Development (Current)
- Multiple ports (5173, 5174, 5175)
- Hardcoded localhost URLs
- Mock authentication
- URL-based auth transfer

### Phase 2: Production Setup
1. Deploy behind nginx reverse proxy
2. Mount apps on paths: `/`, `/crm`, `/revenue`
3. Same-origin authentication (cookies/JWT)
4. Environment variables for URLs

### Phase 3: Optimization
1. Implement Module Federation
2. Shared React/dependencies
3. Centralized auth service
4. API gateway

### Phase 4: Scale
1. Kubernetes deployment
2. Service mesh (Istio)
3. Edge caching
4. Observability (metrics, tracing)

---

## Conclusion

The **Hybrid Shell (#5)** approach provides the best balance of:
- Development simplicity
- Team independence
- Clear architecture
- Room for future optimization

While it has limitations for production use, it's excellent for:
- Rapid prototyping
- Multi-agent development
- Learning micro-frontend concepts
- Building MVP before optimization

The architecture can be evolved incrementally toward production-ready patterns without major rewrites.
