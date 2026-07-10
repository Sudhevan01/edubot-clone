import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Clock, 
  Activity, 
  TrendingUp, 
  SlidersHorizontal,
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Pause,
  Play
} from 'lucide-react';
import { getEmailStats, getEmailLogs, retryEmails, pauseEmailQueue, resumeEmailQueue } from '../../services/api';
import './styling/Accounts.css';

const EmailDashboard = ({ onBack }) => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Logs filters & pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLogs, setSelectedLogs] = useState([]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getEmailStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await getEmailLogs({
        page,
        limit: 10,
        status: statusFilter,
        month: monthFilter,
        search: searchQuery
      });
      if (res.success) {
        setLogs(res.data);
        setTotalPages(res.pagination.pages);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('Failed to fetch delivery audit logs.');
    } finally {
      setLogsLoading(false);
    }
  }, [page, statusFilter, monthFilter, searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    await Promise.all([fetchStats(), fetchLogs()]);
    setLoading(false);
  }, [fetchStats, fetchLogs]);

  useEffect(() => {
    loadData();
  }, [page, statusFilter, monthFilter]);

  // Handle manual trigger to refresh
  const handleRefresh = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    await Promise.all([fetchStats(), fetchLogs()]);
    setLoading(false);
  };

  const handlePauseQueue = async () => {
    if (!window.confirm('Are you sure you want to pause the salary email delivery queue? No queued emails will be processed while paused.')) {
      return;
    }
    try {
      setLogsLoading(true);
      setError('');
      setSuccess('');
      const res = await pauseEmailQueue();
      if (res.success) {
        setSuccess(res.message);
        await Promise.all([fetchStats(), fetchLogs()]);
      } else {
        setError(res.message || 'Failed to pause email queue.');
      }
    } catch (err) {
      setError(err.message || 'Error pausing email queue.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleResumeQueue = async () => {
    try {
      setLogsLoading(true);
      setError('');
      setSuccess('');
      const res = await resumeEmailQueue();
      if (res.success) {
        setSuccess(res.message);
        await Promise.all([fetchStats(), fetchLogs()]);
      } else {
        setError(res.message || 'Failed to resume email queue.');
      }
    } catch (err) {
      setError(err.message || 'Error resuming email queue.');
    } finally {
      setLogsLoading(false);
    }
  };

  // Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  // Retry handlers
  const handleRetrySingle = async (receiptId) => {
    try {
      setLogsLoading(true);
      setError('');
      setSuccess('');
      const res = await retryEmails({ id: receiptId });
      if (res.success) {
        setSuccess(res.message);
        await Promise.all([fetchStats(), fetchLogs()]);
      } else {
        setError(res.message || 'Retry request failed.');
      }
    } catch (err) {
      setError(err.message || 'Error enqueuing retry job.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetrySelected = async () => {
    if (selectedLogs.length === 0) return;
    try {
      setLogsLoading(true);
      setError('');
      setSuccess('');
      const res = await retryEmails({ ids: selectedLogs });
      if (res.success) {
        setSuccess(res.message);
        setSelectedLogs([]);
        await Promise.all([fetchStats(), fetchLogs()]);
      } else {
        setError(res.message || 'Selected retry request failed.');
      }
    } catch (err) {
      setError(err.message || 'Error enqueuing retry jobs.');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!window.confirm('Are you sure you want to retry all failed email logs for the current organization?')) {
      return;
    }
    try {
      setLogsLoading(true);
      setError('');
      setSuccess('');
      const res = await retryEmails({ allFailed: true });
      if (res.success) {
        setSuccess(res.message);
        await Promise.all([fetchStats(), fetchLogs()]);
      } else {
        setError(res.message || 'Retry all request failed.');
      }
    } catch (err) {
      setError(err.message || 'Error enqueuing retry jobs.');
    } finally {
      setLogsLoading(false);
    }
  };

  const toggleSelectLog = (receiptId) => {
    setSelectedLogs(prev => 
      prev.includes(receiptId) ? prev.filter(id => id !== receiptId) : [...prev, receiptId]
    );
  };

  const toggleSelectAll = () => {
    const retryableLogs = logs.filter(l => l.status === 'FAILED');
    if (selectedLogs.length === retryableLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(retryableLogs.map(l => l.salary_receipt_id));
    }
  };

  // Helper values
  const totalSent = stats ? stats.sentCount : 0;
  const totalFailed = stats ? stats.failedCount : 0;
  const successRate = totalSent + totalFailed > 0 
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100) 
    : 100;

  return (
    <div className="accounts-container">
      {error && <div className="login-card__error" role="alert" style={{ margin: '16px 0 0 0' }}>{error}</div>}
      {success && (
        <div style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--success-200)', marginTop: '16px', fontSize: '14px', fontWeight: 600 }}>
          {success}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading delivery statistics...</div>
      ) : (
        <>
          {/* System status alert bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px', 
            padding: '16px 20px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--neutral-200)', 
            borderRadius: '16px', 
            marginTop: '16px',
            boxShadow: 'var(--shadow-sm)',
            width: '100%'
          }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Daemon Status:</span>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontWeight: 700, 
                  color: stats?.worker.status === 'ACTIVE' ? 'var(--success-600)' : 'var(--danger-600)' 
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: stats?.worker.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                    display: 'inline-block'
                  }}></span>
                  {stats?.worker.status}
                </span>
                {stats?.worker.lastRunAt && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    (Heartbeat: {dayjs(stats.worker.lastRunAt).format('HH:mm:ss')})
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Queue State:</span>
                {stats?.queuePaused ? (
                  <span style={{ backgroundColor: 'var(--danger-50)', color: 'var(--danger-700)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    PAUSED
                  </span>
                ) : (
                  <span style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                    ACTIVE / RUNNING
                  </span>
                )}
                {stats?.queuePaused ? (
                  <button 
                    onClick={handleResumeQueue} 
                    className="accounts-btn" 
                    style={{ padding: '4px 10px', gap: '4px', backgroundColor: 'var(--success-500)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginLeft: '8px' }}
                  >
                    <Play size={11} /> Resume Queue
                  </button>
                ) : (
                  <button 
                    onClick={handlePauseQueue} 
                    className="accounts-btn" 
                    style={{ padding: '4px 10px', gap: '4px', backgroundColor: 'var(--danger-500)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginLeft: '8px' }}
                  >
                    <Pause size={11} /> Pause Queue
                  </button>
                )}
              </div>
            </div>

            {/* Quota Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', flexGrow: 1, maxWidth: '400px', fontSize: '12px' }}>
              <strong style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Quota Usage:</strong>
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span>{stats?.usage.sent} / {stats?.usage.limit} Sent</span>
                  <span>{stats?.usage.remaining} remaining</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(100, (stats?.usage.sent / stats?.usage.limit) * 100)}%`, 
                    height: '100%', 
                    backgroundColor: (stats?.usage.sent / stats?.usage.limit) > 0.9 ? 'var(--danger-500)' : '#2563eb',
                    borderRadius: '3px'
                  }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Stats Metrics Grid */}
          <div className="accounts-stats-row" style={{ marginTop: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', width: '100%' }}>
            {/* 1. Queued */}
            <div className="accounts-stat-card">
              <div className="accounts-stat-card__icon" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }}>
                <Activity size={22} />
              </div>
              <div className="accounts-stat-card__info">
                <span className="accounts-stat-card__label">Queued</span>
                <span className="accounts-stat-card__value">
                  {stats?.queuedCount || 0}
                  {stats?.processingCount > 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginLeft: '6px' }}>
                      ({stats.processingCount} in-flight)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* 2. Sent */}
            <div className="accounts-stat-card">
              <div className="accounts-stat-card__icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <CheckCircle size={22} />
              </div>
              <div className="accounts-stat-card__info">
                <span className="accounts-stat-card__label">Sent</span>
                <span className="accounts-stat-card__value">{stats?.sentCount || 0}</span>
              </div>
            </div>

            {/* 3. Failed */}
            <div className="accounts-stat-card">
              <div className="accounts-stat-card__icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                <AlertTriangle size={22} />
              </div>
              <div className="accounts-stat-card__info">
                <span className="accounts-stat-card__label">Failed</span>
                <span className="accounts-stat-card__value">{stats?.failedCount || 0}</span>
              </div>
            </div>

            {/* 4. Success Rate */}
            <div className="accounts-stat-card">
              <div className="accounts-stat-card__icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                <TrendingUp size={22} />
              </div>
              <div className="accounts-stat-card__info">
                <span className="accounts-stat-card__label">Success Rate</span>
                <span className="accounts-stat-card__value">{successRate}%</span>
              </div>
            </div>

            {/* 5. Last Delivery Time */}
            <div className="accounts-stat-card">
              <div className="accounts-stat-card__icon" style={{ backgroundColor: 'rgba(8, 145, 178, 0.1)', color: '#0891b2' }}>
                <Clock size={22} />
              </div>
              <div className="accounts-stat-card__info">
                <span className="accounts-stat-card__label">Last Delivery</span>
                <span className="accounts-stat-card__value" style={{ fontSize: stats?.lastDeliveryTime ? '13px' : '20px', fontWeight: 800 }}>
                  {stats?.lastDeliveryTime ? dayjs(stats.lastDeliveryTime).format('HH:mm (DD MMM)') : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs Filter bar */}
          <div className="accounts-table-card" style={{ marginTop: '24px', padding: '16px', overflow: 'visible' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'center' }}>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '450px' }}>
                <div className="autocomplete-wrapper" style={{ flexGrow: 1 }}>
                  <input
                    type="text"
                    className="accounts-form-input"
                    placeholder="Search Employee name, ID, receipt number or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <button type="submit" className="accounts-btn accounts-btn--primary" style={{ padding: '8px 16px' }}>
                  Search
                </button>
              </form>

              <div className="accounts-filters" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Filters:</span>
                </div>
                
                <select 
                  className="accounts-form-select" 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{ width: '130px', padding: '6px 12px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="QUEUED">Queued</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="RETRYING">Retrying</option>
                </select>

                <input
                  type="text"
                  placeholder="Month (e.g. June 2026)"
                  className="accounts-form-input"
                  value={monthFilter}
                  onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
                  style={{ width: '150px', padding: '6px 12px' }}
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="accounts-table-card" style={{ marginTop: '16px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Delivery Logs</h3>
                {selectedLogs.length > 0 && (
                  <span className="accounts-badge" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-700)', fontWeight: 600 }}>
                    {selectedLogs.length} Selected
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedLogs.length > 0 && (
                  <button onClick={handleRetrySelected} className="accounts-btn accounts-btn--secondary" style={{ padding: '6px 12px', fontSize: '12px', borderColor: 'var(--primary-300)', color: 'var(--primary-600)' }}>
                    Retry Selected Failed
                  </button>
                )}
                {totalFailed > 0 && (
                  <button onClick={handleRetryAllFailed} className="accounts-btn accounts-btn--secondary" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}>
                    Retry All Failed
                  </button>
                )}
              </div>
            </div>

            {logsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Refreshing audit trails...</div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No logs matching the selected filters found.</div>
            ) : (
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={logs.filter(l => l.status === 'FAILED').length > 0 && selectedLogs.length === logs.filter(l => l.status === 'FAILED').length}
                      />
                    </th>
                    <th>Employee Name & ID</th>
                    <th>Receipt No / Month</th>
                    <th>Destination Email</th>
                    <th>Sent At / Action</th>
                    <th>Attempts</th>
                    <th>Delivery Status</th>
                    <th>Failure Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          disabled={log.status !== 'FAILED'}
                          checked={selectedLogs.includes(log.salary_receipt_id)}
                          onChange={() => toggleSelectLog(log.salary_receipt_id)}
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.employee_name || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.employee_id || 'N/A'}</div>
                      </td>
                      <td>
                        <div>{log.receipt_no || 'N/A'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>{log.month}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                          <span>{log.employee_email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {log.sent_time ? dayjs(log.sent_time).format('YYYY-MM-DD HH:mm:ss') : dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Action: {log.action}
                        </div>
                      </td>
                      <td>{log.attempt_number} attempts</td>
                      <td>
                        {log.status === 'SENT' && (
                          <span style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-700)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                            Delivered
                          </span>
                        )}
                        {log.status === 'QUEUED' && (
                          <span style={{ backgroundColor: 'var(--neutral-100)', color: 'var(--neutral-500)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 600 }}>
                            Queued
                          </span>
                        )}
                        {log.status === 'PROCESSING' && (
                          <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                            Processing
                          </span>
                        )}
                        {log.status === 'RETRYING' && (
                          <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                            Retrying
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <span style={{ backgroundColor: 'var(--danger-50)', color: 'var(--danger-700)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 700 }}>
                            Failed
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.status === 'FAILED' || log.status === 'RETRYING' ? (
                          <span title={log.error_message} style={{ fontSize: '11px', color: 'var(--danger-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldAlert size={11} />
                            {log.error_message || 'SMTP delivery failure'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {log.status === 'FAILED' && (
                          <button onClick={() => handleRetrySingle(log.salary_receipt_id)} className="accounts-btn accounts-btn--secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            Retry Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', alignItems: 'center', borderTop: '1px solid var(--neutral-200)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={page === 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))} 
                    className="accounts-btn accounts-btn--secondary" 
                    style={{ padding: '6px 12px' }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button 
                    disabled={page === totalPages} 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                    className="accounts-btn accounts-btn--secondary" 
                    style={{ padding: '6px 12px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default EmailDashboard;
