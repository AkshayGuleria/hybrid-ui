import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../api/customers.js';

/**
 * Hook for fetching all customers with loading/error states
 */
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
      setCustomers([]);
    } else {
      setCustomers(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const searchCustomers = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      return fetchCustomers();
    }
    setLoading(true);
    setError(null);
    const result = await customersApi.search(query);
    if (result.error) {
      setError(result.error);
    } else {
      setCustomers(result.data);
    }
    setLoading(false);
  }, [fetchCustomers]);

  const filterByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    const result = await customersApi.filterByStatus(status);
    if (result.error) {
      setError(result.error);
    } else {
      setCustomers(result.data);
    }
    setLoading(false);
  }, []);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    searchCustomers,
    filterByStatus
  };
}

/**
 * Hook for fetching a single customer by ID
 */
export function useCustomer(id) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomer = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await customersApi.getById(id);
    if (result.error) {
      setError(result.error);
      setCustomer(null);
    } else {
      setCustomer(result.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const updateCustomer = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    const result = await customersApi.update(id, updates);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    setCustomer(result.data);
    setLoading(false);
    return { success: true, data: result.data };
  }, [id]);

  const deleteCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await customersApi.delete(id);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    setCustomer(null);
    setLoading(false);
    return { success: true };
  }, [id]);

  return {
    customer,
    loading,
    error,
    refetch: fetchCustomer,
    updateCustomer,
    deleteCustomer
  };
}

/**
 * Hook for customer mutations (create, update, delete)
 */
export function useCustomerMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createCustomer = useCallback(async (customerData) => {
    setLoading(true);
    setError(null);
    const result = await customersApi.create(customerData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  const updateCustomer = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    const result = await customersApi.update(id, updates);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    const result = await customersApi.delete(id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true };
  }, []);

  return {
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}
