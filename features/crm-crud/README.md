---
id: crm-crud
title: Customer CRUD Operations
status: planned
priority: medium
assignee: yap
created: 2026-01-07
updated: 2026-01-07
dependencies: [api-layer]
blocks: []
---

# Customer CRUD Operations

## Problem Statement

Currently the CRM app can only view customer data:
- No way to create new customers
- No way to edit existing customer information
- No way to delete customers
- Action buttons ("Send Email", "Call", "Edit") are non-functional placeholders

Users need full CRUD functionality to manage their customer database effectively.

## Proposed Solution

Add complete CRUD operations for customers in the CRM app:

1. **Create** - New customer form accessible from customer list
2. **Read** - Already implemented (CustomerList, CustomerDetail)
3. **Update** - Edit form accessible from customer detail view
4. **Delete** - Delete confirmation from customer detail view

**Key Architecture Decisions:**
- Use existing `useCustomerMutations` hook from shared package
- Forms use controlled components with validation
- Optimistic UI updates where appropriate
- Confirmation dialogs for destructive actions

## Acceptance Criteria

- [ ] "Add Customer" button on CustomerList creates new customer
- [ ] New customer form with validation (name, email required)
- [ ] "Edit" button on CustomerDetail opens edit form
- [ ] Edit form pre-populated with existing customer data
- [ ] "Delete" button with confirmation dialog
- [ ] Success/error feedback for all operations
- [ ] List refreshes after create/update/delete
- [ ] Form validation prevents invalid submissions
- [ ] Loading states during mutations

## Subtasks

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| 1 | Create CustomerForm component | planned | yap | Reusable for create/edit |
| 2 | Add "Add Customer" button to CustomerList | planned | yap | Opens form modal or page |
| 3 | Implement create customer flow | planned | yap | Use useCustomerMutations |
| 4 | Wire up "Edit" button in CustomerDetail | planned | yap | Opens form with data |
| 5 | Implement update customer flow | planned | yap | Use useCustomerMutations |
| 6 | Add DeleteConfirmation component | planned | yap | Reusable confirmation dialog |
| 7 | Wire up "Delete" button in CustomerDetail | planned | yap | With confirmation |
| 8 | Implement delete customer flow | planned | yap | Navigate back after delete |
| 9 | Add form validation | planned | yap | Required fields, email format |
| 10 | Add success/error toast notifications | planned | yap | User feedback |

## Technical Notes

### Using Existing Hooks

The `api-layer` feature already provides mutation hooks:

```javascript
import { useCustomerMutations } from '@hybrid-ui/shared';

const { createCustomer, updateCustomer, deleteCustomer, loading, error } = useCustomerMutations();

// Create
const result = await createCustomer({ name, email, phone, ... });
if (result.success) {
  // Navigate to new customer or refresh list
}

// Update
const result = await updateCustomer(id, { name, email, ... });

// Delete
const result = await deleteCustomer(id);
```

### Form Component Design

```jsx
// CustomerForm.jsx - used for both create and edit
function CustomerForm({ customer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(customer || defaultCustomer);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    // ... more validation
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

### Modal vs Page for Forms

Options:
1. **Modal** - Quick, stays in context, good for simple forms
2. **New Route** - `/customers/new`, `/customers/:id/edit` - better for complex forms

Recommendation: Start with modal for simplicity, can add routes later if needed.

### Customer Data Structure

```javascript
{
  id: 'cust-001',
  name: 'Acme Corporation',
  contactPerson: 'John Smith',
  email: 'john@acme.com',
  phone: '(555) 123-4567',
  company: 'Acme Corp',
  status: 'active', // active, lead, inactive
  value: 125000,
  lastContact: '2024-01-15',
  tags: ['enterprise', 'tech'],
  notes: 'Key account, handle with care'
}
```

### Validation Rules

- **name**: Required, min 2 characters
- **email**: Required, valid email format
- **phone**: Optional, valid phone format
- **status**: Required, one of: active, lead, inactive
- **value**: Optional, must be positive number
- **tags**: Optional, array of strings

## Progress Log

### 2026-01-07
- Initial spec created by tapsa
- Assigned to yap (CRM domain)
- Depends on api-layer (now complete)

## Related

- Depends on: api-layer (done)
- Blocks: (none)
- Related: invoice-management (similar pattern for Revenue app)
