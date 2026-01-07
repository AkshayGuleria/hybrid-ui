---
id: routing
title: Add Client-Side Routing
status: review
priority: high
assignee: niko, yap, billman
created: 2025-01-07
updated: 2026-01-07
dependencies: []
blocks: [crm-crud, user-settings]
---

# Add Client-Side Routing

## Problem Statement

Currently each app in the hybrid-ui system is effectively single-page:
- No URL-based navigation within apps
- Users cannot bookmark or share links to specific views
- Detail views (e.g., `/customers/123`) are not possible
- Browser back/forward buttons don't work within apps
- No foundation for code splitting or lazy loading

This limits the apps to simple dashboard-style interfaces and prevents building a proper production-ready application.

## Proposed Solution

Add React Router (v6) to CRM and Revenue apps with a consistent route structure:

**CRM Routes:**
```
/                    → Redirect to /customers
/customers           → Customer list
/customers/:id       → Customer detail view
/customers/new       → New customer form (future)
```

**Revenue Routes:**
```
/                    → Redirect to /dashboard
/dashboard           → Revenue dashboard
/invoices            → Invoice list
/invoices/:id        → Invoice detail view
/invoices/new        → New invoice form (future)
```

**Key Architecture Decisions:**
1. Auth protection at route level (not just App.jsx)
2. Cross-origin auth params must work on any route entry point
3. Shared route protection component in `@hybrid-ui/shared`
4. Clean URL handling (no hash routing)

## Acceptance Criteria

- [x] CRM has working /customers route with list view
- [x] CRM has working /customers/:id route with detail view
- [x] Revenue has working /dashboard route
- [x] Revenue has working /invoices route with list view
- [x] Revenue has working /invoices/:id route with detail view
- [x] Auth protection works when entering on any route
- [x] Cross-origin auth transfer works on nested routes
- [x] Browser back/forward navigation works correctly
- [x] URLs are shareable and bookmarkable
- [x] 404 handling for unknown routes

## Subtasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1 | Install react-router-dom in CRM app | done | yap | npm install |
| 2 | Create CRM route structure and Router setup | done | yap | /customers, /customers/:id |
| 3 | Create CustomerDetail component | done | yap | View single customer |
| 4 | Install react-router-dom in Revenue app | done | billman | npm install |
| 5 | Create Revenue route structure and Router setup | done | billman | /dashboard, /invoices, /invoices/:id |
| 6 | Create InvoiceDetail component | done | billman | View single invoice |
| 7 | Create shared ProtectedRoute component | done | niko | Auth check wrapper |
| 8 | Update auth to handle route-level protection | done | niko | initSessionFromURL on any route |
| 9 | Test cross-app navigation with routing | done | | All routes work |
| 10 | Add 404 Not Found handling | done | | Both apps (shared NotFound component) |

## Technical Notes

### React Router v6 Setup

```jsx
// Example CRM App.jsx structure
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/customers" replace />} />
        <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Auth on Any Route Entry

The current auth flow checks URL params only in App.jsx on mount. With routing:
- User might enter on `/customers/123`
- Auth params will be in URL: `/customers/123?sessionToken=xxx&user=xxx`
- Auth check must happen before route renders
- After auth, clean URL should be `/customers/123` (not `/`)

### Cross-Origin Considerations

When navigating from Frontdoor to CRM:
1. Frontdoor builds URL: `http://localhost:5174/customers?sessionToken=xxx&user=xxx`
2. CRM receives on any route, extracts params
3. CRM stores in localStorage, cleans URL
4. Route renders with authenticated state

### Shared ProtectedRoute Component

```jsx
// packages/shared/src/components/ProtectedRoute.jsx
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, initSessionFromURL } = useAuth();

  useEffect(() => {
    initSessionFromURL(); // Check URL params on any route
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) {
    // Redirect to frontdoor with returnTo
    window.location.href = `http://localhost:5173/?returnTo=${encodeURIComponent(window.location.href)}`;
    return null;
  }

  return children;
}
```

## Progress Log

### 2026-01-07
- **Implementation complete** - All subtasks done, moved to review
- **niko**: Created ProtectedRoute and NotFound components in shared package
- **yap**: Installed react-router-dom, created route structure, CustomerDetail component
- **billman**: Installed react-router-dom, created route structure, InvoiceDetail component
- Added clickable navigation from list views to detail views
- All 10 acceptance criteria met
- Feature moved to in-progress
- Assigned to niko (shared auth), yap (CRM), billman (Revenue)

### 2025-01-07
- Initial spec created by tapsa
- Identified as foundational feature for production-ready app
- Determined to be prerequisite for crm-crud and future detail views

## Related

- Depends on: (none - foundational)
- Blocks: crm-crud, user-settings, invoice-management
- Discussion: Brainstorming session with tommi on project direction
