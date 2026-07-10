import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getAccountsSummary } from '../../services/api';
import './styling/Accounts.css';

const AccountsDashboard = () => {
  const [preset, setPreset] = useState('day');
  const [summary, setSummary] = useState({
    totalFeeReceipts: 0,
    totalSalaryReceipts: 0,
    totalReceiptsGenerated: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getDates = (presetVal) => {
    const today = dayjs();
    let startDate = '';
    let endDate = '';

    if (presetVal === 'day') {
      startDate = today.startOf('day').format('YYYY-MM-DD');
      endDate = today.endOf('day').format('YYYY-MM-DD');
    } else if (presetVal === 'week') {
      startDate = today.startOf('week').format('YYYY-MM-DD');
      endDate = today.endOf('week').format('YYYY-MM-DD');
    } else if (presetVal === 'month') {
      startDate = today.startOf('month').format('YYYY-MM-DD');
      endDate = today.endOf('month').format('YYYY-MM-DD');
    } else if (presetVal === 'year') {
      startDate = today.startOf('year').format('YYYY-MM-DD');
      endDate = today.endOf('year').format('YYYY-MM-DD');
    }
    return { startDate, endDate };
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getDates(preset);
        const res = await getAccountsSummary({ startDate, endDate });
        if (res.success) {
          setSummary(res.data);
        } else {
          setError(res.message || 'Failed to fetch dashboard summary.');
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError(err.message || 'Connection error.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [preset]);

  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>Loading dashboard summary...</p>
      </div>
    );
  }

  return (
    <div className="accounts-container">

      {error && (
        <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Date Preset Filter */}
      <div className="accounts-dashboard-filter" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
        <select
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          className="accounts-form-input"
          style={{ width: '160px', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, height: '36px' }}
        >
          <option value="all_time">Lifetime</option>
          <option value="day">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Operational Statistics */}
      <section className="accounts-stats-row">
        {/* Card 1: Fee Receipts Generated */}
        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon accounts-stat-card__icon--fees">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Fee Receipts Generated</span>
            <span className="accounts-stat-card__value">{(summary.totalFeeReceipts || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 2: Salary Slips Generated */}
        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon accounts-stat-card__icon--salary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Salary Slips Generated</span>
            <span className="accounts-stat-card__value">{(summary.totalSalaryReceipts || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Card 3: Total Receipts Generated */}
        <div className="accounts-stat-card">
          <div className="accounts-stat-card__icon accounts-stat-card__icon--receipts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2"></rect>
              <line x1="16" y1="2" x2="16" y2="4"></line>
              <line x1="8" y1="2" x2="8" y2="4"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div className="accounts-stat-card__info">
            <span className="accounts-stat-card__label">Total Receipts Generated</span>
            <span className="accounts-stat-card__value">{(summary.totalReceiptsGenerated || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </section>

      <section className="accounts-sections" style={{ marginTop: '12px' }}>
        {/* Recent Transactions List */}
        <div>
          <h2 className="accounts-section__title">
            Recent Activity
            <div className="accounts-section__line" />
          </h2>
          <div className="accounts-table-card">
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Receipt Number</th>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
                  summary.recentTransactions.map((tx) => (
                    <tr key={`${tx.type}-${tx.id}`}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                        <Link 
                          to={tx.type === 'fee' ? `/admin/accounts/fees/${tx.id}` : `/admin/accounts/salary/${tx.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {tx.receiptNo}
                        </Link>
                      </td>
                      <td>
                        <span className={`accounts-badge accounts-badge--${tx.type}`}>
                          {tx.type === 'fee' ? 'Fee Receipt' : 'Salary Slip'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{tx.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {tx.type === 'fee' 
                          ? new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : tx.date
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountsDashboard;
