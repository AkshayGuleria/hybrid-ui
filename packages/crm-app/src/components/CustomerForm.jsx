import React, { useState, useEffect } from 'react';
import './CustomerForm.css';

const defaultCustomer = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  company: '',
  status: 'lead',
  value: '',
  tags: [],
  notes: ''
};

/**
 * CustomerForm Component
 * Reusable form for creating and editing customers
 */
export function CustomerForm({ customer, onSubmit, onCancel, loading = false }) {
  const [formData, setFormData] = useState(defaultCustomer);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const isEditing = Boolean(customer?.id);

  useEffect(() => {
    if (customer) {
      setFormData({
        ...defaultCustomer,
        ...customer,
        value: customer.value?.toString() || ''
      });
    } else {
      setFormData(defaultCustomer);
    }
    setErrors({});
  }, [customer]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name is required (min 2 characters)';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.contactPerson || formData.contactPerson.trim().length < 2) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (formData.value && (isNaN(formData.value) || Number(formData.value) < 0)) {
      newErrors.value = 'Value must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        value: formData.value ? Number(formData.value) : 0,
        lastContact: formData.lastContact || new Date().toISOString().split('T')[0]
      };
      onSubmit(submitData);
    }
  };

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">Company Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter company name"
            className={errors.name ? 'error' : ''}
            disabled={loading}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contactPerson">Contact Person *</label>
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            placeholder="Enter contact name"
            className={errors.contactPerson ? 'error' : ''}
            disabled={loading}
          />
          {errors.contactPerson && <span className="error-text">{errors.contactPerson}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@company.com"
            className={errors.email ? 'error' : ''}
            disabled={loading}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company name"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status *</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="value">Account Value ($)</label>
          <input
            type="number"
            id="value"
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={errors.value ? 'error' : ''}
            disabled={loading}
          />
          {errors.value && <span className="error-text">{errors.value}</span>}
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input-container">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
              placeholder="Add a tag..."
              disabled={loading}
            />
            <button
              type="button"
              className="add-tag-btn"
              onClick={handleAddTag}
              disabled={loading || !tagInput.trim()}
            >
              Add
            </button>
          </div>
          <div className="tags-list">
            {formData.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={loading}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="form-group full-width">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes about this customer..."
          rows="3"
          disabled={loading}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}
