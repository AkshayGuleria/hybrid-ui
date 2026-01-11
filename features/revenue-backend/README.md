---
id: revenue-backend
title: Revenue Management Backend System
status: planned
priority: high
assignee: billman, habibi
created: 2026-01-11
updated: 2026-01-11
dependencies: [api-layer]
blocks: []
type: backend
phase: 1 of 5
phase1_status: planned
phase2_status: planned
phase3_status: planned
phase4_status: planned
phase5_status: planned
---

# Revenue Management Backend System

## Problem Statement

Currently, the Revenue app only displays mock invoice data with no backend system:
- No real database for invoices, customers, or products
- No invoice generation or billing logic
- No payment tracking or processing
- No subscription or recurring billing capabilities
- No usage-based (metered) billing
- No integration with payment gateways
- No billing automation or scheduled jobs

This prevents the Revenue app from being a production-ready billing system.

**Current State:**
```javascript
// Mock data in frontend
const mockInvoices = [
  { id: 'inv-001', amount: 5000, status: 'paid' }
];
```

**Need:**
A full-featured revenue management backend inspired by [jBilling](https://www.softwaresuggest.com/jbilling) - an enterprise billing platform with:
- Customer account management
- Product catalog and pricing models
- Automated invoice generation
- Subscription and recurring billing
- Payment processing
- Usage/metered billing
- Multi-currency support
- Comprehensive reporting

## Current State

**Frontend:**
- Revenue app with dashboard, invoice list, invoice detail views
- Mock data via shared API layer
- No real backend

**No Backend:**
- No database
- No API server
- No billing engine
- No payment processing

## Proposed Solution

Build a **Revenue Management Backend System** in phases, starting simple and adding complexity incrementally.

### Technology Stack

**Backend Framework:** Express.js (Node.js)
- Consistent with auth-server architecture
- Team already familiar with Express
- Excellent ecosystem for billing logic

**Database:** PostgreSQL
- Relational data (customers, products, invoices)
- ACID compliance (critical for financial data)
- JSON support for flexible schemas
- Mature and battle-tested

**Optional (Later Phases):**
- Redis for caching and job queues
- Stripe/PayPal SDK for payment processing
- Bull or Agenda for scheduled jobs (recurring billing)
- PDF generation (pdfkit or puppeteer)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Revenue Frontend                         │
│              (React - Revenue App)                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP REST API
┌────────────────────▼────────────────────────────────────────┐
│                Revenue Backend API                           │
│              (Express.js - Port 5177)                       │
│                                                              │
│  Routes:                                                     │
│  • /api/customers     - Customer management                 │
│  • /api/products      - Product catalog                     │
│  • /api/invoices      - Invoice operations                  │
│  • /api/subscriptions - Subscription management             │
│  • /api/payments      - Payment tracking                    │
│  • /api/billing       - Billing engine                      │
│  • /api/reports       - Analytics and reports               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  PostgreSQL Database                         │
│                                                              │
│  Tables:                                                     │
│  • customers       - Customer accounts                      │
│  • products        - Product/service catalog                │
│  • pricing_plans   - Pricing models                         │
│  • invoices        - Generated invoices                     │
│  • invoice_items   - Line items                             │
│  • subscriptions   - Active subscriptions                   │
│  • payments        - Payment records                        │
│  • usage_records   - Metered usage tracking                 │
│  • billing_cycles  - Recurring billing schedules            │
└─────────────────────────────────────────────────────────────┘
```

### Phased Approach

**Phase 1: Foundation** (Weeks 1-2)
- Basic CRUD for customers, products, invoices
- PostgreSQL database setup
- RESTful API endpoints
- Manual invoice creation

**Phase 2: Automation** (Weeks 3-4)
- Automated invoice generation
- Billing cycles (monthly, annual)
- Email notifications
- PDF invoice generation

**Phase 3: Subscriptions** (Weeks 5-6)
- Subscription plans
- Recurring billing automation
- Auto-renewal logic
- Proration handling

**Phase 4: Advanced Billing** (Weeks 7-9)
- Usage-based (metered) billing
- Dunning management (failed payments)
- Multi-currency support
- Tax calculation rules

**Phase 5: Enterprise Features** (Weeks 10-12)
- Advanced analytics dashboard
- Custom billing rules engine
- Webhooks for events
- Payment gateway integration (Stripe)
- Multi-tenant support

## Acceptance Criteria

### Phase 1: Foundation (MUST HAVE)
- [x] PostgreSQL database setup with migrations
- [x] Customer CRUD API (create, read, update, delete)
- [x] Product catalog API
- [x] Manual invoice creation API
- [x] Invoice item line items
- [x] Basic invoice status workflow (draft → sent → paid → overdue)
- [x] RESTful API documentation (Swagger/OpenAPI)
- [x] Database schema designed for extensibility
- [x] API authentication (integrate with auth-server sessions)
- [x] Revenue frontend migrated to real backend

### Phase 2: Automation (SHOULD HAVE)
- [x] Automated invoice generation based on rules
- [x] Billing cycle configuration (monthly, quarterly, annual)
- [x] Scheduled job runner for recurring tasks
- [x] Email notification system
- [x] PDF invoice generation
- [x] Invoice numbering with customizable format
- [x] Due date calculation based on payment terms
- [x] Basic reporting (revenue by period, customer)

### Phase 3: Subscriptions (SHOULD HAVE)
- [x] Subscription plan definition
- [x] Customer subscription enrollment
- [x] Auto-renewal logic
- [x] Subscription lifecycle (active, canceled, expired)
- [x] Proration calculation (upgrades, downgrades, cancellations)
- [x] Trial period support
- [x] Grace period for failed payments
- [x] Subscription analytics

### Phase 4: Advanced Billing (NICE TO HAVE)
- [x] Usage-based (metered) billing
- [x] Usage record ingestion API
- [x] Rating engine (convert usage to charges)
- [x] Dunning workflows (retry failed payments)
- [x] Multi-currency support
- [x] Currency conversion rates
- [x] Tax rules engine
- [x] Discount codes and promotions
- [x] Credit notes and refunds

### Phase 5: Enterprise Features (NICE TO HAVE)
- [x] Advanced analytics dashboard
- [x] Custom billing rules (Javascript/Lua scripting)
- [x] Webhook system for billing events
- [x] Payment gateway integration (Stripe API)
- [x] Multi-tenant architecture
- [x] Audit logging for compliance
- [x] Data export (CSV, JSON)
- [x] API rate limiting and throttling

## Subtasks

### Phase 1: Foundation (Weeks 1-2)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Database Setup** | | | | |
| 1 | Design database schema (ERD) | planned | billman | Customers, products, invoices |
| 2 | Set up PostgreSQL with Docker | planned | habibi | docker-compose service |
| 3 | Create migration system (node-pg-migrate) | planned | billman | Version control for schema |
| 4 | Write initial migrations | planned | billman | Create tables |
| 5 | Seed database with sample data | planned | billman | Test data |
| **API Server** | | | | |
| 6 | Create revenue-backend package structure | planned | billman | Express.js setup |
| 7 | Set up Express server with CORS | planned | billman | Port 5177 |
| 8 | Integrate auth-server session validation | planned | billman | Middleware for auth |
| 9 | Set up PostgreSQL connection pool (pg) | planned | billman | Database client |
| **Customer API** | | | | |
| 10 | POST /api/customers - Create customer | planned | billman | Validation, error handling |
| 11 | GET /api/customers - List customers | planned | billman | Pagination, filtering |
| 12 | GET /api/customers/:id - Get customer | planned | billman | With related data |
| 13 | PUT /api/customers/:id - Update customer | planned | billman | Partial updates |
| 14 | DELETE /api/customers/:id - Delete customer | planned | billman | Soft delete |
| **Product API** | | | | |
| 15 | POST /api/products - Create product | planned | billman | Name, price, type |
| 16 | GET /api/products - List products | planned | billman | Filter by type |
| 17 | GET /api/products/:id - Get product | planned | billman | With pricing details |
| 18 | PUT /api/products/:id - Update product | planned | billman | Price history |
| **Invoice API** | | | | |
| 19 | POST /api/invoices - Create invoice | planned | billman | Manual creation |
| 20 | GET /api/invoices - List invoices | planned | billman | Filter by status, customer |
| 21 | GET /api/invoices/:id - Get invoice | planned | billman | With line items |
| 22 | PUT /api/invoices/:id - Update invoice | planned | billman | Status transitions |
| 23 | POST /api/invoices/:id/items - Add line item | planned | billman | Product, quantity, price |
| 24 | DELETE /api/invoices/:id/items/:itemId | planned | billman | Remove line item |
| **Frontend Integration** | | | | |
| 25 | Update Revenue app API client | planned | billman | Point to localhost:5177 |
| 26 | Update useInvoices hook | planned | billman | Real API calls |
| 27 | Update useCustomers hook (Revenue context) | planned | billman | Different from CRM |
| 28 | Test full CRUD flow in UI | planned | billman | End-to-end |
| **Documentation** | | | | |
| 29 | Write API documentation (Swagger) | planned | billman | OpenAPI spec |
| 30 | Write README for revenue-backend | planned | billman | Setup, usage |

### Phase 2: Automation (Weeks 3-4)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Billing Engine** | | | | |
| 31 | Design billing cycle configuration | planned | billman | Monthly, quarterly, annual |
| 32 | Create billing_cycles table | planned | billman | Migration |
| 33 | POST /api/billing-cycles - Create cycle | planned | billman | Schedule, rules |
| 34 | Build invoice generation engine | planned | billman | From billing cycle + customer |
| 35 | POST /api/billing/generate - Trigger generation | planned | billman | On-demand |
| **Scheduled Jobs** | | | | |
| 36 | Set up job scheduler (Bull/Redis) | planned | habibi | Job queue |
| 37 | Create recurring job for invoice generation | planned | billman | Daily cron |
| 38 | Add job monitoring dashboard | planned | billman | View job status |
| **Email System** | | | | |
| 39 | Set up email service (Nodemailer) | planned | billman | SMTP config |
| 40 | Create invoice email templates | planned | billman | HTML + plain text |
| 41 | POST /api/invoices/:id/send - Send invoice | planned | billman | Email to customer |
| 42 | Add email notification on invoice created | planned | billman | Event-driven |
| **PDF Generation** | | | | |
| 43 | Install PDF library (pdfkit or puppeteer) | planned | billman | Choose best fit |
| 44 | Create invoice PDF template | planned | billman | Company logo, styling |
| 45 | GET /api/invoices/:id/pdf - Download PDF | planned | billman | Generate on demand |
| 46 | Store PDFs in filesystem/S3 | planned | billman | Caching |
| **Invoice Enhancements** | | | | |
| 47 | Implement invoice numbering system | planned | billman | INV-2026-001 format |
| 48 | Add payment terms configuration | planned | billman | Net 30, Net 60 |
| 49 | Calculate due dates automatically | planned | billman | From issue date + terms |
| 50 | Invoice status auto-transition (overdue) | planned | billman | Scheduled check |
| **Reporting** | | | | |
| 51 | GET /api/reports/revenue - Revenue by period | planned | billman | Aggregate queries |
| 52 | GET /api/reports/customers - Customer analytics | planned | billman | Top customers |
| 53 | Create reports database views | planned | billman | Optimize queries |

### Phase 3: Subscriptions (Weeks 5-6)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Subscription Plans** | | | | |
| 54 | Create subscription_plans table | planned | billman | Migration |
| 55 | POST /api/plans - Create plan | planned | billman | Name, price, interval |
| 56 | GET /api/plans - List plans | planned | billman | Public catalog |
| 57 | Support tiered pricing | planned | billman | Different tiers/features |
| **Customer Subscriptions** | | | | |
| 58 | Create subscriptions table | planned | billman | Customer, plan, status |
| 59 | POST /api/subscriptions - Subscribe customer | planned | billman | Enroll in plan |
| 60 | GET /api/subscriptions - List subscriptions | planned | billman | Filter by customer |
| 61 | PUT /api/subscriptions/:id - Update subscription | planned | billman | Upgrade/downgrade |
| 62 | DELETE /api/subscriptions/:id - Cancel | planned | billman | Immediate or end of period |
| **Renewal Logic** | | | | |
| 63 | Build auto-renewal job | planned | billman | Check expiring subscriptions |
| 64 | Generate renewal invoices | planned | billman | Before renewal date |
| 65 | Handle renewal failures | planned | billman | Grace period |
| **Proration** | | | | |
| 66 | Calculate proration for upgrades | planned | billman | Credit unused time |
| 67 | Calculate proration for downgrades | planned | billman | Apply at next renewal |
| 68 | Handle mid-cycle cancellations | planned | billman | Refund or credit |
| **Trial Periods** | | | | |
| 69 | Add trial period support to plans | planned | billman | Days count |
| 70 | Create subscription with trial | planned | billman | No initial charge |
| 71 | Convert trial to paid automatically | planned | billman | After trial ends |
| **Analytics** | | | | |
| 72 | GET /api/reports/subscriptions/mrr | planned | billman | Monthly Recurring Revenue |
| 73 | GET /api/reports/subscriptions/churn | planned | billman | Cancellation rate |
| 74 | Subscription lifecycle metrics | planned | billman | Active, churned, etc. |

### Phase 4: Advanced Billing (Weeks 7-9)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Usage-Based Billing** | | | | |
| 75 | Create usage_records table | planned | billman | Metered usage data |
| 76 | POST /api/usage - Ingest usage record | planned | billman | API calls, GB, etc. |
| 77 | GET /api/usage - Query usage | planned | billman | By customer, period |
| 78 | Build rating engine | planned | billman | Convert usage to charges |
| 79 | Support tiered/volume pricing | planned | billman | $0.10/GB 0-100, $0.05/GB 100+ |
| 80 | Generate usage-based invoices | planned | billman | Aggregate usage |
| **Dunning** | | | | |
| 81 | Create dunning_workflows table | planned | billman | Retry rules |
| 82 | POST /api/payments/:id/retry - Retry payment | planned | billman | Manual retry |
| 83 | Automated retry job | planned | billman | 3 retries over 7 days |
| 84 | Email notifications for failed payments | planned | billman | Escalating urgency |
| 85 | Suspend subscription after failures | planned | billman | Grace period expired |
| **Multi-Currency** | | | | |
| 86 | Add currency field to invoices | planned | billman | USD, EUR, GBP |
| 87 | Create exchange_rates table | planned | billman | Daily rates |
| 88 | GET /api/exchange-rates - Fetch rates | planned | billman | External API integration |
| 89 | Convert invoice amounts | planned | billman | Display in customer currency |
| **Tax Calculation** | | | | |
| 90 | Create tax_rules table | planned | billman | By region, product type |
| 91 | Calculate tax on invoice items | planned | billman | Based on customer location |
| 92 | Support VAT/GST/Sales tax | planned | billman | Different tax types |
| **Discounts & Credits** | | | | |
| 93 | Create discount_codes table | planned | billman | Promo codes |
| 94 | POST /api/discounts - Create discount | planned | billman | %, fixed amount |
| 95 | Apply discount to invoice | planned | billman | Validation |
| 96 | Create credit_notes table | planned | billman | Refunds, credits |
| 97 | POST /api/credit-notes - Issue credit | planned | billman | Adjust invoice |

### Phase 5: Enterprise Features (Weeks 10-12)

| ID | Task | Status | Assignee | Notes |
|----|------|--------|----------|-------|
| **Advanced Analytics** | | | | |
| 98 | Build analytics dashboard API | planned | billman | KPIs, charts |
| 99 | GET /api/analytics/arr - Annual Recurring Revenue | planned | billman | Forecasting |
| 100 | GET /api/analytics/ltv - Customer Lifetime Value | planned | billman | Cohort analysis |
| 101 | Revenue forecasting | planned | billman | Predictive analytics |
| **Custom Billing Rules** | | | | |
| 102 | Design rules engine architecture | planned | billman | Plugin system |
| 103 | Support custom Javascript rules | planned | billman | Sandboxed execution |
| 104 | Rule testing framework | planned | billman | Validate rules |
| **Webhooks** | | | | |
| 105 | Create webhooks table | planned | billman | Subscriber URLs |
| 106 | POST /api/webhooks - Register webhook | planned | billman | Event types |
| 107 | Webhook delivery system | planned | billman | Retry logic |
| 108 | Webhook signature verification | planned | billman | HMAC security |
| 109 | Events: invoice.created, payment.succeeded | planned | billman | Event catalog |
| **Payment Gateway** | | | | |
| 110 | Integrate Stripe SDK | planned | billman | Payment processing |
| 111 | POST /api/payments - Process payment | planned | billman | Credit card |
| 112 | Stripe webhook handler | planned | billman | Async updates |
| 113 | Support multiple payment methods | planned | billman | Card, ACH, etc. |
| **Multi-Tenant** | | | | |
| 114 | Add tenant_id to all tables | planned | billman | Row-level security |
| 115 | Tenant isolation middleware | planned | billman | Security |
| 116 | Tenant provisioning API | planned | billman | Create new tenant |
| **Compliance & Export** | | | | |
| 117 | Audit logging system | planned | billman | All mutations logged |
| 118 | GET /api/export/invoices - Export CSV | planned | billman | Data portability |
| 119 | GET /api/export/customers - Export JSON | planned | billman | Backup |
| 120 | API rate limiting | planned | billman | Prevent abuse |

## Technical Notes

### Database Schema (Phase 1)

**Customers:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  company VARCHAR(255),
  billing_address_line1 VARCHAR(255),
  billing_address_line2 VARCHAR(255),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(2), -- ISO 3166-1 alpha-2
  payment_terms VARCHAR(50) DEFAULT 'net_30', -- net_30, net_60, due_on_receipt
  currency VARCHAR(3) DEFAULT 'USD', -- ISO 4217
  tax_id VARCHAR(100), -- VAT/EIN
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, closed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP -- Soft delete
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
```

**Products:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL, -- one_time, recurring, metered
  price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_interval VARCHAR(20), -- month, year (for recurring)
  unit VARCHAR(50), -- GB, API_calls, seats (for metered)
  active BOOLEAN DEFAULT true,
  metadata JSONB, -- Custom fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_active ON products(active);
```

**Invoices:**
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, overdue, void
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

**Invoice Items:**
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
```

### API Structure

```
packages/revenue-backend/
├── src/
│   ├── index.js              # Server entry point
│   ├── config/
│   │   ├── database.js       # PostgreSQL connection
│   │   └── env.js            # Environment variables
│   ├── routes/
│   │   ├── customers.js      # Customer endpoints
│   │   ├── products.js       # Product endpoints
│   │   ├── invoices.js       # Invoice endpoints
│   │   ├── subscriptions.js  # Subscription endpoints (Phase 3)
│   │   ├── payments.js       # Payment endpoints (Phase 4)
│   │   ├── billing.js        # Billing engine (Phase 2)
│   │   └── reports.js        # Analytics (Phase 5)
│   ├── services/
│   │   ├── invoice-generator.js  # Invoice creation logic
│   │   ├── billing-engine.js     # Automated billing
│   │   ├── email-service.js      # Email sending
│   │   ├── pdf-generator.js      # PDF creation
│   │   └── payment-gateway.js    # Stripe integration
│   ├── jobs/
│   │   ├── recurring-billing.js  # Scheduled jobs
│   │   └── dunning.js            # Failed payment retries
│   ├── middleware/
│   │   ├── auth.js               # Session validation
│   │   └── validate.js           # Request validation
│   └── utils/
│       ├── proration.js          # Proration calculations
│       └── tax-calculator.js     # Tax logic
├── migrations/
│   ├── 001_create_customers.sql
│   ├── 002_create_products.sql
│   └── 003_create_invoices.sql
├── package.json
├── Dockerfile
└── README.md
```

### Environment Variables

```bash
# packages/revenue-backend/.env
PORT=5177
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/revenue_db

# Auth Server Integration
AUTH_SERVER_URL=http://localhost:5176

# Email (Phase 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=billing@hybrid-ui.com
SMTP_PASSWORD=secret

# Payment Gateway (Phase 5)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis for jobs (Phase 2)
REDIS_URL=redis://localhost:6379
```

### API Examples

**Create Invoice:**
```http
POST /api/invoices
Content-Type: application/json
Authorization: Bearer {sessionToken}

{
  "customer_id": "cust-123",
  "issue_date": "2026-01-11",
  "due_date": "2026-02-10",
  "items": [
    {
      "product_id": "prod-456",
      "description": "CRM Pro - Monthly",
      "quantity": 1,
      "unit_price": 99.00
    },
    {
      "description": "Setup Fee",
      "quantity": 1,
      "unit_price": 199.00
    }
  ],
  "notes": "Thank you for your business!"
}
```

**Response:**
```json
{
  "id": "inv-789",
  "invoice_number": "INV-2026-001",
  "customer_id": "cust-123",
  "status": "draft",
  "issue_date": "2026-01-11",
  "due_date": "2026-02-10",
  "subtotal": 298.00,
  "tax": 0.00,
  "total": 298.00,
  "currency": "USD",
  "items": [
    {
      "id": "item-1",
      "product_id": "prod-456",
      "description": "CRM Pro - Monthly",
      "quantity": 1,
      "unit_price": 99.00,
      "amount": 99.00
    },
    {
      "id": "item-2",
      "description": "Setup Fee",
      "quantity": 1,
      "unit_price": 199.00,
      "amount": 199.00
    }
  ],
  "created_at": "2026-01-11T10:30:00Z"
}
```

### Integration with Existing System

**Auth Server Integration:**
```javascript
// middleware/auth.js
import axios from 'axios';

export async function validateSession(req, res, next) {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token' });
  }

  try {
    const response = await axios.post('http://localhost:5176/auth/validate', {
      sessionToken
    });

    if (!response.data.valid) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    req.user = response.data.user;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Auth validation failed' });
  }
}
```

**Revenue Frontend Migration:**
```javascript
// packages/revenue-app/src/api/invoices.js (updated)

const API_BASE = import.meta.env.VITE_REVENUE_API_URL || 'http://localhost:5177';

export const invoicesApi = {
  async getAll() {
    const sessionToken = localStorage.getItem('sessionToken');
    const response = await fetch(`${API_BASE}/api/invoices`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    return response.json();
  },

  async getById(id) {
    const sessionToken = localStorage.getItem('sessionToken');
    const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
    return response.json();
  },

  async create(invoice) {
    const sessionToken = localStorage.getItem('sessionToken');
    const response = await fetch(`${API_BASE}/api/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoice)
    });
    return response.json();
  }
};
```

### jBilling Reference Comparison

Our phased approach compared to [jBilling features](https://www.softwaresuggest.com/jbilling):

| jBilling Feature | Our Implementation | Phase |
|------------------|-------------------|-------|
| Account Management | Customers API | Phase 1 |
| Product Catalog | Products API | Phase 1 |
| Manual Invoicing | Invoice CRUD | Phase 1 |
| Automated Invoicing | Billing Engine | Phase 2 |
| Recurring Billing | Subscriptions | Phase 3 |
| Email Notifications | Email Service | Phase 2 |
| PDF Generation | PDF Service | Phase 2 |
| Payment Processing | Stripe Integration | Phase 5 |
| Usage/Metered Billing | Usage Records + Rating | Phase 4 |
| Multi-Currency | Exchange Rates | Phase 4 |
| Tax Calculation | Tax Rules Engine | Phase 4 |
| Reporting & Analytics | Analytics API | Phase 2, 5 |
| Dunning Management | Retry Workflows | Phase 4 |
| API-First | RESTful API (all phases) | All |
| Parent-Child Accounts | (Future enhancement) | - |
| Custom Fields | JSONB metadata | Phase 1 |

**Advantages over jBilling:**
- ✅ Modern tech stack (PostgreSQL, Express, React)
- ✅ Simpler architecture (no Java/Spring complexity)
- ✅ API-first design from day one
- ✅ Phased rollout (start simple, add complexity)
- ✅ Integrated with existing hybrid-ui auth

**Trade-offs:**
- ⚠️ Less mature than jBilling (20+ years old)
- ⚠️ Fewer enterprise features initially
- ⚠️ No legacy system integrations

## Security Considerations

1. **Financial Data Protection:**
   - All financial data in PostgreSQL (ACID compliance)
   - No sensitive data in logs
   - Encrypt data at rest (production)
   - Audit trail for all financial operations

2. **API Security:**
   - Session-based authentication (via auth-server)
   - Rate limiting to prevent abuse
   - Input validation on all endpoints
   - SQL injection prevention (parameterized queries)

3. **Payment Data:**
   - Never store credit card numbers (PCI compliance)
   - Use Stripe for card storage (tokenization)
   - Secure webhook signature verification

4. **Multi-Tenant Isolation:**
   - Row-level security in PostgreSQL
   - Tenant ID in all queries
   - Prevent cross-tenant data access

## Performance Considerations

1. **Database Optimization:**
   - Proper indexes on frequently queried columns
   - Connection pooling (pg)
   - Query optimization for reports
   - Materialized views for analytics

2. **Caching:**
   - Redis for frequently accessed data
   - Cache exchange rates (update daily)
   - Cache product catalog

3. **Scalability:**
   - Horizontal scaling via load balancer
   - Read replicas for reporting queries
   - Job queue for async operations

## Testing Strategy

**Phase 1:**
- Unit tests for API endpoints
- Integration tests with PostgreSQL
- API contract testing

**Phase 2:**
- Job scheduler testing
- Email delivery testing (mock SMTP)
- PDF generation testing

**Phase 3:**
- Subscription lifecycle testing
- Proration calculation testing
- Renewal job testing

**Phase 4+:**
- Usage rating accuracy testing
- Multi-currency conversion testing
- Payment gateway integration testing (Stripe test mode)

## Progress Log

### 2026-01-11
- Initial spec created by tapsa
- Assigned to billman (revenue domain) and habibi (database/infrastructure)
- 5-phase approach designed based on jBilling reference
- 120 subtasks defined across all phases
- Priority: high (critical backend infrastructure)
- Dependencies: api-layer (for frontend integration patterns)

## Related

- Depends on: api-layer (for frontend integration patterns)
- Blocks: (none currently)
- Related discussion: jBilling research for feature reference
- Related apps: Revenue app (frontend consumer)
- Related agents: billman (primary), habibi (database setup)

---

## Quick Reference

**Phase Summary:**
- **Phase 1** (2 weeks): Foundation - Basic CRUD, PostgreSQL
- **Phase 2** (2 weeks): Automation - Auto invoicing, emails, PDFs
- **Phase 3** (2 weeks): Subscriptions - Recurring billing, renewals
- **Phase 4** (3 weeks): Advanced - Usage billing, dunning, multi-currency
- **Phase 5** (3 weeks): Enterprise - Analytics, webhooks, Stripe

**Total Timeline:** ~12 weeks (3 months)

**Tech Stack:**
- Backend: Express.js (Node.js)
- Database: PostgreSQL
- Jobs: Bull + Redis
- Payments: Stripe API
- Email: Nodemailer
- PDF: pdfkit

---

## Sources

Research based on:
- [jBilling Reviews & Features](https://www.softwaresuggest.com/jbilling)
- [Best Open-Source Billing Tools 2025](https://flexprice.io/blog/best-open-source-tools-subscription-billing)
