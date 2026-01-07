import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById } from '../data/mockInvoices';
import './InvoiceDetail.css';

/**
 * InvoiceDetail Component
 * Displays detailed information about a single invoice
 */
export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoice = getInvoiceById(id);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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

  if (!invoice) {
    return (
      <div className="invoice-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/invoices')}>
            ← Back to Invoices
          </button>
        </div>
        <div className="not-found">
          <div className="not-found-icon">📄</div>
          <h2>Invoice Not Found</h2>
          <p>The invoice you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/invoices')}>
          ← Back to Invoices
        </button>
      </div>

      <div className="invoice-document">
        <div className="invoice-header-section">
          <div className="invoice-title">
            <h1>Invoice</h1>
            <span className="invoice-number">{invoice.id}</span>
          </div>
          <span className={getStatusBadgeClass(invoice.status)}>
            {invoice.status}
          </span>
        </div>

        <div className="invoice-meta">
          <div className="meta-section">
            <h3>Bill To</h3>
            <p className="customer-name">{invoice.customerName}</p>
            <p className="customer-id">Customer ID: {invoice.customerId}</p>
          </div>
          <div className="meta-section">
            <h3>Invoice Details</h3>
            <div className="meta-item">
              <span className="meta-label">Issue Date:</span>
              <span className="meta-value">{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Due Date:</span>
              <span className="meta-value">{formatDate(invoice.dueDate)}</span>
            </div>
            {invoice.paidDate && (
              <div className="meta-item">
                <span className="meta-label">Paid Date:</span>
                <span className="meta-value paid">{formatDate(invoice.paidDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-description">
          <p>{invoice.description}</p>
        </div>

        <table className="line-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-center">Quantity</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="3" className="text-right">Total</td>
              <td className="text-right total-amount">{formatCurrency(invoice.amount)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="invoice-actions">
          <button className="action-btn primary">
            <span>📥</span> Download PDF
          </button>
          {invoice.status !== 'paid' && (
            <>
              <button className="action-btn secondary">
                <span>📧</span> Send Reminder
              </button>
              <button className="action-btn success">
                <span>✓</span> Mark as Paid
              </button>
            </>
          )}
          <button className="action-btn secondary">
            <span>✏️</span> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
