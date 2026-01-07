import { useState, useEffect, useCallback } from 'react';
import { invoicesApi } from '../api/invoices.js';

/**
 * Hook for fetching all invoices with loading/error states
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.getAll();
    if (result.error) {
      setError(result.error);
      setInvoices([]);
    } else {
      setInvoices(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filterByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.filterByStatus(status);
    if (result.error) {
      setError(result.error);
    } else {
      setInvoices(result.data);
    }
    setLoading(false);
  }, []);

  return {
    invoices,
    loading,
    error,
    refetch: fetchInvoices,
    filterByStatus
  };
}

/**
 * Hook for fetching a single invoice by ID
 */
export function useInvoice(id) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoice = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await invoicesApi.getById(id);
    if (result.error) {
      setError(result.error);
      setInvoice(null);
    } else {
      setInvoice(result.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const updateInvoice = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.update(id, updates);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    setInvoice(result.data);
    setLoading(false);
    return { success: true, data: result.data };
  }, [id]);

  const markAsPaid = useCallback(async (paidDate) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.markAsPaid(id, paidDate);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    setInvoice(result.data);
    setLoading(false);
    return { success: true, data: result.data };
  }, [id]);

  const deleteInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.delete(id);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return { success: false, error: result.error };
    }
    setInvoice(null);
    setLoading(false);
    return { success: true };
  }, [id]);

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice,
    updateInvoice,
    markAsPaid,
    deleteInvoice
  };
}

/**
 * Hook for revenue metrics
 */
export function useRevenueMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.getMetrics();
    if (result.error) {
      setError(result.error);
      setMetrics(null);
    } else {
      setMetrics(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
}

/**
 * Hook for monthly revenue data (for charts)
 */
export function useMonthlyRevenue() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMonthlyRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.getMonthlyRevenue();
    if (result.error) {
      setError(result.error);
      setMonthlyData([]);
    } else {
      setMonthlyData(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMonthlyRevenue();
  }, [fetchMonthlyRevenue]);

  return {
    monthlyData,
    loading,
    error,
    refetch: fetchMonthlyRevenue
  };
}

/**
 * Hook for invoice mutations (create, update, delete)
 */
export function useInvoiceMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createInvoice = useCallback(async (invoiceData) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.create(invoiceData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  const updateInvoice = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.update(id, updates);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  const markAsPaid = useCallback(async (id, paidDate) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.markAsPaid(id, paidDate);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }
    return { success: true, data: result.data };
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    const result = await invoicesApi.delete(id);
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
    createInvoice,
    updateInvoice,
    markAsPaid,
    deleteInvoice
  };
}
