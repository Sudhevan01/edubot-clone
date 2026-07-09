import React, { useState, useEffect } from 'react';
import './AddGateGuardModal.css';
import { registerStaff, updateStaff } from '../../services/api';

const AddGateGuardModal = ({ isOpen, onClose, onAdd, editData = null }) => {
  const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
  const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;

  const [formData, setFormData] = useState({
    name: '',
    role: isVmsEnabled ? 'GATEGUARD' : 'ACCOUNTANT',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const showError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }, 2000);
  };

  const handleNameChange = (value) => {
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormData(prev => ({ ...prev, name: value }));
      setErrors(prev => ({ ...prev, name: '' }));
    } else {
      showError('name', 'Only letters are allowed');
    }
  };

  const isEdit = !!editData;

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        role: editData.role || (isVmsEnabled ? 'GATEGUARD' : 'ACCOUNTANT'),
        email: editData.email || '',
        password: '', // Don't prefill password
      });
    } else {
      setFormData({
        name: '',
        role: isVmsEnabled ? 'GATEGUARD' : 'ACCOUNTANT',
        email: '',
        password: '',
      });
    }
    setErrors({});
    setError('');
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      handleNameChange(value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name?.trim()) {
      newErrors.name = "Full Name is mandatory";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email Address is mandatory";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!isEdit && !formData.password) {
      newErrors.password = "Password is mandatory";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError('');
    try {
      let response;
      if (isEdit) {
        // For editing, only send password if it's filled
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        response = await updateStaff(editData.id, updateData);
      } else {
        response = await registerStaff(formData);
      }

      if (response.success) {
        // If updating the currently logged-in user, sync localStorage
        const currentUser = JSON.parse(localStorage.getItem('vms_user') || '{}');
        if (isEdit && editData.id === currentUser.id) {
          const updatedUser = { ...currentUser, ...formData };
          if (updatedUser.password) delete updatedUser.password;
          localStorage.setItem('vms_user', JSON.stringify(updatedUser));
          // Notify Header and other components
          window.dispatchEvent(new Event('userProfileUpdated'));
        }

        onAdd(isEdit); // Refresh the list
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <h2>{isEdit ? 'Edit Staff Details' : 'Add New Staff'}</h2>
            <p>{isEdit ? 'Update the information for this staff member.' : 'Register a new security personnel or system administrator.'}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gateguard-form" noValidate>
          {error && <div className="error-message" style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-error' : ''}
                />
              </div>
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label>Role</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <select name="role" value={formData.role} onChange={handleChange}>
                  {isVmsEnabled && <option value="GATEGUARD">Gate Guard</option>}
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  {isVmsEnabled && <option value="OPERATOR">Operator</option>}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <input
                  type="email"
                  name="email"
                  placeholder="email@stedwards.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-error' : ''}
                />
              </div>
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input
                  type="password"
                  name="password"
                  placeholder={isEdit ? "Leave blank to keep current" : "Set password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-error' : ''}
                />
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (isEdit ? 'Updating...' : 'Registering...') : (isEdit ? 'Update Staff' : 'Register Staff')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGateGuardModal;
