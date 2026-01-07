import React from 'react';
import { useRevenueMetrics } from '@hybrid-ui/shared';
import './RevenueDashboard.css';

/**
 * RevenueDashboard Component
 * Displays key revenue metrics and financial overview
 * Now uses shared API layer with loading/error states
 */
export function RevenueDashboard() {
  const { metrics, loading, error, refetch } = useRevenueMetrics();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="revenue-dashboard">
        <div className="dashboard-header">
          <h1>Revenue Dashboard</h1>
          <p className="subtitle">Track your financial performance and metrics</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">Loading metrics...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="revenue-dashboard">
        <div className="dashboard-header">
          <h1>Revenue Dashboard</h1>
          <p className="subtitle">Track your financial performance and metrics</p>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error loading metrics</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="revenue-dashboard">
        <div className="dashboard-header">
          <h1>Revenue Dashboard</h1>
          <p className="subtitle">Track your financial performance and metrics</p>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No metrics available</h3>
          <p>Revenue data is not available at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-dashboard">
      <div className="dashboard-header">
        <h1>Revenue Dashboard</h1>
        <p className="subtitle">Track your financial performance and metrics</p>
      </div>

      <div className="metrics-grid">
        {/* Current Month Revenue */}
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Current Month Revenue</h3>
            <div className="metric-value">{formatCurrency(metrics.currentMonthRevenue)}</div>
            <div className={`metric-change ${metrics.growth >= 0 ? 'positive' : 'negative'}`}>
              {metrics.growth >= 0 ? '📈' : '📉'} {formatPercentage(metrics.growth)} vs last month
            </div>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="metric-card warning">
          <div className="metric-icon">⏳</div>
          <div className="metric-content">
            <h3>Outstanding</h3>
            <div className="metric-value">{formatCurrency(metrics.totalOutstanding)}</div>
            <div className="metric-subtext">
              {metrics.pendingInvoices} pending invoice{metrics.pendingInvoices !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="metric-card danger">
          <div className="metric-icon">⚠️</div>
          <div className="metric-content">
            <h3>Overdue</h3>
            <div className="metric-value">{formatCurrency(metrics.overdueAmount)}</div>
            <div className="metric-subtext">
              {metrics.overdueInvoices} overdue invoice{metrics.overdueInvoices !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Previous Month */}
        <div className="metric-card secondary">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Previous Month</h3>
            <div className="metric-value">{formatCurrency(metrics.previousMonthRevenue)}</div>
            <div className="metric-subtext">Last month's revenue</div>
          </div>
        </div>
      </div>

      {/* Invoice Status Summary */}
      <div className="status-summary">
        <h2>Invoice Status Overview</h2>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-count">{metrics.totalInvoices}</div>
            <div className="status-label">Total Invoices</div>
          </div>
          <div className="status-item success">
            <div className="status-count">{metrics.paidInvoices}</div>
            <div className="status-label">Paid</div>
          </div>
          <div className="status-item warning">
            <div className="status-count">{metrics.pendingInvoices}</div>
            <div className="status-label">Pending</div>
          </div>
          <div className="status-item danger">
            <div className="status-count">{metrics.overdueInvoices}</div>
            <div className="status-label">Overdue</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-button">
            <span className="action-icon">➕</span>
            <span>Create Invoice</span>
          </button>
          <button className="action-button">
            <span className="action-icon">📧</span>
            <span>Send Reminders</span>
          </button>
          <button className="action-button">
            <span className="action-icon">📄</span>
            <span>Generate Report</span>
          </button>
          <button className="action-button">
            <span className="action-icon">📊</span>
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
