import React, { useState } from 'react';
import { mockInvoices } from '../data/mockInvoices';
import './InvoiceList.css';

/**
 * InvoiceList Component
 * Displays all invoices with filtering and status
 */
export function InvoiceList() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [statusFilter, setStatusFilter] = useState('all');

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    if (status === 'all') {
      setInvoices(mockInvoices);
    } else {
      setInvoices(mockInvoices.filter(inv => inv.status === status));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge status-paid';
      case 'sent':
        return 'status-badge status-sent';
      case 'overdue':
        return 'status-badge status-overdue';
      case 'draft':
        return 'status-badge status-draft';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (invoice) => {
    if (invoice.status === 'paid' || !invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  };

  return (
    <div className="invoice-list">
      <div className="list-header">
        <div className="header-content">
          <h1>Invoices</h1>
          <p className="subtitle">Manage and track all your invoices</p>
        </div>
        <button className="create-button">
          <span>➕</span> Create Invoice
        </button>
      </div>

      <div className="list-controls">
        <div className="filter-buttons">
          <button
            className={statusFilter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('all')}
          >
            All ({mockInvoices.length})
          </button>
          <button
            className={statusFilter === 'paid' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('paid')}
          >
            Paid ({mockInvoices.filter(i => i.status === 'paid').length})
          </button>
          <button
            className={statusFilter === 'sent' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('sent')}
          >
            Pending ({mockInvoices.filter(i => i.status === 'sent').length})
          </button>
          <button
            className={statusFilter === 'overdue' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('overdue')}
          >
            Overdue ({mockInvoices.filter(i => i.status === 'overdue').length})
          </button>
        </div>
      </div>

      <div className="invoices-table-container">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Paid Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className={isOverdue(invoice) ? 'overdue-row' : ''}>
                <td className="invoice-id">{invoice.id}</td>
                <td className="customer-name">{invoice.customerName}</td>
                <td className="amount">{formatCurrency(invoice.amount)}</td>
                <td>{formatDate(invoice.issueDate)}</td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>{formatDate(invoice.paidDate)}</td>
                <td>
                  <span className={getStatusBadgeClass(invoice.status)}>
                    {invoice.status}
                  </span>
                </td>
                <td className="actions">
                  <button className="action-btn view" title="View Invoice">
                    👁️
                  </button>
                  <button className="action-btn download" title="Download PDF">
                    📥
                  </button>
                  {invoice.status !== 'paid' && (
                    <button className="action-btn send" title="Send Reminder">
                      📧
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No invoices found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
