import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTemplates, getTemplateById, activateTemplate, cloneTemplate, deleteTemplate, restoreTemplate, deleteTemplatePermanently } from '../../services/api';
import './styling/Accounts.css';
import * as XLSX from 'xlsx';

const TemplatesList = () => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = false;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTemplates(showArchived);
      if (res.success && res.data) {
        setTemplates(res.data);
      } else {
        setError(res.message || 'Failed to fetch templates.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/accounts/templates') {
        setShowArchived(false);
        setError('');
        setSuccess('');
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);

  const handleDownloadExcelTemplate = async (templateSummary) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await getTemplateById(templateSummary.id);
      if (!res.success || !res.data) {
        alert("Failed to fetch full template details.");
        return;
      }

      const template = res.data;
      if (!template || !template.fields) {
        alert("Template fields are not configured properly.");
        return;
      }

      const activeFields = template.fields.filter(f => f.is_active === 1);
      const data = [];
      const filename = `${template.template_name.replace(/\s+/g, '_')}_Import_Template.xlsx`;

      if (template.template_type === 'fee') {
        const headers = {
          'Student Name': 'John Doe',
          'Parent Name': 'Jane Doe',
          'Class': 'Grade 8',
          'Academic Year': '2026-27',
          'Date': new Date().toISOString().split('T')[0],
          'Payment Mode': 'UPI',
          'Payment Reference': 'TXN123456789',
          'Remarks': 'Term 1 fees'
        };

        activeFields.forEach(f => {
          headers[f.field_label] = f.field_type === 'currency' ? 1000 : 'Sample Text';
        });

        data.push(headers);
      } else {
        const headers = {
          'Employee Name': 'John Doe',
          'Employee ID': 'EMP1001',
          'Designation': 'Teacher',
          'Employee Email': 'john.doe@example.com',
          'Month': 'June 2026',
          'Remarks': 'Regular payroll',
          'Bank Name': 'State Bank of India',
          'Branch Name': 'Koramangala',
          'Account Number': '123456789012',
          'Payment Mode': 'Bank Transfer',
          'Payment Reference': 'TXN123456789'
        };

        activeFields.forEach(f => {
          headers[f.field_label] = f.field_type === 'currency' ? 50000 : 'Sample Text';
        });

        data.push(headers);
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Failed to generate template:', err);
      alert('Error generating template: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };



  const handleActivate = async (id) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await activateTemplate(id);
      if (res.success) {
        setSuccess('Template activated successfully.');
        await fetchTemplates();
      } else {
        setError(res.message || 'Failed to activate template.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error activating template.');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (id) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await cloneTemplate(id);
      if (res.success) {
        setSuccess('Template cloned successfully.');
        await fetchTemplates();
      } else {
        setError(res.message || 'Failed to clone template.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error cloning template.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template? It will be moved to the Archived templates section.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await deleteTemplate(id);
      if (res.success) {
        setSuccess('Template deleted successfully (moved to archive).');
        await fetchTemplates();
      } else {
        setError(res.message || 'Failed to delete template.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting template.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await restoreTemplate(id);
      if (res.success) {
        setSuccess('Template restored successfully.');
        await fetchTemplates();
      } else {
        setError(res.message || 'Failed to restore template.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error restoring template.');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await deleteTemplatePermanently(id);
      if (res.success) {
        setSuccess('Template permanently deleted.');
        await fetchTemplates();
      } else {
        setError(res.message || 'Failed to delete template permanently.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting template permanently.');
    } finally {
      setLoading(false);
    }
  };

  const feeTemplates = templates.filter(t => t.template_type === 'fee');
  const salaryTemplates = templates.filter(t => t.template_type === 'salary');

  return (
    <div className="accounts-container">

      {error && <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>{error}</div>}
      {success && (
        <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--success-200)', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="templates-tabs">
        <button
          className={`templates-tab-btn ${!showArchived ? 'templates-tab-btn--active' : ''}`}
          onClick={() => {
            setError('');
            setSuccess('');
            setShowArchived(false);
          }}
        >
          Active Templates
        </button>
        <button
          className={`templates-tab-btn ${showArchived ? 'templates-tab-btn--active' : ''}`}
          onClick={() => {
            setError('');
            setSuccess('');
            setShowArchived(true);
          }}
        >
          Archived Templates
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading templates configuration...</div>}

      {!loading && (
        <div className="accounts-sections">
          {/* Fee Receipt Templates */}
          <div>
            <div className="accounts-list-header">
              <h2 className="accounts-section__title" style={{ margin: 0 }}>
                Fee Receipt Templates
                <span className="accounts-badge accounts-badge--fee">
                  {feeTemplates.length} {showArchived ? 'Archived' : 'Available'}
                </span>
              </h2>
              {!isSuperAdmin && !showArchived && (
                <Link to="/admin/accounts/templates/new?type=fee" className="accounts-btn accounts-btn--primary">
                  + Create Fee Template
                </Link>
              )}
            </div>
            
            <div className="accounts-table-card" style={{ marginTop: '16px' }}>
              {feeTemplates.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {showArchived ? 'No archived fee templates found.' : 'No fee templates configured yet.'}
                </div>
              ) : (
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Version</th>
                      <th>Color Theme</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeTemplates.map(t => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.template_name}</strong>
                        </td>
                        <td>v{t.version}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: t.primary_color || '#000', border: '1px solid var(--neutral-300)' }}></div>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: t.secondary_color || '#000', border: '1px solid var(--neutral-300)' }}></div>
                          </div>
                        </td>
                        <td>
                          {showArchived ? (
                            <span style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Archived
                            </span>
                          ) : t.is_active ? (
                            <span style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Active Default
                            </span>
                          ) : (
                            <span style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {showArchived ? (
                              <>
                                <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  View Builder
                                </Link>
                                {!isSuperAdmin && (
                                  <>
                                    <button onClick={() => handleRestore(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success-700)' }}>
                                      Restore
                                    </button>
                                    <button onClick={() => handlePermanentDelete(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger-600)' }}>
                                      Delete Permanently
                                    </button>
                                  </>
                                )}
                              </>
                            ) : isSuperAdmin ? (
                              <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                View Builder
                              </Link>
                            ) : (
                              <>
                                {!t.is_active && (
                                  <button onClick={() => handleActivate(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                    Activate
                                  </button>
                                )}
                                <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Edit Builder
                                </Link>
                                <button onClick={() => handleClone(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Duplicate
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger-600)' }}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Salary Slip Templates */}
          <div style={{ marginTop: '24px' }}>
            <div className="accounts-list-header">
              <h2 className="accounts-section__title" style={{ margin: 0 }}>
                Salary Slip Templates
                <span className="accounts-badge accounts-badge--salary">
                  {salaryTemplates.length} {showArchived ? 'Archived' : 'Available'}
                </span>
              </h2>
              {!isSuperAdmin && !showArchived && (
                <Link to="/admin/accounts/templates/new?type=salary" className="accounts-btn accounts-btn--primary" style={{ backgroundColor: '#f97316' }}>
                  + Create Salary Template
                </Link>
              )}
            </div>
            
            <div className="accounts-table-card" style={{ marginTop: '16px' }}>
              {salaryTemplates.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {showArchived ? 'No archived salary templates found.' : 'No salary templates configured yet.'}
                </div>
              ) : (
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Version</th>
                      <th>Color Theme</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryTemplates.map(t => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.template_name}</strong>
                        </td>
                        <td>v{t.version}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: t.primary_color || '#000', border: '1px solid var(--neutral-300)' }}></div>
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: t.secondary_color || '#000', border: '1px solid var(--neutral-300)' }}></div>
                          </div>
                        </td>
                        <td>
                          {showArchived ? (
                            <span style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Archived
                            </span>
                          ) : t.is_active ? (
                            <span style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                              Active Default
                            </span>
                          ) : (
                            <span style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {showArchived ? (
                              <>
                                <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  View Builder
                                </Link>
                                {!isSuperAdmin && (
                                  <>
                                    <button onClick={() => handleRestore(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--success-700)' }}>
                                      Restore
                                    </button>
                                    <button onClick={() => handlePermanentDelete(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger-600)' }}>
                                      Delete Permanently
                                    </button>
                                  </>
                                )}
                              </>
                            ) : isSuperAdmin ? (
                              <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                View Builder
                              </Link>
                            ) : (
                              <>
                                {!t.is_active && (
                                  <button onClick={() => handleActivate(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                    Activate
                                  </button>
                                )}
                                <button onClick={() => handleDownloadExcelTemplate(t)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary-600)' }}>
                                  Excel Template
                                </button>
                                <Link to={`/admin/accounts/templates/${t.id}`} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Edit Builder
                                </Link>
                                <button onClick={() => handleClone(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                  Duplicate
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger-600)' }}>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesList;
