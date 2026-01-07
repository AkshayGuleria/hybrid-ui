/**
 * API Client Base Module
 * Provides simulated network delay and base utilities for API operations
 *
 * Currently uses mock data with realistic delays.
 * Later can be swapped to real backend by changing implementation.
 */

const SIMULATED_DELAY_MIN = 200;
const SIMULATED_DELAY_MAX = 500;

/**
 * Simulate network delay for realistic UX
 */
export async function simulateDelay() {
  const delay = Math.random() * (SIMULATED_DELAY_MAX - SIMULATED_DELAY_MIN) + SIMULATED_DELAY_MIN;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Create a successful API response
 */
export function successResponse(data) {
  return { data, error: null };
}

/**
 * Create an error API response
 */
export function errorResponse(message) {
  return { data: null, error: message };
}

/**
 * Simulate random errors for testing (disabled by default)
 */
let errorSimulationEnabled = false;
let errorProbability = 0.1;

export function enableErrorSimulation(probability = 0.1) {
  errorSimulationEnabled = true;
  errorProbability = probability;
}

export function disableErrorSimulation() {
  errorSimulationEnabled = false;
}

export function shouldSimulateError() {
  return errorSimulationEnabled && Math.random() < errorProbability;
}
