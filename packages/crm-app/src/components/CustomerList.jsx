import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '@hybrid-ui/shared';
import './CustomerList.css';

/**
 * CustomerList Component
 * Displays all customers with search and filter capabilities
 * Now uses shared API layer with loading/error states
 */
export function CustomerList() {
  const navigate = useNavigate();
  const { customers, loading, error, refetch, searchCustomers, filterByStatus } = useCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allCustomers, setAllCustomers] = useState([]);

  // Store all customers for count display
  useEffect(() => {
    if (customers.length > 0 && statusFilter === 'all' && searchQuery === '') {
      setAllCustomers(customers);
    }
  }, [customers, statusFilter, searchQuery]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setStatusFilter('all');
    await searchCustomers(query);
  };

  const handleStatusFilter = async (status) => {
    setStatusFilter(status);
    setSearchQuery('');
    await filterByStatus(status);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'lead':
        return 'status-badge status-lead';
      case 'inactive':
        return 'status-badge status-inactive';
      default:
        return 'status-badge';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading state
  if (loading && customers.length === 0) {
    return (
      <div className="customer-list">
        <div className="loading-state">
          <div className="loading-spinner">Loading customers...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="customer-list">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error loading customers</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  // Use allCustomers for counts, fallback to customers if not yet loaded
  const countSource = allCustomers.length > 0 ? allCustomers : customers;

  return (
    <div className="customer-list">
      <div className="list-header">
        <div className="header-content">
          <h1>Customers</h1>
          <p className="subtitle">Manage your customer relationships</p>
        </div>
      </div>

      <div className="list-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search customers by name, email, or contact..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={statusFilter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('all')}
          >
            All ({countSource.length})
          </button>
          <button
            className={statusFilter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('active')}
          >
            Active ({countSource.filter(c => c.status === 'active').length})
          </button>
          <button
            className={statusFilter === 'lead' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('lead')}
          >
            Leads ({countSource.filter(c => c.status === 'lead').length})
          </button>
          <button
            className={statusFilter === 'inactive' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('inactive')}
          >
            Inactive ({countSource.filter(c => c.status === 'inactive').length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <span>Loading...</span>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No customers found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="customers-grid">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="customer-card clickable"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <div className="card-header">
                <div className="customer-avatar">
                  {customer.name.charAt(0)}
                </div>
                <div className="customer-info">
                  <h3 className="customer-name">{customer.name}</h3>
                  <p className="contact-person">{customer.contactPerson}</p>
                </div>
                <span className={getStatusBadgeClass(customer.status)}>
                  {customer.status}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="info-icon">📧</span>
                  <span className="info-text">{customer.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📞</span>
                  <span className="info-text">{customer.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">💰</span>
                  <span className="info-text info-highlight">
                    {formatCurrency(customer.value)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📅</span>
                  <span className="info-text">
                    Last contact: {formatDate(customer.lastContact)}
                  </span>
                </div>
              </div>

              <div className="card-footer">
                <div className="customer-tags">
                  {customer.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {customer.notes && (
                <div className="card-notes">
                  <p className="notes-text">{customer.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
