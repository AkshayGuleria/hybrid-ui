import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer, useCustomerMutations } from '@hybrid-ui/shared';
import { Modal } from './Modal';
import { CustomerForm } from './CustomerForm';
import { ConfirmDialog } from './ConfirmDialog';
import { useToast } from './Toast';
import './CustomerDetail.css';

/**
 * CustomerDetail Component
 * Displays detailed information about a single customer
 * Includes Edit and Delete functionality
 */
export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { customer, loading, error, refetch } = useCustomer(id);
  const { updateCustomer, deleteCustomer, loading: mutationLoading } = useCustomerMutations();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
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

  const handleUpdateCustomer = async (customerData) => {
    const result = await updateCustomer(id, customerData);
    if (result.success) {
      toast.success('Customer updated successfully!');
      setShowEditModal(false);
      await refetch();
    } else {
      toast.error(result.error || 'Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    const result = await deleteCustomer(id);
    if (result.success) {
      toast.success('Customer deleted successfully!');
      navigate('/customers');
    } else {
      toast.error(result.error || 'Failed to delete customer');
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="customer-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/customers')}>
            ← Back to Customers
          </button>
        </div>
        <div className="loading-state">
          <div className="loading-spinner">Loading customer...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="customer-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/customers')}>
            ← Back to Customers
          </button>
        </div>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error loading customer</h3>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/customers')}>
            ← Back to Customers
          </button>
        </div>
        <div className="not-found">
          <div className="not-found-icon">🔍</div>
          <h2>Customer Not Found</h2>
          <p>The customer you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate('/customers')}>
          ← Back to Customers
        </button>
      </div>

      <div className="detail-content">
        <div className="profile-section">
          <div className="profile-avatar">
            {customer.name.charAt(0)}
          </div>
          <div className="profile-info">
            <h1 className="customer-name">{customer.name}</h1>
            <p className="contact-person">{customer.contactPerson}</p>
            <span className={getStatusBadgeClass(customer.status)}>
              {customer.status}
            </span>
          </div>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h3>Contact Information</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">
                  <a href={`mailto:${customer.email}`}>{customer.email}</a>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone</span>
                <span className="info-value">
                  <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Company</span>
                <span className="info-value">{customer.company}</span>
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3>Account Details</h3>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Account Value</span>
                <span className="info-value highlight">
                  {formatCurrency(customer.value)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Last Contact</span>
                <span className="info-value">{formatDate(customer.lastContact)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Customer ID</span>
                <span className="info-value">#{customer.id}</span>
              </div>
            </div>
          </div>

          <div className="detail-card full-width">
            <h3>Tags</h3>
            <div className="tags-container">
              {customer.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>

          {customer.notes && (
            <div className="detail-card full-width">
              <h3>Notes</h3>
              <p className="notes-text">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button className="action-btn primary">
            <span>📧</span> Send Email
          </button>
          <button className="action-btn secondary">
            <span>📞</span> Call
          </button>
          <button className="action-btn secondary" onClick={() => setShowEditModal(true)}>
            <span>✏️</span> Edit
          </button>
          <button className="action-btn danger" onClick={() => setShowDeleteConfirm(true)}>
            <span>🗑️</span> Delete
          </button>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
        size="medium"
      >
        <CustomerForm
          customer={customer}
          onSubmit={handleUpdateCustomer}
          onCancel={() => setShowEditModal(false)}
          loading={mutationLoading}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={mutationLoading}
      />
    </div>
  );
}
