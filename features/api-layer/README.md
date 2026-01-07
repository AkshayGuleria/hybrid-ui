---
id: api-layer
title: Shared API Abstraction Layer
status: review
priority: high
assignee: yap, billman
created: 2025-01-07
updated: 2026-01-07
dependencies: []
blocks: [crm-crud, invoice-management]
---

# Shared API Abstraction Layer

## Problem Statement

Previously, each app had mock data hardcoded in component files:
- `packages/crm-app/src/data/mockCustomers.js` (now removed)
- `packages/revenue-app/src/data/mockInvoices.js` (now removed)

This created several issues:
1. **No data fetching abstraction** - Components directly import mock data
2. **No loading/error states** - Data appears instantly, unrealistic
3. **Duplicate patterns** - Each app reinvents data handling
4. **Hard to migrate** - Switching to real backend requires rewriting components
5. **No caching** - Every render uses same static data
6. **No mutations** - Can't add/edit/delete data

## Proposed Solution

Create a shared API layer in `@hybrid-ui/shared` that:
1. Provides consistent data fetching interface
2. Currently uses mock data with realistic delays
3. Easily swappable to real backend later
4. Handles loading, error, and success states
5. Supports CRUD operations (even if mock)

**Directory Structure:**
```
packages/shared/src/
├── api/
│   ├── client.js         # Base fetch wrapper
│   ├── customers.js      # Customer API (for CRM)
│   ├── invoices.js       # Invoice API (for Revenue)
│   └── index.js          # Export all APIs
├── hooks/
│   ├── useAuth.js        # Existing
│   ├── useCustomers.js   # Customer data hook
│   └── useInvoices.js    # Invoice data hook
└── index.js              # Main exports
```

**Usage Pattern:**
```jsx
// In CRM app
import { useCustomers } from '@hybrid-ui/shared';

function CustomerList() {
  const { customers, loading, error, refetch } = useCustomers();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return <CustomerTable data={customers} />;
}
```

## Acceptance Criteria

- [x] API client base module created with fetch wrapper
- [x] Customer API module with getAll, getById, create, update, delete
- [x] Invoice API module with getAll, getById, create, update, delete
- [x] useCustomers hook with loading/error states
- [x] useInvoices hook with loading/error states
- [x] CRM app migrated to use new API layer
- [x] Revenue app migrated to use new API layer
- [x] Mock data moved into API layer (out of apps)
- [x] Simulated network delay for realistic UX
- [x] Error simulation capability for testing

## Subtasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1 | Create api/client.js base module | done | | Fetch wrapper with error handling |
| 2 | Create api/customers.js | done | yap | CRUD operations |
| 3 | Create api/invoices.js | done | billman | CRUD operations |
| 4 | Move mockCustomers into API layer | done | yap | Remove from crm-app |
| 5 | Move mockInvoices into API layer | done | billman | Remove from revenue-app |
| 6 | Create useCustomers hook | done | yap | Loading/error/data states |
| 7 | Create useInvoices hook | done | billman | Loading/error/data states |
| 8 | Migrate CRM CustomerList to use hook | done | yap | Replace direct import |
| 9 | Migrate Revenue components to use hook | done | billman | Dashboard + InvoiceList |
| 10 | Add simulated network delay | done | | 200-500ms realistic delay |
| 11 | Export all from shared package index | done | | Update packages/shared/src/index.js |

## Technical Notes

### API Client Design

```javascript
// packages/shared/src/api/client.js

const SIMULATED_DELAY = 300; // ms

async function simulateDelay() {
  await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
}

export async function apiGet(endpoint) {
  await simulateDelay();
  // For now, return mock data based on endpoint
  // Later, replace with: return fetch(`${API_BASE}${endpoint}`).then(r => r.json())
}

export async function apiPost(endpoint, data) {
  await simulateDelay();
  // Mock: add to local store
  // Later: return fetch(endpoint, { method: 'POST', body: JSON.stringify(data) })
}

// Similar for apiPut, apiDelete
```

### Customer API

```javascript
// packages/shared/src/api/customers.js
import { mockCustomers } from './data/customers';

let customers = [...mockCustomers]; // Mutable local store

export const customersApi = {
  async getAll() {
    await delay();
    return { data: customers, error: null };
  },

  async getById(id) {
    await delay();
    const customer = customers.find(c => c.id === id);
    return customer
      ? { data: customer, error: null }
      : { data: null, error: 'Customer not found' };
  },

  async create(customer) {
    await delay();
    const newCustomer = { ...customer, id: generateId() };
    customers.push(newCustomer);
    return { data: newCustomer, error: null };
  },

  async update(id, updates) {
    await delay();
    const index = customers.findIndex(c => c.id === id);
    if (index === -1) return { data: null, error: 'Customer not found' };
    customers[index] = { ...customers[index], ...updates };
    return { data: customers[index], error: null };
  },

  async delete(id) {
    await delay();
    customers = customers.filter(c => c.id !== id);
    return { data: null, error: null };
  }
};
```

### useCustomers Hook

```javascript
// packages/shared/src/hooks/useCustomers.js
import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../api/customers';

export function useCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await customersApi.getAll();
    if (result.error) {
      setError(result.error);
    } else {
      setCustomers(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers
  };
}

export function useCustomer(id) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const result = await customersApi.getById(id);
      if (result.error) {
        setError(result.error);
      } else {
        setCustomer(result.data);
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  return { customer, loading, error };
}
```

### Future: Real Backend Integration

When ready to add a real backend:

```javascript
// packages/shared/src/api/client.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function apiGet(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}
```

The hooks and components don't change - only the API layer implementation.

### Consideration: React Query?

For a production app, consider using React Query or SWR instead of custom hooks:
- Built-in caching
- Background refetching
- Devtools
- Optimistic updates

Decision: Start with custom hooks (simpler), migrate to React Query if needed.

## Progress Log

### 2026-01-07
- All subtasks completed - feature ready for review
- Created shared API layer with full CRUD operations
- Migrated CRM components (CustomerList, CustomerDetail) to use useCustomers hook
- Migrated Revenue components (InvoiceList, InvoiceDetail, RevenueDashboard) to use useInvoices hook
- Removed old mock data files from individual apps
- Added loading/error states to all data-fetching components
- Feature moved to in-progress
- Assigned to yap (customers) and billman (invoices)

### 2025-01-07
- Initial spec created by tapsa
- Identified as foundational for any CRUD features
- Designed to be backend-agnostic

## Related

- Depends on: (none - foundational)
- Blocks: crm-crud, invoice-management, any data mutation features
- Discussion: Brainstorming session with tommi on project direction
