/**
 * Customer API Module
 * Provides CRUD operations for customer data
 *
 * Currently uses mock data with simulated delays.
 * Later can be swapped to real backend.
 */

import { mockCustomers } from './data/customers.js';
import {
  simulateDelay,
  generateId,
  successResponse,
  errorResponse,
  shouldSimulateError
} from './client.js';

// Mutable local store (simulates backend database)
let customers = [...mockCustomers];

export const customersApi = {
  /**
   * Get all customers
   */
  async getAll() {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to fetch customers');
    }

    return successResponse([...customers]);
  },

  /**
   * Get customer by ID
   */
  async getById(id) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to fetch customer');
    }

    const customer = customers.find(c => c.id === Number(id) || c.id === id);
    if (!customer) {
      return errorResponse('Customer not found');
    }

    return successResponse({ ...customer });
  },

  /**
   * Search customers by query
   */
  async search(query) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Search failed');
    }

    const lowerQuery = query.toLowerCase();
    const results = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(lowerQuery) ||
        customer.email.toLowerCase().includes(lowerQuery) ||
        customer.contactPerson.toLowerCase().includes(lowerQuery)
    );

    return successResponse(results);
  },

  /**
   * Filter customers by status
   */
  async filterByStatus(status) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Filter failed');
    }

    if (status === 'all') {
      return successResponse([...customers]);
    }

    const results = customers.filter(c => c.status === status);
    return successResponse(results);
  },

  /**
   * Create a new customer
   */
  async create(customerData) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to create customer');
    }

    const newCustomer = {
      ...customerData,
      id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
      lastContact: new Date().toISOString().split('T')[0]
    };

    customers.push(newCustomer);
    return successResponse({ ...newCustomer });
  },

  /**
   * Update an existing customer
   */
  async update(id, updates) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to update customer');
    }

    const index = customers.findIndex(c => c.id === Number(id) || c.id === id);
    if (index === -1) {
      return errorResponse('Customer not found');
    }

    customers[index] = { ...customers[index], ...updates };
    return successResponse({ ...customers[index] });
  },

  /**
   * Delete a customer
   */
  async delete(id) {
    await simulateDelay();

    if (shouldSimulateError()) {
      return errorResponse('Failed to delete customer');
    }

    const index = customers.findIndex(c => c.id === Number(id) || c.id === id);
    if (index === -1) {
      return errorResponse('Customer not found');
    }

    customers = customers.filter(c => c.id !== Number(id) && c.id !== id);
    return successResponse(null);
  },

  /**
   * Reset to initial mock data (for testing)
   */
  reset() {
    customers = [...mockCustomers];
  }
};
