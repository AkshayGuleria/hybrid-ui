/**
 * Invoice API Module
 * Provides CRUD operations for invoice data
 *
 * Currently uses mock data with simulated delays.
 * Later can be swapped to real backend.
 */

import { mockInvoices } from './data/invoices.js';
import {
  simulateDelay,
  generateId,
  successResponse,
  errorResponse,
  shouldSimulateError
} from './client.js';

// Mutable local store (simulates backend database)
let invoices = [...mockInvoices];

export const invoicesApi = {
  /**
   * Get all invoices
   */
  async getAll() {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to fetch invoices');
    }

    return successResponse([...invoices]);
  },

  /**
   * Get invoice by ID
   */
  async getById(id) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to fetch invoice');
    }

    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) {
      return errorResponse('Invoice not found');
    }

    return successResponse({ ...invoice });
  },

  /**
   * Filter invoices by status
   */
  async filterByStatus(status) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Filter failed');
    }

    if (status === 'all') {
      return successResponse([...invoices]);
    }

    const results = invoices.filter(inv => inv.status === status);
    return successResponse(results);
  },

  /**
   * Get invoices by customer ID
   */
  async getByCustomerId(customerId) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to fetch customer invoices');
    }

    const results = invoices.filter(inv => inv.customerId === Number(customerId));
    return successResponse(results);
  },

  /**
   * Create a new invoice
   */
  async create(invoiceData) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to create invoice');
    }

    const year = new Date().getFullYear();
    const count = invoices.filter(inv => inv.id.startsWith(`INV-${year}`)).length + 1;
    const newId = `INV-${year}-${String(count).padStart(3, '0')}`;

    const newInvoice = {
      ...invoiceData,
      id: newId,
      issueDate: invoiceData.issueDate || new Date().toISOString().split('T')[0],
      status: invoiceData.status || 'draft'
    };

    invoices.push(newInvoice);
    return successResponse({ ...newInvoice });
  },

  /**
   * Update an existing invoice
   */
  async update(id, updates) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to update invoice');
    }

    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) {
      return errorResponse('Invoice not found');
    }

    invoices[index] = { ...invoices[index], ...updates };
    return successResponse({ ...invoices[index] });
  },

  /**
   * Mark invoice as paid
   */
  async markAsPaid(id, paidDate = new Date().toISOString().split('T')[0]) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to mark invoice as paid');
    }

    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) {
      return errorResponse('Invoice not found');
    }

    invoices[index] = {
      ...invoices[index],
      status: 'paid',
      paidDate
    };
    return successResponse({ ...invoices[index] });
  },

  /**
   * Delete an invoice
   */
  async delete(id) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to delete invoice');
    }

    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) {
      return errorResponse('Invoice not found');
    }

    invoices = invoices.filter(inv => inv.id !== id);
    return successResponse(null);
  },

  /**
   * Calculate revenue metrics
   */
  async getMetrics() {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to calculate metrics');
    }

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

    return successResponse({
      currentMonthRevenue,
      previousMonthRevenue,
      totalOutstanding,
      overdueAmount,
      growth,
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
      pendingInvoices: invoices.filter(inv => inv.status === 'sent').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length
    });
  },

  /**
   * Get monthly revenue data (for charts)
   */
  async getMonthlyRevenue() {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to get monthly revenue');
    }

    const monthlyData = {};

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const date = new Date(invoice.issueDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        monthlyData[monthKey] += invoice.amount;
      }
    });

    const result = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));

    return successResponse(result);
  },

  /**
   * Reset to initial mock data (for testing)
   */
  reset() {
    invoices = [...mockInvoices];
  }
};
