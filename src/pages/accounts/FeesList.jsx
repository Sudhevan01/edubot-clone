import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  getFeeReceipts, 
  downloadAccountsPdf, 
  retryFeeWhatsApp, 
  getFeeWhatsAppLogs, 
  deleteFeeReceipt, 
  getBaseUrl,
  getFeeAnalytics,
  exportFeeReceipts
} from '../../services/api';
import dayjs from 'dayjs';
import './styling/Accounts.css';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const FeesList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isAdmin = user.role === 'ADMIN' || isSuperAdmin;
  
  const isAccountant = user.role === 'ACCOUNTANT';
  const [view, setView] = useState(isAccountant ? 'list' : 'menu'); // 'menu', 'list', 'analytics'
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [datePreset, setDatePreset] = useState('today');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  // Drawer & Modals State
  const [drawerReceipt, setDrawerReceipt] = useState(null);
  const [drawerLogs, setDrawerLogs] = useState([]);
  const [drawerLogsLoading, setDrawerLogsLoading] = useState(false);
  const [resendConfirmReceipt, setResendConfirmReceipt] = useState(null);
  const [deleteConfirmReceipt, setDeleteConfirmReceipt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let title = 'Fee Receipts';
    if (view === 'list') title = 'Receipt History';
    else if (view === 'analytics') title = 'Fee Analytics';
    window.dispatchEvent(new CustomEvent('set-route-title', { detail: title }));
  }, [view]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getFeeReceipts({
        search,
        startDate,
        endDate,
        paymentMode,
        page,
        limit
      });
      if (res.success) {
        setFees(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
          setTotalItems(res.pagination.total || 0);
        }
      } else {
        setError(res.message || 'Failed to fetch fee receipts.');
      }
    } catch (err) {
      console.error('Error fetching fee receipts:', err);
      setError(err.message || 'Connection error.');
    } finally {
      // Small timeout to give natural feel
      setLoading(false);
    }
  };
  
  const getPaginationPages = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page <= 3) {
      const max = Math.max(3, page + 1);
      for (let i = 2; i <= max; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (page >= totalPages - 2) {
      pages.push('...');
      const min = Math.min(totalPages - 2, page - 1);
      for (let i = min; i < totalPages; i++) pages.push(i);
      pages.push(totalPages);
    } else {
      pages.push('...');
      pages.push(page - 1, page, page + 1);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => {
    fetchFees();
  }, [page, limit, search, startDate, endDate, paymentMode]);

  const handleFetchAnalytics = async (start = startDate, end = endDate) => {
    let targetStart = start;
    let targetEnd = end;
    if (!targetStart && !targetEnd && datePreset) {
      const range = getDateRangeFromPreset(datePreset);
      targetStart = range.start;
      targetEnd = range.end;
      setStartDate(range.start);
      setEndDate(range.end);
    }
    setAnalyticsLoading(true);
    setAnalyticsError('');
    try {
      const res = await getFeeAnalytics({ startDate: targetStart, endDate: targetEnd });
      if (res.success) {
        setAnalytics(res.data);
      } else {
        setAnalyticsError(res.message || 'Failed to load analytics.');
      }
    } catch (err) {
      setAnalyticsError(err.message || 'Connection error.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const getDateRangeFromPreset = (preset) => {
    const today = dayjs();
    let start = null;
    let end = today;

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = today.subtract(1, 'day');
        end = today.subtract(1, 'day');
        break;
      case 'this_week':
        start = today.startOf('week');
        end = today.endOf('week');
        break;
      case 'last_week':
        start = today.subtract(1, 'week').startOf('week');
        end = today.subtract(1, 'week').endOf('week');
        break;
      case 'this_month':
        start = today.startOf('month');
        end = today.endOf('month');
        break;
      case 'last_month':
        start = today.subtract(1, 'month').startOf('month');
        end = today.subtract(1, 'month').endOf('month');
        break;
      case 'this_year':
        start = today.startOf('year');
        end = today.endOf('year');
        break;
      case 'custom':
      default:
        return { start: '', end: '' };
    }

    return {
      start: start.format('YYYY-MM-DD'),
      end: end.format('YYYY-MM-DD')
    };
  };

  const handleDrillDown = (mode = '', customStart = startDate, customEnd = endDate) => {
    setPaymentMode(mode);
    setStartDate(customStart);
    setEndDate(customEnd);
    setPage(1);
    setView('list');
    setTimeout(() => {
      fetchFees();
    }, 50);
  };

  const handleExportFees = async (format) => {
    try {
      setActionLoading(true);
      await exportFeeReceipts({
        search,
        startDate,
        endDate,
        paymentMode
      }, format);
    } catch (err) {
      console.error(err);
      alert('Failed to export fees: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'analytics') {
      handleFetchAnalytics(startDate, endDate);
    }
  }, [startDate, endDate, view]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    if (viewParam) {
      setView(viewParam);
    }
  }, [location.search]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/accounts/fees') {
        setView(isAccountant ? 'list' : 'menu');
        setError('');
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFees();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(() => {
      fetchFees();
    }, 50);
  };

  // Download PDF
  const handleDownloadPdf = async (id, receiptNo) => {
    try {
      await downloadAccountsPdf(`/accounts/fees/${id}/pdf`, `${receiptNo}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF: ' + err.message);
    }
  };

  // View PDF in a new tab
  const handleViewPdf = (id) => {
    const token = localStorage.getItem('vms_user') 
      ? JSON.parse(localStorage.getItem('vms_user')).token 
      : null;
    
    const url = `${getBaseUrl()}/api/accounts/fees/${id}/pdf${token ? `?token=${token}` : ''}`;
    window.open(url, '_blank');
  };

  // Print PDF receipt
  const handlePrintPdf = (id) => {
    const token = localStorage.getItem('vms_user') 
      ? JSON.parse(localStorage.getItem('vms_user')).token 
      : null;
    const url = `${getBaseUrl()}/api/accounts/fees/${id}/pdf${token ? `?token=${token}` : ''}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PDF for printing');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
      })
      .catch(err => {
        console.error(err);
        alert('Failed to print receipt.');
      });
  };

  // Open WhatsApp logs drawer
  const handleOpenDrawer = async (receipt) => {
    setDrawerReceipt(receipt);
    setDrawerLogsLoading(true);
    try {
      const res = await getFeeWhatsAppLogs(receipt.id);
      if (res.success && res.data) {
        setDrawerLogs(res.data);
      } else {
        setDrawerLogs([]);
      }
    } catch (err) {
      console.error(err);
      setDrawerLogs([]);
    } finally {
      setDrawerLogsLoading(false);
    }
  };

  // Trigger retry/resend
  const handleRetryWhatsApp = async (receiptId) => {
    setActionLoading(true);
    setResendConfirmReceipt(null);
    try {
      const res = await retryFeeWhatsApp(receiptId);
      if (res.success) {
        alert('WhatsApp delivery enqueued successfully.');
        fetchFees();
      } else {
        alert(res.message || 'Failed to trigger WhatsApp resend.');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering WhatsApp retry: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = async (receiptId) => {
    setActionLoading(true);
    setDeleteConfirmReceipt(null);
    try {
      const res = await deleteFeeReceipt(receiptId);
      if (res.success) {
        alert('Receipt deleted successfully.');
        fetchFees();
      } else {
        alert(res.message || 'Failed to delete receipt.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting receipt: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SENT': return 'whatsapp-badge--sent';
      case 'FAILED': return 'whatsapp-badge--failed';
      case 'PROCESSING': return 'whatsapp-badge--processing';
      case 'QUEUED': return 'whatsapp-badge--queued';
      case 'RETRYING': return 'whatsapp-badge--retrying';
      case 'PENDING':
      default:
        return 'whatsapp-badge--pending';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (view === 'menu' && !isAccountant) {
    return (
      <div className="accounts-container">

        <div className="accounts-menu-grid">
          <Link to="/admin/accounts/fees/new" className="accounts-menu-card">
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Create Fee Receipt</h3>
            <p className="accounts-menu-card__description">Generate a new digital receipt for student fees.</p>
          </Link>

          <div className="accounts-menu-card" onClick={() => setView('list')}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Receipt History</h3>
            <p className="accounts-menu-card__description">Search, print, and check live delivery logs of fee receipts.</p>
          </div>

          <div className="accounts-menu-card" onClick={() => { setView('analytics'); handleFetchAnalytics(); }}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Fee Analytics</h3>
            <p className="accounts-menu-card__description">View total collections and payment mode breakdown.</p>
          </div>

          <Link to="/admin/accounts/whatsapp" className="accounts-menu-card">
            <div className="accounts-menu-card__icon-box" style={{ backgroundColor: 'var(--success-50)', color: 'var(--success-600)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">WhatsApp Delivery</h3>
            <p className="accounts-menu-card__description">Monitor real-time WhatsApp delivery logs, success rates, and retry failures.</p>
          </Link>
        </div>
      </div>
    );
  }

  if (view === 'analytics') {
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const modeConfig = [
      { key: 'Cash',           label: 'Cash',          icon: '💵' },
      { key: 'UPI',            label: 'UPI',           icon: '📱' },
      { key: 'Bank Transfer',  label: 'Bank Transfer', icon: '🏦' },
      { key: 'Card Payment',   label: 'Card Payment',  icon: '💳' },
      { key: 'Cheque Payment', label: 'Cheque',        icon: '📝' }
    ];

    return (
      <div className="accounts-container">
        <style>{`
          @keyframes skeleton-pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
          .skeleton-pulse {
            animation: skeleton-pulse 1.5s infinite ease-in-out;
          }
          .accounts-stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .accounts-payment-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border-color: var(--primary-350) !important;
          }
        `}</style>
        
        {/* Combined Filter & Actions Bar */}
        <section className="accounts-filter-bar-v2">
          {/* Date Range Preset */}
          <div className="filter-dropdown-v2" style={{ minWidth: '160px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <select
              value={datePreset}
              onChange={(e) => {
                const preset = e.target.value;
                setDatePreset(preset);
                if (preset !== 'custom') {
                  const range = getDateRangeFromPreset(preset);
                  setStartDate(range.start);
                  setEndDate(range.end);
                  handleFetchAnalytics(range.start, range.end);
                }
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="last_week">Last Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom" hidden>Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range (Always visible) */}
          <div className="range-filter-group">
            <div className="filter-dropdown-v2 date-picker-v2">
              <span className="filter-label">From</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                  handleFetchAnalytics(e.target.value, endDate);
                }}
              />
            </div>
            <div className="filter-dropdown-v2 date-picker-v2">
              <span className="filter-label">Till</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                  handleFetchAnalytics(startDate, e.target.value);
                }}
              />
            </div>
          </div>

          {/* Export button */}
          <div className="action-btns-group">
            <button
              type="button"
              onClick={() => handleExportFees('excel')}
              className="export-excel-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export Excel
            </button>
          </div>
        </section>

        {analyticsError && (
          <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {analyticsError}
          </div>
        )}

        {analyticsLoading ? (
          <div>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '100px', background: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '40%', height: '16px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                <div style={{ width: '60%', height: '32px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
              </div>
              <div style={{ flex: 1, height: '100px', background: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '45%', height: '16px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                <div style={{ width: '70%', height: '32px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
              </div>
            </div>
            <div style={{ background: 'var(--neutral-100)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div style={{ width: '30%', height: '20px', background: 'var(--neutral-200)', borderRadius: '4px', marginBottom: '24px' }} className="skeleton-pulse"></div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ flex: '1 1 160px', height: '120px', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', background: 'var(--neutral-200)', borderRadius: '50%' }} className="skeleton-pulse"></div>
                    <div style={{ width: '50%', height: '14px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                    <div style={{ width: '80%', height: '20px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : !analytics || analytics.totalCount === 0 ? (
          <div className="accounts-empty-state" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--neutral-300)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-md)', fontWeight: 600 }}>No Receipt Data</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>No fee receipts found for selected period.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <section className="accounts-stats-row" style={{ marginBottom: '12px' }}>
              <div className="accounts-stat-card" onClick={() => handleDrillDown('', startDate, endDate)} style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}>
                <div className="accounts-stat-card__icon accounts-stat-card__icon--receipts">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="accounts-stat-card__info">
                  <span className="accounts-stat-card__label">Fee Receipts Generated</span>
                  <span className="accounts-stat-card__value">{(analytics.totalCount || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="accounts-stat-card" onClick={() => handleDrillDown('', startDate, endDate)} style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}>
                <div className="accounts-stat-card__icon accounts-stat-card__icon--fees">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <div className="accounts-stat-card__info">
                  <span className="accounts-stat-card__label">Total Fee Collected</span>
                  <span className="accounts-stat-card__value" style={{ fontSize: '1.4rem' }}>{formatCurrency(analytics.totalCollected)}</span>
                </div>
              </div>
            </section>

            {/* Payment mode breakdown */}
            <div className="accounts-form-card">
              <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 'var(--sp-4)', color: 'var(--primary-700)' }}>
                Payment Mode Breakdown
              </h3>
              <div className="accounts-stats-row" style={{ flexWrap: 'wrap' }}>
                {modeConfig.map(({ key, label, icon }) => (
                  <div 
                    key={key} 
                    onClick={() => handleDrillDown(key, startDate, endDate)}
                    style={{
                      flex: '1 1 160px',
                      minWidth: '140px',
                      background: 'var(--neutral-50)',
                      border: '1px solid var(--neutral-200)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    className="accounts-payment-card"
                  >
                    <span style={{ fontSize: '22px' }}>{icon}</span>
                    <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '4px' }}>
                      {formatCurrency(analytics.byMode?.[key]?.amount || 0)}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Receipts: {(analytics.byMode?.[key]?.count || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }


  return (
    <div className="accounts-container">
      {/* Combined Filter & Actions Bar */}
      <section className="accounts-filter-bar-v2">
        <div className="search-bar-v2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Search student or receipt..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="range-filter-group">
          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">From</span>
            <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          </div>
          <div className="filter-dropdown-v2 date-picker-v2">
            <span className="filter-label">Till</span>
            <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="filter-dropdown-v2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          <select
            value={paymentMode}
            onChange={(e) => { setPage(1); setPaymentMode(e.target.value); }}
          >
            <option value="">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card Payment">Card Payment</option>
            <option value="Cheque Payment">Cheque</option>
          </select>
        </div>

        <div className="action-btns-group">
          <button 
            type="button" 
            onClick={() => handleExportFees('excel')} 
            className="export-excel-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Excel
          </button>
          <Link to="/admin/accounts/fees/new" className="accounts-btn accounts-btn--primary" style={{ height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New
          </Link>
        </div>
      </section>

      {error && (
        <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Fees Table */}
      <div className="accounts-table-card">
        {loading ? (
          <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="login-card__spinner" style={{ width: '32px', height: '32px', borderLeftColor: 'var(--primary-500)' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading receipt list...</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="accounts-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Student Name</th>
                    <th>Date</th>
                    <th>Payment Mode</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.length > 0 ? (
                    fees.map((fee) => (
                      <tr key={fee.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{fee.receipt_no}</td>
                        <td style={{ fontWeight: 500 }}>{fee.student_name}</td>
                        <td>{new Date(fee.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          {fee.payment_mode === 'Bank' 
                            ? 'Bank Transfer' 
                            : fee.payment_mode === 'Card' 
                            ? 'Card Payment' 
                            : fee.payment_mode === 'Cheque' 
                            ? 'Cheque Payment' 
                            : (fee.payment_mode || 'Cash')}
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(fee.amount)}</td>
                        <td>
                          <button 
                            onClick={() => handleOpenDrawer(fee)}
                            className={`whatsapp-status-pill ${getStatusBadgeClass(fee.whatsapp_status)}`}
                            title="Click to view delivery logs"
                          >
                            {fee.whatsapp_status || 'PENDING'}
                          </button>
                        </td>
                         <td>
                          <div className="action-group-v2" style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenDrawer(fee)}
                              className="action-btn-v2 edit"
                              title="View Details"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <button
                              onClick={() => handlePrintPdf(fee.id)}
                              className="action-btn-v2 edit"
                              title="Print Receipt"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                              </svg>
                            </button>

                            {user.role !== 'ACCOUNTANT' && (
                              <Link
                                to={`/admin/accounts/fees/edit/${fee.id}`}
                                className="action-btn-v2 edit"
                                title="Edit Receipt"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                              </Link>
                            )}

                            {isSuperAdmin && (
                              <button
                                onClick={() => setDeleteConfirmReceipt(fee)}
                                disabled={actionLoading}
                                className="action-btn-v2 delete"
                                title="Delete Receipt (Super Admin Only)"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  <line x1="10" y1="11" x2="10" y2="17"></line>
                                  <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No fee receipts found for selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="table-footer-v2">
                <div className="showing-entries-group-v2">
                  <span className="showing-entries-v2">
                    Showing {fees.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalItems)} of {totalItems} entries
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="entries-select-v2"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="pagination-v2">
                  <button
                    className="page-btn-prev-next"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    &lt;
                  </button>
                  {getPaginationPages().map((pVal, index) => (
                    pVal === '...' ? (
                      <span key={`dots-${index}`} className="pagination-dots-v2">...</span>
                    ) : (
                      <button
                        key={`page-${pVal}-${index}`}
                        className={`page-btn-v2 ${page === pVal ? 'active' : ''}`}
                        onClick={() => setPage(pVal)}
                      >
                        {pVal}
                      </button>
                    )
                  ))}
                  <button
                    className="page-btn-prev-next"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* WhatsApp Deliv      {/* Fee Receipt Detail & WhatsApp Logs side drawer */}
      {drawerReceipt && (
        <div className="delivery-log-drawer-overlay" onClick={() => setDrawerReceipt(null)}>
          <div className="delivery-log-drawer" style={{ width: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-600)', letterSpacing: '0.05em' }}>Receipt Details</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 800 }}>{drawerReceipt.receipt_no}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handleDownloadPdf(drawerReceipt.id, drawerReceipt.receipt_no)}
                  className="accounts-btn accounts-btn--primary"
                  style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  PDF
                </button>
                <button className="close-btn" style={{ fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setDrawerReceipt(null)}>✕</button>
              </div>
            </div>
            <div className="drawer-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Student Information */}
              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Student Name</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerReceipt.student_name}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Class</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerReceipt.class || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Academic Year</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerReceipt.academic_year || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Date</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerReceipt.date ? dayjs(drawerReceipt.date).format('DD MMM YYYY') : '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    let dynamicValues = null;
                    if (drawerReceipt.dynamic_values) {
                      try {
                        dynamicValues = typeof drawerReceipt.dynamic_values === 'string' ? JSON.parse(drawerReceipt.dynamic_values) : drawerReceipt.dynamic_values;
                      } catch (e) {}
                    }
                    if (!dynamicValues) dynamicValues = {};
                    
                    const getVal = (key) => {
                      if (dynamicValues[key] !== undefined) return Number(dynamicValues[key]);
                      const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                      if (dynamicValues[camel] !== undefined) return Number(dynamicValues[camel]);
                      if (drawerReceipt[key] !== undefined) return Number(drawerReceipt[key]);
                      if (key === 'sports_games_fee' && drawerReceipt.sports_fee !== undefined) return Number(drawerReceipt.sports_fee);
                      if (key === 'school_maintenance_fee' && drawerReceipt.maintenance_fee !== undefined) return Number(drawerReceipt.maintenance_fee);
                      return 0;
                    };

                    const feesList = [
                      { label: 'Admission Fee', val: getVal('admission_fee') },
                      { label: 'Tuition Fee', val: getVal('tuition_fee') },
                      { label: 'Library Fee', val: getVal('library_fee') },
                      { label: 'Lab Fee', val: getVal('lab_fee') },
                      { label: 'Exam Fee', val: getVal('exam_fee') },
                      { label: 'Transport Fee', val: getVal('transport_fee') },
                      { label: 'Sports Fee', val: getVal('sports_games_fee') },
                      { label: 'Maintenance Fee', val: getVal('school_maintenance_fee') },
                      { label: 'Computer Fee', val: getVal('computer_fee') },
                      { label: 'Smart Class Fee', val: getVal('smart_class_fee') },
                      { label: 'Others Fee', val: getVal('others_fee') }
                    ];

                    const activeFees = feesList.filter(f => f.val > 0);

                    // Custom fields from dynamic values
                    const standardKeys = [
                      'admission_fee', 'tuition_fee', 'library_fee', 'lab_fee',
                      'exam_fee', 'transport_fee', 'sports_games_fee', 'school_maintenance_fee',
                      'computer_fee', 'smart_class_fee', 'others_fee',
                      'admissionfee', 'tuitionfee', 'libraryfee', 'labfee',
                      'examfee', 'transportfee', 'sportsgamesfee', 'schoolmaintenancefee',
                      'computerfee', 'smartclassfee', 'othersfee'
                    ];

                    const customFees = Object.keys(dynamicValues)
                      .filter(k => !standardKeys.includes(k.toLowerCase().replace(/_/g, '')))
                      .map(k => ({ label: toTitleCase(k), val: Number(dynamicValues[k] || 0) }))
                      .filter(f => f.val > 0);

                    const allFees = [...activeFees, ...customFees];

                    if (allFees.length === 0) {
                      return <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No breakdown details recorded.</span>;
                    }

                    return allFees.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed var(--neutral-100)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(f.val)}</strong>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Details</h4>
                {(() => {
                  let paymentDetails = null;
                  if (drawerReceipt.payment_details) {
                    try {
                      paymentDetails = typeof drawerReceipt.payment_details === 'string' ? JSON.parse(drawerReceipt.payment_details) : drawerReceipt.payment_details;
                    } catch (e) {}
                  }
                  if (!paymentDetails) paymentDetails = {};
                  const mode = drawerReceipt.payment_mode || 'Cash';

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Payment Mode</span>
                        <strong style={{ color: 'var(--primary-600)' }}>
                          {mode === 'Bank' ? 'Bank Transfer' : mode === 'Card' ? 'Card Payment' : mode === 'Cheque' ? 'Cheque Payment' : mode}
                        </strong>
                      </div>

                      {mode === 'UPI' && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>UPI ID</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.upiId || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.transactionId || drawerReceipt.payment_reference || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Reference Number</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.referenceNumber || '-'}</strong>
                          </div>
                        </>
                      )}

                      {(mode === 'Bank' || mode === 'Bank Transfer') && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Bank Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.bankName || drawerReceipt.bank_name || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Account Number</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.accountNo || drawerReceipt.account_no || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>UTR Number</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.utrNumber || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Transfer Date</span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {paymentDetails.paymentDate ? dayjs(paymentDetails.paymentDate).format('DD MMM YYYY') : drawerReceipt.date ? dayjs(drawerReceipt.date).format('DD MMM YYYY') : '-'}
                            </strong>
                          </div>
                        </>
                      )}

                      {(mode === 'Card' || mode === 'Card Payment') && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Card Type</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.cardType || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.transactionId || drawerReceipt.payment_reference || '-'}</strong>
                          </div>
                        </>
                      )}

                      {(mode === 'Cheque' || mode === 'Cheque Payment') && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Cheque Number</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.chequeNumber || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Bank Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.bankName || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Cheque Date</span>
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {paymentDetails.chequeDate ? dayjs(paymentDetails.chequeDate).format('DD MMM YYYY') : '-'}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Additional Information */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Additional Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{formatCurrency(drawerReceipt.amount)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>WhatsApp Delivery</span>
                    <span className={`whatsapp-status-badge ${getStatusBadgeClass(drawerReceipt.whatsapp_status)}`}>
                      {drawerReceipt.whatsapp_status || 'PENDING'}
                    </span>
                  </div>
                  {drawerReceipt.whatsapp_sent_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>WhatsApp Sent Date</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{dayjs(drawerReceipt.whatsapp_sent_at).format('DD MMM YYYY hh:mm A')}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Receipt Created Date</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{dayjs(drawerReceipt.created_at || drawerReceipt.date).format('DD MMM YYYY hh:mm A')}</strong>
                  </div>
                </div>
              </div>

              {/* Delivery Attempts Logs */}
              <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp Delivery Attempts</h4>
                {drawerLogsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                    <div className="login-card__spinner" style={{ width: '20px', height: '20px', borderLeftColor: 'var(--primary-500)' }}></div>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>Loading attempts...</p>
                  </div>
                ) : drawerLogs.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: '12px 0' }}>No delivery attempts recorded.</p>
                ) : (
                  <div className="logs-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {drawerLogs.map((log, idx) => (
                      <div key={log.id} style={{ fontSize: '12px', backgroundColor: 'var(--neutral-50)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--primary-700)' }}>Attempt {drawerLogs.length - idx}</span>
                          <span className={`whatsapp-status-badge ${getStatusBadgeClass(log.status)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {log.status}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                          Time: {dayjs(log.created_at).format('DD MMM YYYY hh:mm:ss A')}
                        </div>
                        {log.error && (
                          <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '6px', borderRadius: '4px', marginTop: '6px', fontFamily: 'monospace', fontSize: '10px' }}>
                            {log.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Quick Actions */}
              {(drawerReceipt.whatsapp_status === 'FAILED' || drawerReceipt.whatsapp_status === 'SENT') && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                  {drawerReceipt.whatsapp_status === 'FAILED' && (
                    <button
                      onClick={() => { handleRetryWhatsApp(drawerReceipt.id); setDrawerReceipt(null); }}
                      className="accounts-btn"
                      style={{ flex: 1, padding: '10px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                    >
                      Retry WhatsApp
                    </button>
                  )}
                  {drawerReceipt.whatsapp_status === 'SENT' && (
                    <button
                      onClick={() => { setResendConfirmReceipt(drawerReceipt); setDrawerReceipt(null); }}
                      className="accounts-btn accounts-btn--secondary"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      Resend WhatsApp
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {resendConfirmReceipt && (
        <div className="modal-overlay-styled">
          <div className="confirm-modal-box">
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Resend Receipt?</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Are you sure you want to resend the fee receipt to the parent's phone number?
              <br />
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '6px', fontSize: '15px' }}>
                {resendConfirmReceipt.parent_phone}
              </strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="accounts-btn accounts-btn--secondary"
                style={{ padding: '8px 16px', height: 'auto' }}
                onClick={() => setResendConfirmReceipt(null)}
              >
                NO
              </button>
              <button
                className="accounts-btn accounts-btn--primary"
                style={{ padding: '8px 16px', height: 'auto' }}
                onClick={() => handleRetryWhatsApp(resendConfirmReceipt.id)}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmReceipt && (
        <div className="modal-overlay-styled">
          <div className="confirm-modal-box">
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>Delete Fee Receipt?</h4>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Are you sure you want to delete receipt <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirmReceipt.receipt_no}</strong>?
              This will permanently delete the transaction record, S3 PDF, and all delivery logs.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="accounts-btn accounts-btn--secondary"
                style={{ padding: '8px 16px', height: 'auto' }}
                onClick={() => setDeleteConfirmReceipt(null)}
              >
                Cancel
              </button>
              <button
                className="accounts-btn"
                style={{ padding: '8px 16px', height: 'auto', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600 }}
                onClick={() => handleDeleteReceipt(deleteConfirmReceipt.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled tags to manage inline classes */}
      <style>{`
        .pdf-status-badge {
          font-weight: 700;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .pdf-status-badge--generated {
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .pdf-status-badge--missing {
          background-color: #fcf2f2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
        
        .whatsapp-status-pill {
          display: inline-block;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.1s ease;
          text-transform: uppercase;
          background: none;
        }
        .whatsapp-status-pill:hover {
          transform: scale(1.05);
        }
        
        .whatsapp-badge--pending {
          background-color: #f3f4f6;
          color: #4b5563;
          border-color: #e5e7eb;
        }
        .whatsapp-badge--queued {
          background-color: #eff6ff;
          color: #2563eb;
          border-color: #dbeafe;
        }
        .whatsapp-badge--processing {
          background-color: #fff7ed;
          color: #ea580c;
          border-color: #ffedd5;
        }
        .whatsapp-badge--sent {
          background-color: #f0fdf4;
          color: #16a34a;
          border-color: #bbf7d0;
        }
        .whatsapp-badge--failed {
          background-color: #fef2f2;
          color: #dc2626;
          border-color: #fca5a5;
        }
        .whatsapp-badge--retrying {
          background-color: #faf5ff;
          color: #7c3aed;
          border-color: #f3e8ff;
        }

        .action-icon-btn {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-icon-btn:hover {
          background-color: var(--neutral-100);
          color: var(--primary-600);
          border-color: var(--primary-400);
        }
        .action-icon-btn--danger:hover {
          background-color: #fef2f2;
          color: #dc2626;
          border-color: #fca5a5;
        }

        .action-btn-styled {
          background: none;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0 10px;
          height: 32px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .action-btn-styled--retry {
          color: #ea580c;
          border-color: #ffedd5;
          background-color: #fff7ed;
        }
        .action-btn-styled--retry:hover {
          background-color: #ffedd5;
        }
        .action-btn-styled--resend {
          color: var(--primary-600);
          border-color: var(--primary-100);
          background-color: var(--primary-50);
        }
        .action-btn-styled--resend:hover {
          background-color: var(--primary-100);
        }


        
        .attempt-item {
          font-size: 13px;
        }
        .attempt-title {
          font-weight: 800;
          color: var(--primary-700);
        }
        .log-label {
          color: var(--text-secondary);
        }
        .log-value {
          font-weight: 500;
          color: var(--text-primary);
        }
        .log-error-text {
          font-size: 12px;
          color: #dc2626;
          background-color: #fef2f2;
          padding: 8px;
          border-radius: 6px;
          margin-top: 6px;
          font-family: monospace;
          line-height: 1.4;
          word-break: break-all;
        }

        .modal-overlay-styled {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .confirm-modal-box {
          background-color: #fff;
          padding: 24px;
          border-radius: 12px;
          max-width: 440px;
          width: 90%;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default FeesList;
