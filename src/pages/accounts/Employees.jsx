import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getAccountsEmployees, 
  createAccountsEmployee, 
  updateAccountsEmployee, 
  deleteAccountsEmployee 
} from '../../services/api';
import './styling/Accounts.css';

const Employees = ({ onBack }) => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');

  // Route protection redirect
  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ACCOUNTANT') {
    return <Navigate to="/admin/accounts/dashboard" replace />;
  }

  // Employee Directory States
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [employeeTotalItems, setEmployeeTotalItems] = useState(0);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [employeeForm, setEmployeeForm] = useState({
    employee_name: '',
    employee_id: '',
    department: '',
    designation: '',
    email_address: ''
  });

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const res = await getAccountsEmployees({
        search: employeeSearch,
        page: employeePage,
        limit: 10
      });
      if (res.success) {
        setEmployees(res.data);
        if (res.pagination) {
          setEmployeeTotalPages(res.pagination.pages || 1);
          setEmployeeTotalItems(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load employees.');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [employeePage]);

  // Clean up success alerts after a delay
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleEmployeeSearchSubmit = (e) => {
    e.preventDefault();
    setEmployeePage(1);
    fetchEmployees();
  };

  const handleOpenEmployeeModal = (emp = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmployeeForm({
        employee_name: emp.employee_name || '',
        employee_id: emp.employee_id || '',
        department: emp.department || '',
        designation: emp.designation || '',
        email_address: emp.email_address || ''
      });
    } else {
      setEditingEmployee(null);
      setEmployeeForm({
        employee_name: '',
        employee_id: '',
        department: '',
        designation: '',
        email_address: ''
      });
    }
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!employeeForm.employee_name.trim()) {
      alert("Employee Name is required.");
      return;
    }
    if (!employeeForm.employee_id.trim()) {
      alert("Employee ID is required.");
      return;
    }
    if (!employeeForm.email_address.trim() || !/\S+@\S+\.\S+/.test(employeeForm.email_address)) {
      alert("A valid Email Address is required.");
      return;
    }

    try {
      let res;
      if (editingEmployee) {
        res = await updateAccountsEmployee(editingEmployee.id, employeeForm);
      } else {
        res = await createAccountsEmployee(employeeForm);
      }
      if (res.success) {
        setSuccessMsg(res.message || 'Employee record saved successfully.');
        setShowEmployeeModal(false);
        fetchEmployees();
      } else {
        setError(res.message || 'Failed to save employee.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error saving employee record.');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await deleteAccountsEmployee(id);
      if (res.success) {
        setSuccessMsg(res.message || 'Employee deleted successfully.');
        fetchEmployees();
      } else {
        setError(res.message || 'Failed to delete employee.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting employee.');
    }
  };

  return (
    <div className="accounts-container">
      {error && <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>{error}</div>}
      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--success-200)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="accounts-form-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="accounts-btn accounts-btn--secondary"
                  style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Back to Menu"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              className="accounts-btn accounts-btn--primary"
              onClick={() => handleOpenEmployeeModal()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Employee
            </button>
          </div>

          {/* Search filter */}
          <form onSubmit={handleEmployeeSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '20px', maxWidth: '450px' }}>
            <input
              type="text"
              placeholder="Search name, ID, email, dept..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="accounts-form-input"
              style={{ flex: 1 }}
            />
            <button type="submit" className="accounts-btn accounts-btn--primary" style={{ padding: '8px 16px' }}>
              Search
            </button>
            <button 
              type="button" 
              onClick={() => { setEmployeeSearch(''); setEmployeePage(1); setTimeout(() => fetchEmployees(), 50); }} 
              className="accounts-btn accounts-btn--secondary"
              style={{ padding: '8px 12px' }}
            >
              Reset
            </button>
          </form>

          <div className="accounts-table-card">
            {employeesLoading ? (
              <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="login-card__spinner" style={{ width: '32px', height: '32px', borderLeftColor: 'var(--primary-500)' }}></div>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading employees...</p>
              </div>
            ) : (
              <>
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Email Address</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{emp.employee_id}</td>
                          <td style={{ fontWeight: 500 }}>{emp.employee_name}</td>
                          <td>{emp.email_address}</td>
                          <td>{emp.department || '-'}</td>
                          <td>{emp.designation || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEmployeeModal(emp)}
                                className="accounts-btn accounts-btn--secondary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="accounts-btn accounts-btn--secondary"
                                style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          No employee records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {employeeTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--neutral-200)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Showing {(employeePage - 1) * 10 + 1} to {Math.min(employeePage * 10, employeeTotalItems)} of {employeeTotalItems} entries
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="accounts-btn accounts-btn--secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setEmployeePage(p => Math.max(1, p - 1))}
                        disabled={employeePage === 1}
                      >
                        Prev
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
                        Page {employeePage} of {employeeTotalPages}
                      </span>
                      <button
                        className="accounts-btn accounts-btn--secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => setEmployeePage(p => Math.min(employeeTotalPages, p + 1))}
                        disabled={employeePage === employeeTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showEmployeeModal && (
        <div className="delivery-log-drawer-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <form onSubmit={handleSaveEmployee} className="accounts-form-card" style={{ maxWidth: '500px', width: '90%', padding: '24px', position: 'relative', boxShadow: 'var(--shadow-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>
                {editingEmployee ? 'Edit Employee Details' : 'Add New Employee'}
              </h3>
              <button 
                type="button"
                className="close-btn" 
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-secondary)' }} 
                onClick={() => setShowEmployeeModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Employee ID *</label>
                <input
                  type="text"
                  value={employeeForm.employee_id}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employee_id: e.target.value })}
                  placeholder="e.g. EMP1001"
                  required
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Employee Name *</label>
                <input
                  type="text"
                  value={employeeForm.employee_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employee_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Email Address *</label>
                <input
                  type="email"
                  value={employeeForm.email_address}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email_address: e.target.value })}
                  placeholder="e.g. john.doe@school.edu"
                  required
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Department</label>
                <input
                  type="text"
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                  placeholder="e.g. Science, Accounts, Admin"
                  className="accounts-form-input"
                />
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Designation</label>
                <input
                  type="text"
                  value={employeeForm.designation}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, designation: e.target.value })}
                  placeholder="e.g. Teacher, Senior Accountant"
                  className="accounts-form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px', marginTop: '16px' }}>
              <button
                type="button"
                className="accounts-btn accounts-btn--secondary"
                onClick={() => setShowEmployeeModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="accounts-btn accounts-btn--primary"
              >
                {editingEmployee ? 'Update Details' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Employees;
