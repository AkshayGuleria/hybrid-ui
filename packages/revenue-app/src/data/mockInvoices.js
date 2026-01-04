/**
 * Mock invoice and revenue data for Revenue Management app
 */

export const mockInvoices = [
  {
    id: 'INV-2026-001',
    customerId: 1,
    customerName: 'Acme Corporation',
    amount: 12500,
    currency: 'USD',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    paidDate: '2026-01-15',
    status: 'paid',
    description: 'Monthly subscription - January 2026',
    items: [
      { description: 'Enterprise Plan', quantity: 1, unitPrice: 10000, total: 10000 },
      { description: 'Additional Users (5)', quantity: 5, unitPrice: 500, total: 2500 }
    ]
  },
  {
    id: 'INV-2026-002',
    customerId: 2,
    customerName: 'TechStart Inc',
    amount: 4500,
    currency: 'USD',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    paidDate: null,
    status: 'sent',
    description: 'Monthly subscription - January 2026',
    items: [
      { description: 'Startup Plan', quantity: 1, unitPrice: 4500, total: 4500 }
    ]
  },
  {
    id: 'INV-2026-003',
    customerId: 3,
    customerName: 'Global Solutions Ltd',
    amount: 8900,
    currency: 'USD',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    paidDate: '2026-01-10',
    status: 'paid',
    description: 'Monthly subscription - January 2026',
    items: [
      { description: 'Professional Plan', quantity: 1, unitPrice: 7500, total: 7500 },
      { description: 'API Access', quantity: 1, unitPrice: 1400, total: 1400 }
    ]
  },
  {
    id: 'INV-2025-145',
    customerId: 6,
    customerName: 'Retail Giants Inc',
    amount: 15600,
    currency: 'USD',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    paidDate: '2025-12-20',
    status: 'paid',
    description: 'Monthly subscription - December 2025',
    items: [
      { description: 'Enterprise Plan', quantity: 1, unitPrice: 10000, total: 10000 },
      { description: 'Premium Support', quantity: 1, unitPrice: 5600, total: 5600 }
    ]
  },
  {
    id: 'INV-2025-146',
    customerId: 9,
    customerName: 'Finance First Corp',
    amount: 17800,
    currency: 'USD',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    paidDate: '2025-12-15',
    status: 'paid',
    description: 'Monthly subscription - December 2025',
    items: [
      { description: 'Enterprise Plan', quantity: 1, unitPrice: 10000, total: 10000 },
      { description: 'Security Package', quantity: 1, unitPrice: 5000, total: 5000 },
      { description: 'Additional Users (10)', quantity: 10, unitPrice: 280, total: 2800 }
    ]
  },
  {
    id: 'INV-2025-147',
    customerId: 7,
    customerName: 'Healthcare Plus',
    amount: 9800,
    currency: 'USD',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    paidDate: null,
    status: 'overdue',
    description: 'Monthly subscription - December 2025',
    items: [
      { description: 'Professional Plan', quantity: 1, unitPrice: 7500, total: 7500 },
      { description: 'Compliance Module', quantity: 1, unitPrice: 2300, total: 2300 }
    ]
  },
  {
    id: 'INV-2026-004',
    customerId: 5,
    customerName: 'Innovation Labs',
    amount: 6700,
    currency: 'USD',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    paidDate: '2026-01-05',
    status: 'paid',
    description: 'Monthly subscription - January 2026',
    items: [
      { description: 'Professional Plan', quantity: 1, unitPrice: 6700, total: 6700 }
    ]
  },
  {
    id: 'INV-2026-005',
    customerId: 1,
    customerName: 'Acme Corporation',
    amount: 5000,
    currency: 'USD',
    issueDate: '2025-12-15',
    dueDate: '2026-01-15',
    paidDate: '2025-12-20',
    status: 'paid',
    description: 'Custom development services',
    items: [
      { description: 'Custom Integration', quantity: 20, unitPrice: 250, total: 5000 }
    ]
  }
];

/**
 * Calculate revenue metrics
 */
export function calculateRevenueMetrics(invoices = mockInvoices) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter invoices for current month
  const currentMonthInvoices = invoices.filter(inv => {
    const issueDate = new Date(inv.issueDate);
    return issueDate.getMonth() === currentMonth &&
           issueDate.getFullYear() === currentYear;
  });

  // Filter for previous month
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const previousMonthInvoices = invoices.filter(inv => {
    const issueDate = new Date(inv.issueDate);
    return issueDate.getMonth() === previousMonth &&
           issueDate.getFullYear() === previousYear;
  });

  // Calculate totals
  const currentMonthRevenue = currentMonthInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const previousMonthRevenue = previousMonthInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalOutstanding = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Calculate growth
  const growth = previousMonthRevenue > 0
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  return {
    currentMonthRevenue,
    previousMonthRevenue,
    totalOutstanding,
    overdueAmount,
    growth,
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => inv.status === 'sent').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length
  };
}

/**
 * Get invoice by ID
 */
export function getInvoiceById(id) {
  return mockInvoices.find(invoice => invoice.id === id);
}

/**
 * Filter invoices by status
 */
export function filterInvoicesByStatus(status) {
  return mockInvoices.filter(invoice => invoice.status === status);
}

/**
 * Get revenue by month (for charts)
 */
export function getMonthlyRevenue() {
  const monthlyData = {};

  mockInvoices.forEach(invoice => {
    if (invoice.status === 'paid') {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += invoice.amount;
    }
  });

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}
