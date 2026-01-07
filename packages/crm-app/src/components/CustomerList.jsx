import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCustomers, searchCustomers } from '../data/mockCustomers';
import './CustomerList.css';

/**
 * CustomerList Component
 * Displays all customers with search and filter capabilities
 */
export function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      applyFilters('', statusFilter);
    } else {
      const results = searchCustomers(query);
      setCustomers(results);
    }
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    applyFilters(searchQuery, status);
  };

  const applyFilters = (search, status) => {
    let filtered = mockCustomers;

    // Apply search
    if (search.trim() !== '') {
      filtered = searchCustomers(search);
    }

    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(customer => customer.status === status);
    }

    setCustomers(filtered);
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
            All ({mockCustomers.length})
          </button>
          <button
            className={statusFilter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('active')}
          >
            Active ({mockCustomers.filter(c => c.status === 'active').length})
          </button>
          <button
            className={statusFilter === 'lead' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('lead')}
          >
            Leads ({mockCustomers.filter(c => c.status === 'lead').length})
          </button>
          <button
            className={statusFilter === 'inactive' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => handleStatusFilter('inactive')}
          >
            Inactive ({mockCustomers.filter(c => c.status === 'inactive').length})
          </button>
        </div>
      </div>

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
