import React, { useState, useEffect } from 'react';
import { getWhatsAppStats, getWhatsAppLogs, retryWhatsApp } from '../../services/api';
import './styling/Accounts.css';

const WhatsAppDelivery = () => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    pendingCount: 0,
    queuedCount: 0,
    processingCount: 0,
    sentCount: 0,
    failedCount: 0,
    retryingCount: 0,
    expiredCount: 0,
    successRate: 100,
    totalRetries: 0,
    lastDeliveryTime: null,
    worker: { status: 'INACTIVE', lastRunAt: null }
  });

  const [logs, setLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Retry state
  const [retryingId, setRetryingId] = useState(null);
  const [retryingAll, setRetryingAll] = useState(false);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await getWhatsAppStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      setError('');
      const res = await getWhatsAppLogs({
        page,
        limit,
        status: statusFilter,
        search
      });
      if (res.success) {
        setLogs(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
          setTotalItems(res.pagination.total || 0);
        }
      } else {
        setError(res.message || 'Failed to retrieve delivery logs.');
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp logs:', err);
      setError(err.message || 'Connection error loading logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
    setTimeout(() => {
      fetchLogs();
    }, 50);
  };

  const handleRetrySingle = async (queueId) => {
    setError('');
    setSuccessMsg('');
    setRetryingId(queueId);
    try {
      const res = await retryWhatsApp({ id: queueId });
      if (res.success) {
        setSuccessMsg(res.message);
        fetchStats();
        fetchLogs();
      } else {
        setError(res.message || 'Failed to trigger retry.');
      }
    } catch (err) {
      console.error('Retry error:', err);
      setError(err.message || 'Connection error.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!window.confirm('Are you sure you want to retry all failed/expired WhatsApp notifications?')) {
      return;
    }
    setError('');
    setSuccessMsg('');
    setRetryingAll(true);
    try {
      const res = await retryWhatsApp({ allFailed: true });
      if (res.success) {
        setSuccessMsg(res.message);
        fetchStats();
        fetchLogs();
      } else {
        setError(res.message || 'Failed to trigger bulk retry.');
      }
    } catch (err) {
      console.error('Bulk retry error:', err);
      setError(err.message || 'Connection error.');
    } finally {
      setRetryingAll(false);
    }
  };

  const getStatusBadge = (status) => {
    let style = { textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 };
    let className = 'accounts-badge';
    
    switch (status) {
      case 'SENT':
        className += ' accounts-badge--fee'; // Green
        break;
      case 'FAILED':
        className += ' accounts-badge--salary'; // Red
        break;
      case 'EXPIRED':
        style = { ...style, backgroundColor: 'var(--neutral-200)', color: 'var(--text-muted)' };
        break;
      case 'PROCESSING':
        style = { ...style, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d' };
        break;
      case 'RETRYING':
        style = { ...style, backgroundColor: '#ffedd5', color: '#ea580c', border: '1px solid #fed7aa' };
        break;
      default: // QUEUED or PENDING
        className += ' accounts-badge--email'; // Blue/Purple
        break;
    }

    return (
      <span className={className} style={style}>
        {status}
      </span>
    );
  };

  return (
    <div className="accounts-container">
      {stats.failedCount + stats.expiredCount > 0 && (
        <div className="accounts-list-header" style={{ justifyContent: 'flex-end', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleRetryAllFailed}
              className="accounts-btn accounts-btn--primary"
              style={{ backgroundColor: 'var(--danger-600)', borderColor: 'var(--danger-600)' }}
              disabled={retryingAll}
            >
              {retryingAll ? 'Retrying Failed...' : 'Retry All Failed'}
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, fontSize: '14px', border: '1px solid var(--success-200)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {successMsg}
        </div>
      )}

      {error && (
        <div className="login-card__error" role="alert" style={{ marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Stats row */}
      <section className="accounts-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-3 0a3 3 0 0 1-6 0"></path>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Total Messages</span>
            <span className="accounts-stat-card__value">{stats.totalMessages}</span>
          </div>
        </div>

        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Success Rate</span>
            <span className="accounts-stat-card__value">{stats.successRate}%</span>
          </div>
        </div>

        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon" style={{ backgroundColor: 'var(--danger-50)', color: 'var(--danger-600)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Failed / Expired</span>
            <span className="accounts-stat-card__value">{stats.failedCount + stats.expiredCount}</span>
          </div>
        </div>

        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Background Worker</span>
            <span className="accounts-stat-card__value" style={{ fontSize: '15px', color: stats.worker.status === 'ACTIVE' ? 'var(--success-600)' : 'var(--text-muted)' }}>
              {stats.worker.status === 'ACTIVE' ? '🟢 Active' : '🔴 Offline'}
            </span>
          </div>
        </div>
      </section>

      {/* Filters Form */}
      <section className="accounts-form-card" style={{ marginBottom: '24px', padding: '16px' }}>
        <form onSubmit={handleSearchSubmit} className="accounts-filters-grid">
          <div className="accounts-form-group">
            <input
              type="text"
              placeholder="Search recipient phone, student, parent, or receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="accounts-form-input"
            />
          </div>

          <div className="accounts-form-group">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="accounts-form-select"
            >
              <option value="">All Delivery Statuses</option>
              <option value="QUEUED">QUEUED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SENT">SENT</option>
              <option value="FAILED">FAILED</option>
              <option value="RETRYING">RETRYING</option>
              <option value="EXPIRED">EXPIRED</option>
            </select>
          </div>

          <div className="accounts-form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="submit" className="accounts-btn accounts-btn--primary" style={{ flex: 1, padding: '10px' }}>
              Filter
            </button>
            <button type="button" onClick={handleClearFilters} className="accounts-btn accounts-btn--secondary" style={{ flex: 1, padding: '10px' }}>
              Clear
            </button>
          </div>
        </form>
      </section>

      {/* Logs Table */}
      <div className="accounts-table-card">
        {loadingLogs ? (
          <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="login-card__spinner" style={{ width: '32px', height: '32px', borderLeftColor: 'var(--primary-500)' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading notification history...</p>
          </div>
        ) : (
          <>
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Student Name</th>
                  <th>Parent Mobile</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Date</th>
                  <th>Fail Reason / Details</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                        {log.receipt_no || `Ref #${log.reference_id}`}
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {log.student_name || 'N/A'}
                        {log.parent_name && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>Father: {log.parent_name}</span>}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{log.recipient}</td>
                      <td>{getStatusBadge(log.status)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{log.delivery_attempts || 0}</td>
                      <td>
                        {new Date(log.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ fontSize: '11px', color: log.error ? 'var(--danger-600)' : 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {log.error || 'Sent successfully.'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {(log.status === 'FAILED' || log.status === 'EXPIRED') && (
                          <button
                            onClick={() => handleRetrySingle(log.notification_queue_id)}
                            className="accounts-btn accounts-btn--secondary"
                            style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'var(--primary-200)', color: 'var(--primary-600)' }}
                            disabled={retryingId === log.notification_queue_id}
                          >
                            {retryingId === log.notification_queue_id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No delivery logs matched search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--neutral-200)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="accounts-btn accounts-btn--secondary"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="accounts-btn accounts-btn--secondary"
                    style={{ padding: '6px 12px' }}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
  );
};

export default WhatsAppDelivery;
