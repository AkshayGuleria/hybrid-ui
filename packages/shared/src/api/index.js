/**
 * API Layer Index
 * Exports all API modules and utilities
 */

export { customersApi } from './customers.js';
export { invoicesApi } from './invoices.js';
export {
  simulateDelay,
  generateId,
  successResponse,
  errorResponse,
  enableErrorSimulation,
  disableErrorSimulation
} from './client.js';
