import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getSalaryReceipts, getSalaryReceiptById, downloadAccountsPdf, createSalaryReceipt, getSalaryAnalytics, exportSalaryReceipts, retryEmails, deleteSalaryReceipt } from '../../services/api';

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
import EmailDashboard from './EmailDashboard';
import Employees from './Employees';
import './styling/Accounts.css';
import * as XLSX from 'xlsx';

const SalaryList = () => {
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');

  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'menu';
  const setView = (newView) => {
    if (newView === 'menu') {
      setSearchParams({});
    } else {
      setSearchParams({ view: newView });
    }
  };
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [showBulkSendModal, setShowBulkSendModal] = useState(false);
  const [bulkSendMonth, setBulkSendMonth] = useState('');
  const [bulkSalaries, setBulkSalaries] = useState([]);
  const [bulkSalariesLoading, setBulkSalariesLoading] = useState(false);
  const [selectedBulkSlips, setSelectedBulkSlips] = useState([]);

  useEffect(() => {
    if (bulkSendMonth && showBulkSendModal) {
      const loadMonthSalaries = async () => {
        setBulkSalariesLoading(true);
        try {
          const res = await getSalaryReceipts({ month: bulkSendMonth, limit: 1000 });
          if (res.success && res.data) {
            setBulkSalaries(res.data);
            setSelectedBulkSlips(res.data.map(item => item.id));
          } else {
            setBulkSalaries([]);
            setSelectedBulkSlips([]);
          }
        } catch (err) {
          console.error("Failed to load month salaries:", err);
          setBulkSalaries([]);
          setSelectedBulkSlips([]);
        } finally {
          setBulkSalariesLoading(false);
        }
      };
      loadMonthSalaries();
    } else {
      setBulkSalaries([]);
      setSelectedBulkSlips([]);
    }
  }, [bulkSendMonth, showBulkSendModal]);

  useEffect(() => {
    if (showBulkSendModal && !bulkSendMonth) {
      setBulkSendMonth(dayjs().format('MMMM YYYY'));
    }
  }, [showBulkSendModal]);
  const [importProgress, setImportProgress] = useState({ active: false, current: 0, total: 0, successes: 0, errors: [] });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Analytics state
  const [salaryAnalytics, setSalaryAnalytics] = useState(null);
  const [salaryAnalyticsLoading, setSalaryAnalyticsLoading] = useState(false);
  const [salaryAnalyticsError, setSalaryAnalyticsError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [datePreset, setDatePreset] = useState('today');

  const handleFetchSalaryAnalytics = async (start = startDate, end = endDate) => {
    let targetStart = start;
    let targetEnd = end;
    if (!targetStart && !targetEnd && datePreset) {
      const range = getDateRangeFromPreset(datePreset);
      targetStart = range.start;
      targetEnd = range.end;
      setStartDate(range.start);
      setEndDate(range.end);
    }
    setSalaryAnalyticsLoading(true);
    setSalaryAnalyticsError('');
    try {
      const res = await getSalaryAnalytics({ startDate: targetStart, endDate: targetEnd });
      if (res.success) {
        setSalaryAnalytics(res.data);
      } else {
        setSalaryAnalyticsError(res.message || 'Failed to load analytics.');
      }
    } catch (err) {
      setSalaryAnalyticsError(err.message || 'Connection error.');
    } finally {
      setSalaryAnalyticsLoading(false);
    }
  };

  const [bulkMode, setBulkMode] = useState('send_immediately'); // 'send_immediately', 'generate_only', 'schedule_sending'
  const [bulkScheduledDate, setBulkScheduledDate] = useState('');

  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerSalary, setDrawerSalary] = useState(null);
  const [drawerSalaryLoading, setDrawerSalaryLoading] = useState(false);
  const [deleteConfirmReceipt, setDeleteConfirmReceipt] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleOpenSalaryDrawer = async (salary) => {
    setDrawerSalary(salary);
    setDrawerSalaryLoading(true);
    try {
      const res = await getSalaryReceiptById(salary.id);
      if (res.success && res.data) {
        setDrawerSalary(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch salary slip details:', err);
    } finally {
      setDrawerSalaryLoading(false);
    }
  };

  const handleDeleteReceipt = async (receiptId) => {
    setActionLoading(true);
    try {
      const res = await deleteSalaryReceipt(receiptId);
      if (res.success) {
        setSuccessMessage('Salary slip deleted successfully.');
        setDeleteConfirmReceipt(null);
        fetchSalaries();
      } else {
        alert(res.message || 'Failed to delete salary slip.');
      }
    } catch (err) {
      console.error('Error deleting salary slip:', err);
      alert(err.message || 'Connection error.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (location.state && location.state.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setView('list'); // Redirect directly to the Salary Dashboard list view to display the success banner
      // Clear navigation state to avoid re-triggering on manual refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    let title = 'Salary Slips';
    if (view === 'list') title = 'Salary History';
    else if (view === 'analytics') title = 'Salary Analytics';
    else if (view === 'bulk') title = 'Bulk Salary Upload';
    else if (view === 'email_dashboard') title = 'Salary Email Delivery';
    else if (view === 'employees') title = 'Employee Directory';
    window.dispatchEvent(new CustomEvent('set-route-title', { detail: title }));
  }, [view]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/accounts/salary') {
        setView('menu');
        setBulkFile(null);
        setParsedRows([]);
        setError('');
        setSuccessMessage('');
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);


  const validateRow = (row, mode) => {
    const errors = [];
    if (!row.employee_name || !row.employee_name.trim()) errors.push('Missing Name');
    if (!row.employee_id || !row.employee_id.trim()) errors.push('Missing ID');
    if (row.basic_salary === undefined || isNaN(Number(row.basic_salary)) || Number(row.basic_salary) < 0) errors.push('Invalid Basic Salary');
    if (row.allowances === undefined || isNaN(Number(row.allowances)) || Number(row.allowances) < 0) errors.push('Invalid Allowances');
    if (row.deductions === undefined || isNaN(Number(row.deductions)) || Number(row.deductions) < 0) errors.push('Invalid Deductions');
    if (!row.month || !row.month.trim()) errors.push('Missing Month');
    if (Number(row.basic_salary) + Number(row.allowances) < Number(row.deductions)) {
      errors.push('Net salary cannot be negative');
    }

    const emailVal = row.employee_email || row.email;
    if (emailVal && emailVal.trim()) {
      if (!/\S+@\S+\.\S+/.test(emailVal)) {
        errors.push('Invalid Email');
      }
    }

    if (row.account_no && row.account_no.trim() !== '') {
      const accNo = row.account_no.trim();
      if (!/^\d+$/.test(accNo)) {
        errors.push('Account number must contain digits only');
      } else if (accNo.length < 9 || accNo.length > 18) {
        errors.push('Account number must be 9-18 digits');
      }
    }

    return {
      ...row,
      errors,
      status: errors.length > 0 ? 'invalid' : 'ready'
    };
  };

  const handleCellChange = (rowIdx, field, val) => {
    setParsedRows(prev => {
      return prev.map(row => {
        if (row.key === rowIdx) {
          let updatedValue = val;
          if (['basic_salary', 'allowances', 'deductions'].includes(field)) {
            updatedValue = val === '' ? 0 : Math.max(0, Number(val));
          }
          const nextRow = { ...row, [field]: updatedValue };
          if (field === 'employee_email') {
            nextRow.email = updatedValue;
          }
          return validateRow(nextRow, bulkMode);
        }
        return row;
      });
    });
  };

  const handleBulkModeChange = (mode) => {
    setBulkMode(mode);
    setParsedRows(prev => prev.map(row => validateRow(row, mode)));
  };

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  const downloadTemplate = () => {
    const data = [
      {
        'Employee Name': 'John Doe',
        'Employee ID': 'EMP1001',
        'Designation': 'Teacher',
        'Employee Email': 'john.doe@example.com',
        'Bank Name': 'State Bank of India',
        'Branch Name': 'Koramangala',
        'Account Number': '123456789012',
        'Basic Salary': 50000,
        'Allowances': 5000,
        'Deductions': 2000,
        'Month': 'June 2026',
        'Remarks': 'Regular payroll'
      },
      {
        'Employee Name': 'Jane Smith',
        'Employee ID': 'EMP1002',
        'Designation': 'Clerk',
        'Employee Email': 'jane.smith@example.com',
        'Bank Name': 'HDFC Bank',
        'Branch Name': 'Indiranagar',
        'Account Number': '987654321098',
        'Basic Salary': 45000,
        'Allowances': 4000,
        'Deductions': 1500,
        'Month': 'June 2026',
        'Remarks': 'Regular payroll'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary Template');
    XLSX.writeFile(workbook, 'Salary_Bulk_Import_Template.xlsx');
  };

  const processFile = (file) => {
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const mapped = rows.map((row, idx) => {
          const findKey = (names) => {
            const found = Object.keys(row).find(k =>
              names.some(nameVal => k.toLowerCase().trim().replace(/[\s_-]/g, '') === nameVal.toLowerCase().replace(/[\s_-]/g, ''))
            );
            return found ? row[found] : undefined;
          };

          const name = findKey(['Employee Name', 'EmployeeName', 'Name', 'Staff Name', 'employee_name', 'staff_name']);
          const id = findKey(['Employee ID', 'EmployeeID', 'ID', 'Staff ID', 'employee_id', 'staff_id']);
          const desig = findKey(['Designation', 'designation', 'Role', 'role']);
          const bname = findKey(['Bank Name', 'BankName', 'Bank', 'bank_name', 'bank']);
          const brname = findKey(['Branch Name', 'BranchName', 'Branch', 'branch_name', 'branch']);
          const accno = findKey(['Account Number', 'AccountNumber', 'Account No', 'AccountNo', 'account_no', 'account_number', 'account']);
          const basic = findKey(['Basic Salary', 'BasicSalary', 'Basic', 'basic_salary', 'basic']);
          const allow = findKey(['Allowances', 'Allowance', 'allowances', 'allowance']);
          const deduct = findKey(['Deductions', 'Deduction', 'deductions', 'deduction']);
          const mnth = findKey(['Month', 'month']);
          const rem = findKey(['Remarks', 'Remark', 'remarks', 'remark']);
          const emailVal = findKey(['Employee Email', 'Email', 'EmployeeEmail', 'Mail', 'Mail ID', 'Email ID', 'employee_email', 'email_id']);

          const initialRow = {
            key: idx,
            employee_name: name || '',
            employee_id: String(id || ''),
            designation: desig || '',
            bank_name: bname || '',
            branch_name: brname || '',
            account_no: accno || '',
            basic_salary: Number(basic || 0),
            allowances: Number(allow || 0),
            deductions: Number(deduct || 0),
            month: String(mnth || ''),
            remarks: rem || '',
            employee_email: emailVal || '',
            email: emailVal || ''
          };

          return validateRow(initialRow, bulkMode);
        });

        setParsedRows(mapped);
      } catch (err) {
        console.error('Error reading excel:', err);
        alert('Failed to parse Excel file. Please ensure it is a valid Excel spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        processFile(file);
      } else {
        alert('Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      }
    }
  };

  const handleImportSalaries = async () => {
    const readyRows = parsedRows.filter(r => r.status === 'ready');
    if (readyRows.length === 0) return;

    setImportProgress({
      active: true,
      current: 0,
      total: readyRows.length,
      successes: 0,
      errors: []
    });

    let currentCount = 0;
    let successCount = 0;
    const errorsList = [];

    for (const row of readyRows) {
      try {
        const emailVal = (row.employee_email || row.email || '').trim();
        const hasEmail = !!emailVal;

        const payload = {
          employee_name: row.employee_name,
          employee_id: row.employee_id,
          designation: row.designation || '',
          bank_name: row.bank_name || '',
          branch_name: row.branch_name || '',
          account_no: row.account_no || '',
          basic_salary: row.basic_salary,
          allowances: row.allowances,
          deductions: row.deductions,
          month: row.month,
          remarks: row.remarks,
          employee_email: (bulkMode === 'generate_only' || !hasEmail) ? '' : emailVal,
          email: (bulkMode === 'generate_only' || !hasEmail) ? '' : emailVal,
          generate_without_email: bulkMode === 'generate_only' || !hasEmail,
          email_status: (bulkMode === 'generate_only' || !hasEmail) ? 'PENDING' : 'QUEUED',
          scheduled_send_at: (bulkMode === 'schedule_sending' && bulkScheduledDate && hasEmail)
            ? dayjs(bulkScheduledDate).format('YYYY-MM-DD HH:mm:ss')
            : null
        };

        const res = await createSalaryReceipt(payload);
        if (res.success) {
          successCount++;
        } else {
          errorsList.push({ name: row.employee_name, message: res.message || 'Server error' });
        }
      } catch (err) {
        errorsList.push({ name: row.employee_name, message: err.message || 'Connection error' });
      }

      currentCount++;
      setImportProgress(prev => ({
        ...prev,
        current: currentCount,
        successes: successCount,
        errors: errorsList
      }));
    }

    setTimeout(() => {
      alert(`Bulk upload complete!\nImported: ${successCount} successfully.\nFailed: ${errorsList.length} rows.`);
      setBulkFile(null);
      setParsedRows([]);
      setImportProgress({ active: false, current: 0, total: 0, successes: 0, errors: [] });
      setView('list');
      fetchSalaries();
    }, 800);
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getSalaryReceipts({
        search,
        month,
        startDate,
        endDate,
        paymentMode,
        page,
        limit
      });
      if (res.success) {
        setSalaries(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
          setTotalItems(res.pagination.total || 0);
        }
      } else {
        setError(res.message || 'Failed to fetch salary slips.');
      }
    } catch (err) {
      console.error('Error fetching salaries:', err);
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
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
      fetchSalaries();
    }, 50);
  };

  const handleExportSalaries = async (format) => {
    try {
      setLoading(true);
      await exportSalaryReceipts({
        search,
        month,
        startDate,
        endDate,
        paymentMode
      }, format);
    } catch (err) {
      console.error(err);
      alert('Failed to export salaries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'analytics') {
      handleFetchSalaryAnalytics(startDate, endDate);
    }
  }, [startDate, endDate, view]);

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
    fetchSalaries();
  }, [page, limit, search, month, startDate, endDate, paymentMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSalaries();
  };

  const handleClearFilters = () => {
    setSearch('');
    setMonth('');
    setStartDate('');
    setEndDate('');
    setPaymentMode('');
    setDatePreset('');
    setPage(1);
    setTimeout(() => {
      fetchSalaries();
    }, 50);
  };

  const handleDownloadPdf = async (id, receiptNo) => {
    try {
      await downloadAccountsPdf(`/accounts/salary/${id}/pdf`, `${receiptNo}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF: ' + err.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (view === 'email_dashboard') {
    return <EmailDashboard onBack={() => setView('menu')} />;
  }

  if (view === 'analytics') {
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

    const modeConfig = [
      { key: 'Cash', label: 'Cash', icon: '💵' },
      { key: 'UPI', label: 'UPI', icon: '📱' },
      { key: 'Bank Transfer', label: 'Bank Transfer', icon: '🏦' },
      { key: 'Card Payment', label: 'Card Payment', icon: '💳' },
      { key: 'Cheque Payment', label: 'Cheque', icon: '📝' }
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
            background: var(--primary-25) !important;
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
                  handleFetchSalaryAnalytics(range.start, range.end);
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
                  handleFetchSalaryAnalytics(e.target.value, endDate);
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
                  handleFetchSalaryAnalytics(startDate, e.target.value);
                }}
              />
            </div>
          </div>

          {/* Export button */}
          <div className="action-btns-group">
            <button
              type="button"
              onClick={() => handleExportSalaries('excel')}
              className="export-excel-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export Excel
            </button>
          </div>
        </section>

        {salaryAnalyticsError && (
          <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {salaryAnalyticsError}
          </div>
        )}

        {salaryAnalyticsLoading ? (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[1, 2].map(i => (
                <div key={i} style={{ flex: '1 1 200px', height: '100px', background: 'var(--neutral-100)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '50%', height: '16px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                  <div style={{ width: '70%', height: '32px', background: 'var(--neutral-200)', borderRadius: '4px' }} className="skeleton-pulse"></div>
                </div>
              ))}
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
        ) : !salaryAnalytics || salaryAnalytics.totalSlips === 0 ? (
          <div className="accounts-empty-state" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--neutral-300)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 'var(--font-md)', fontWeight: 600 }}>No Payroll Data</h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>No salary slips found for selected period.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <section className="accounts-stats-row" style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="accounts-stat-card" onClick={() => handleDrillDown('', startDate, endDate)} style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}>
                <div className="accounts-stat-card__icon accounts-stat-card__icon--salary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="4"></line>
                    <line x1="8" y1="2" x2="8" y2="4"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="accounts-stat-card__info">
                  <span className="accounts-stat-card__label">Salary Slips Generated</span>
                  <span className="accounts-stat-card__value">{(salaryAnalytics.totalSlips || 0).toLocaleString('en-IN')}</span>
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
                  <span className="accounts-stat-card__label">Total Salary Paid</span>
                  <span className="accounts-stat-card__value">{formatCurrency(salaryAnalytics.totalSalaryPaid)}</span>
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
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '4px' }}>
                      {formatCurrency(salaryAnalytics.byMode?.[key]?.amount || 0)}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      Slips: {(salaryAnalytics.byMode?.[key]?.count || 0).toLocaleString('en-IN')}
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

  if (view === 'menu') {
    return (
      <div className="accounts-container">
        {successMessage && (
          <div style={{
            backgroundColor: 'var(--success-50)',
            color: 'var(--success-700)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontWeight: 600,
            fontSize: '14px',
            border: '1px solid var(--success-200)',
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="login-card__error" role="alert" style={{ marginBottom: '24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        <div className="accounts-menu-grid">
          <div className="accounts-menu-card" onClick={() => setView('bulk')}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Bulk Upload (Excel)</h3>
            <p className="accounts-menu-card__description">Generate multiple receipts from an Excel workbook.</p>
          </div>

          <Link to="/admin/accounts/salary/new" className="accounts-menu-card">
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Create Salary Receipt</h3>
            <p className="accounts-menu-card__description">Enter details manually for a single salary receipt.</p>
          </Link>

          <div className="accounts-menu-card" onClick={() => setView('list')}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Salary History</h3>
            <p className="accounts-menu-card__description">Browse and download staff payroll history.</p>
          </div>

          <div className="accounts-menu-card" onClick={() => { setView('analytics'); handleFetchSalaryAnalytics(); }}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Salary Analytics</h3>
            <p className="accounts-menu-card__description">View monthly, yearly salary totals and payment mode breakdown.</p>
          </div>

          <div className="accounts-menu-card" onClick={() => setView('email_dashboard')}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Email Dashboard</h3>
            <p className="accounts-menu-card__description">Monitor queue and delivery status of salary slips.</p>
          </div>

          <div className="accounts-menu-card" onClick={() => setView('employees')}>
            <div className="accounts-menu-card__icon-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="accounts-menu-card__title">Manage Employees</h3>
            <p className="accounts-menu-card__description">Add, edit, or search employee database details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'employees') {
    return <Employees onBack={() => setView('menu')} />;
  }

  if (view === 'bulk') {
    return (
      <div className="accounts-container">
        <div className="accounts-list-header" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => { setView('menu'); setBulkFile(null); setParsedRows([]); }}
            className="accounts-btn accounts-btn--secondary"
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Back to Menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        </div>

        <div className="accounts-form-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-md)', fontWeight: 700 }}>Excel Upload Panel</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleExcelUpload}
            />
            {bulkFile ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-300)',
                  borderRadius: '8px',
                  maxWidth: '420px',
                  width: '100%',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    backgroundColor: 'var(--success-50)',
                    color: 'var(--success-600)',
                    padding: '8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={bulkFile.name}>
                      {bulkFile.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {(bulkFile.size / 1024).toFixed(1)} KB • {parsedRows.length} rows parsed
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBulkFile(null);
                    setParsedRows([]);
                    const input = document.getElementById('excel-file-input');
                    if (input) input.value = '';
                  }}
                  className="accounts-btn accounts-btn--secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Remove
                </button>
              </div>
            ) : (
              <div
                className="settings-upload-box"
                style={{
                  minHeight: '100px',
                  maxWidth: '420px',
                  width: '100%',
                  cursor: 'pointer',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: (isDragging || isHovered) ? '2px dashed var(--primary-500)' : '2px dashed var(--neutral-300)',
                  borderRadius: '12px',
                  backgroundColor: (isDragging || isHovered) ? 'var(--primary-50)' : 'var(--neutral-50)',
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => document.getElementById('excel-file-input').click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <div style={{
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                  Drag & drop your Excel sheet here or <span style={{ color: 'var(--primary-600)', textDecoration: 'underline' }}>browse</span>
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', textAlign: 'center' }}>
                  Supports .xlsx, .xls, and .csv
                </span>
              </div>
            )}
          </div>

          {importProgress.active && (
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--neutral-50)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 700, marginBottom: '8px' }}>
                <span>Importing Salaries...</span>
                <span>{importProgress.current} / {importProgress.total}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--neutral-200)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: `${(importProgress.current / importProgress.total) * 100}%`, height: '100%', background: 'var(--primary-500)', transition: 'width 0.2s ease' }} />
              </div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                Successes: {importProgress.successes} | Errors: {importProgress.errors.length}
              </span>
            </div>
          )}

          {parsedRows.length > 0 && !importProgress.active && (
            <div style={{ marginTop: '24px' }}>
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: 'var(--neutral-50)',
                borderRadius: '12px',
                border: '1px solid var(--neutral-200)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h5 style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Email Dispatch Controls</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="bulkMode"
                      value="send_immediately"
                      checked={bulkMode === 'send_immediately'}
                      onChange={() => handleBulkModeChange('send_immediately')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Send Immediately
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="bulkMode"
                      value="generate_only"
                      checked={bulkMode === 'generate_only'}
                      onChange={() => handleBulkModeChange('generate_only')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Generate Only (Bypass email dispatch)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                    <input
                      type="radio"
                      name="bulkMode"
                      value="schedule_sending"
                      checked={bulkMode === 'schedule_sending'}
                      onChange={() => handleBulkModeChange('schedule_sending')}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Schedule Email Sending
                  </label>

                  {bulkMode === 'schedule_sending' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="datetime-local"
                        value={bulkScheduledDate}
                        onChange={(e) => setBulkScheduledDate(e.target.value)}
                        className="accounts-form-input"
                        style={{ padding: '4px 8px', fontSize: '12px', width: '180px' }}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Parsed Records ({parsedRows.length})</h4>
                <button
                  type="button"
                  onClick={handleImportSalaries}
                  disabled={parsedRows.filter(r => r.status === 'ready').length === 0}
                  className="accounts-btn accounts-btn--primary"
                >
                  Import {parsedRows.filter(r => r.status === 'ready').length} Valid Slips
                </button>
              </div>

              <div className="accounts-table-card" style={{ maxHeight: '450px', overflow: 'auto' }}>
                <table className="accounts-table">
                  <thead>
                    <tr>
                      <th>Staff Name</th>
                      <th>Staff ID</th>
                      <th>Designation</th>
                      <th>Email Address</th>
                      <th>Bank Name</th>
                      <th>Branch Name</th>
                      <th>Account No</th>
                      <th>Month</th>
                      <th style={{ textAlign: 'right' }}>Basic</th>
                      <th style={{ textAlign: 'right' }}>Allowances</th>
                      <th style={{ textAlign: 'right' }}>Deductions</th>
                      <th style={{ textAlign: 'right' }}>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.key} style={{ opacity: row.status === 'invalid' ? 0.9 : 1, backgroundColor: row.status === 'invalid' ? '#fff1f2' : 'transparent' }}>
                        <td>
                          <input
                            type="text"
                            value={row.employee_name}
                            onChange={(e) => handleCellChange(row.key, 'employee_name', e.target.value)}
                            style={{
                              border: !row.employee_name.trim() ? '1.5px solid var(--danger-500)' : '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '120px',
                              fontWeight: 600
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.employee_id}
                            onChange={(e) => handleCellChange(row.key, 'employee_id', e.target.value)}
                            style={{
                              border: !row.employee_id.trim() ? '1.5px solid var(--danger-500)' : '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '90px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.designation || ''}
                            onChange={(e) => handleCellChange(row.key, 'designation', e.target.value)}
                            placeholder="Optional"
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '100px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={row.employee_email}
                            onChange={(e) => handleCellChange(row.key, 'employee_email', e.target.value)}
                            placeholder={bulkMode === 'generate_only' ? 'Optional' : 'Required'}
                            required={bulkMode !== 'generate_only'}
                            disabled={bulkMode === 'generate_only'}
                            style={{
                              border: (bulkMode !== 'generate_only' && (!row.employee_email || !/\S+@\S+\.\S+/.test(row.employee_email))) ? '1.5px solid var(--danger-500)' : '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '150px',
                              backgroundColor: bulkMode === 'generate_only' ? 'var(--neutral-100)' : 'transparent'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.bank_name || ''}
                            onChange={(e) => handleCellChange(row.key, 'bank_name', e.target.value)}
                            placeholder="Optional"
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '100px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.branch_name || ''}
                            onChange={(e) => handleCellChange(row.key, 'branch_name', e.target.value)}
                            placeholder="Optional"
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '100px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.account_no || ''}
                            onChange={(e) => handleCellChange(row.key, 'account_no', e.target.value)}
                            placeholder="Optional"
                            style={{
                              border: (row.account_no && (!/^\d+$/.test(row.account_no.trim()) || row.account_no.trim().length < 9 || row.account_no.trim().length > 18)) ? '1.5px solid var(--danger-500)' : '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '110px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={row.month}
                            onChange={(e) => handleCellChange(row.key, 'month', e.target.value)}
                            style={{
                              border: !row.month.trim() ? '1.5px solid var(--danger-500)' : '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '90px'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.basic_salary}
                            onChange={(e) => handleCellChange(row.key, 'basic_salary', e.target.value)}
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '80px',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.allowances}
                            onChange={(e) => handleCellChange(row.key, 'allowances', e.target.value)}
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '80px',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={row.deductions}
                            onChange={(e) => handleCellChange(row.key, 'deductions', e.target.value)}
                            style={{
                              border: '1px dashed #cbd5e1',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              width: '80px',
                              textAlign: 'right'
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 700, textAlign: 'right', verticalAlign: 'middle' }}>
                          {formatCurrency(Number(row.basic_salary) + Number(row.allowances) - Number(row.deductions))}
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          {row.status === 'ready' ? (
                            <span style={{ color: 'var(--success-600)', fontWeight: 600, fontSize: 'var(--font-xs)' }}>Ready</span>
                          ) : (
                            <span
                              style={{ color: 'var(--danger-600)', fontWeight: 600, fontSize: 'var(--font-xs)', cursor: 'help' }}
                              title={row.errors.join(', ')}
                            >
                              Invalid ({row.errors.length})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setBulkFile(null); setParsedRows([]); setView('menu'); }}
              className="accounts-btn accounts-btn--secondary"
            >
              Cancel
            </button>
          </div>
        </div>
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
            placeholder="Search employee or receipt..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-dropdown-v2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <input
            type="text"
            placeholder="Month e.g. June 2026"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setPage(1); }}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0 16px 0 44px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#334155',
              outline: 'none',
              width: '100%',
              height: '100%'
            }}
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
            onClick={() => handleExportSalaries('excel')}
            className="export-excel-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowBulkSendModal(true);
            }}
            className="accounts-btn accounts-btn--secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', borderRadius: '12px', whiteSpace: 'nowrap' }}
          >
            ✉ Bulk Send
          </button>
          <button
            type="button"
            onClick={() => setView('email_dashboard')}
            className="accounts-btn accounts-btn--secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', borderRadius: '12px', whiteSpace: 'nowrap' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Email Dashboard
          </button>
          <Link to="/admin/accounts/salary/new" className="accounts-btn accounts-btn--primary" style={{ height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
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

      {successMessage && (
        <div style={{
          backgroundColor: 'var(--success-50)',
          color: 'var(--success-700)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          fontWeight: 600,
          fontSize: '14px',
          border: '1px solid var(--success-200)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {successMessage}
        </div>
      )}

      {/* Salary Table */}
      <div className="accounts-table-card">
        {loading ? (
          <div style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div className="login-card__spinner" style={{ width: '32px', height: '32px', borderLeftColor: 'var(--primary-500)' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading salary slips...</p>
          </div>
        ) : (
          <>
            <table className="accounts-table">
              <thead>
                <tr>
                  <th>Slip No</th>
                  <th>Employee Name</th>
                  <th>Month</th>
                  <th>Payment Mode</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.length > 0 ? (
                  salaries.map((sal) => {
                    let formattedMode = sal.payment_mode || 'Cash';
                    if (formattedMode === 'Bank') formattedMode = 'Bank Transfer';
                    else if (formattedMode === 'Card') formattedMode = 'Card Payment';
                    else if (formattedMode === 'Cheque') formattedMode = 'Cheque Payment';

                    const badgeStyle = (() => {
                      const base = {
                        display: 'inline-block',
                        fontWeight: '800',
                        fontSize: '11px',
                        padding: '4px 10px',
                        border: '1px solid',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        textAlign: 'center'
                      };
                      const status = sal.email_status || 'PENDING';
                      if (status === 'SENT') return { ...base, backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' };
                      if (status === 'FAILED') return { ...base, backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' };
                      if (status === 'QUEUED' || status === 'PROCESSING') return { ...base, backgroundColor: '#eff6ff', color: '#2563eb', borderColor: '#dbeafe' };
                      return { ...base, backgroundColor: '#f3f4f6', color: '#4b5563', borderColor: '#e5e7eb' };
                    })();

                    return (
                      <tr key={sal.id}>
                        <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{sal.receipt_no}</td>
                        <td style={{ fontWeight: 500 }}>{sal.employee_name}</td>
                        <td>{sal.month}</td>
                        <td>{formattedMode}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(sal.net_salary)}</td>
                        <td>
                          <span style={badgeStyle}>
                            {sal.email_status || 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group-v2" style={{ justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenSalaryDrawer(sal)}
                              className="action-btn-v2 edit"
                              title="View Details"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            </button>

                            <Link
                              to={`/admin/accounts/salary/edit/${sal.id}`}
                              className="action-btn-v2 edit"
                              title="Edit Receipt"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </Link>

                            {isSuperAdmin && (
                              <button
                                onClick={() => setDeleteConfirmReceipt(sal)}
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No salary slips found for selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="table-footer-v2">
                <div className="showing-entries-group-v2">
                  <span className="showing-entries-v2">
                    Showing {salaries.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalItems)} of {totalItems} entries
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

      {/* Salary Slip Detail side drawer */}
      {drawerSalary && (
        <div className="delivery-log-drawer-overlay" onClick={() => setDrawerSalary(null)}>
          <div className="delivery-log-drawer" style={{ width: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-600)', letterSpacing: '0.05em' }}>Salary Slip Details</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '17px', fontWeight: 800 }}>{drawerSalary.receipt_no}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => handleDownloadPdf(drawerSalary.id, drawerSalary.receipt_no)}
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
                <button className="close-btn" style={{ fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setDrawerSalary(null)}>✕</button>
              </div>
            </div>
            <div className="drawer-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Employee Information */}
              <div style={{ backgroundColor: 'var(--neutral-50)', padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Information</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Employee Name</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.employee_name}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Employee ID</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.employee_id || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Designation</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.designation || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>PAN Number</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.pan_no || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Month</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.month || '-'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block' }}>Slip Date</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{drawerSalary.created_at ? dayjs(drawerSalary.created_at).format('DD MMM YYYY') : '-'}</strong>
                  </div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    let dynamicValues = null;
                    if (drawerSalary.dynamic_values) {
                      try {
                        dynamicValues = typeof drawerSalary.dynamic_values === 'string' ? JSON.parse(drawerSalary.dynamic_values) : drawerSalary.dynamic_values;
                      } catch (e) { }
                    }
                    if (!dynamicValues) dynamicValues = {};

                    let snapshot = null;
                    if (drawerSalary.template_snapshot) {
                      try {
                        snapshot = typeof drawerSalary.template_snapshot === 'string' ? JSON.parse(drawerSalary.template_snapshot) : drawerSalary.template_snapshot;
                      } catch (e) { }
                    }

                    function getFieldCategory(fieldName) {
                      if (snapshot && snapshot.template && snapshot.template.fields) {
                        const field = snapshot.template.fields.find(f => f.field_name === fieldName);
                        if (field && field.field_category) {
                          return field.field_category; // 'earning' or 'deduction'
                        }
                      }
                      const earningsKeywords = ['salary', 'hra', 'da', 'bonus', 'incentive', 'allowance', 'earning', 'commission', 'basic'];
                      const deductionKeywords = ['pf', 'esi', 'tax', 'deduction', 'loan', 'professional', 'penalty'];
                      const lower = fieldName.toLowerCase();
                      if (deductionKeywords.some(k => lower.includes(k))) return 'deduction';
                      if (earningsKeywords.some(k => lower.includes(k))) return 'earning';
                      return 'earning';
                    }

                    const getVal = (key) => {
                      if (dynamicValues[key] !== undefined) return Number(dynamicValues[key]);
                      const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                      if (dynamicValues[camel] !== undefined) return Number(dynamicValues[camel]);
                      if (drawerSalary[key] !== undefined) return Number(drawerSalary[key]);
                      return 0;
                    };

                    const stdEarningsList = [
                      { label: 'Basic Salary', val: getVal('basic_salary') },
                      { label: 'HRA', val: getVal('hra') },
                      { label: 'DA', val: getVal('da') },
                      { label: 'Bonus', val: getVal('bonus') },
                      { label: 'Incentives', val: getVal('incentives') },
                      { label: 'Travel Allowance', val: getVal('travel_allowance') },
                      { label: 'Special Allowance', val: getVal('special_allowance') }
                    ];

                    const activeStdEarnings = stdEarningsList.filter(f => f.val > 0);

                    const standardKeys = [
                      'basic_salary', 'hra', 'da', 'bonus', 'incentives', 'travel_allowance', 'special_allowance',
                      'basicsalary', 'hra', 'da', 'bonus', 'incentives', 'travelallowance', 'specialallowance'
                    ];

                    const customEarnings = Object.keys(dynamicValues)
                      .filter(k => !standardKeys.includes(k.toLowerCase().replace(/_/g, '')))
                      .filter(k => getFieldCategory(k) === 'earning')
                      .map(k => ({ label: toTitleCase(k), val: Number(dynamicValues[k] || 0) }))
                      .filter(f => f.val > 0);

                    const allEarnings = [...activeStdEarnings, ...customEarnings];

                    if (allEarnings.length === 0) {
                      return <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No earnings details recorded.</span>;
                    }

                    return allEarnings.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed var(--neutral-100)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                        <strong style={{ color: '#16a34a' }}>+{formatCurrency(f.val)}</strong>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div style={{ padding: '14px', borderRadius: '10px', border: '1px solid var(--neutral-200)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    let dynamicValues = null;
                    if (drawerSalary.dynamic_values) {
                      try {
                        dynamicValues = typeof drawerSalary.dynamic_values === 'string' ? JSON.parse(drawerSalary.dynamic_values) : drawerSalary.dynamic_values;
                      } catch (e) { }
                    }
                    if (!dynamicValues) dynamicValues = {};

                    let snapshot = null;
                    if (drawerSalary.template_snapshot) {
                      try {
                        snapshot = typeof drawerSalary.template_snapshot === 'string' ? JSON.parse(drawerSalary.template_snapshot) : drawerSalary.template_snapshot;
                      } catch (e) { }
                    }

                    function getFieldCategory(fieldName) {
                      if (snapshot && snapshot.template && snapshot.template.fields) {
                        const field = snapshot.template.fields.find(f => f.field_name === fieldName);
                        if (field && field.field_category) {
                          return field.field_category; // 'earning' or 'deduction'
                        }
                      }
                      const earningsKeywords = ['salary', 'hra', 'da', 'bonus', 'incentive', 'allowance', 'earning', 'commission', 'basic'];
                      const deductionKeywords = ['pf', 'esi', 'tax', 'deduction', 'loan', 'professional', 'penalty'];
                      const lower = fieldName.toLowerCase();
                      if (deductionKeywords.some(k => lower.includes(k))) return 'deduction';
                      if (earningsKeywords.some(k => lower.includes(k))) return 'earning';
                      return 'earning';
                    }

                    const getVal = (key) => {
                      if (dynamicValues[key] !== undefined) return Number(dynamicValues[key]);
                      const camel = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
                      if (dynamicValues[camel] !== undefined) return Number(dynamicValues[camel]);
                      if (drawerSalary[key] !== undefined) return Number(drawerSalary[key]);
                      return 0;
                    };

                    const stdDeductionsList = [
                      { label: 'PF', val: getVal('pf') },
                      { label: 'ESI', val: getVal('esi') },
                      { label: 'Tax', val: getVal('tax') },
                      { label: 'Professional Tax', val: getVal('professional_tax') },
                      { label: 'Loan Deduction', val: getVal('loan_deduction') }
                    ];

                    const activeStdDeductions = stdDeductionsList.filter(f => f.val > 0);

                    const standardKeys = [
                      'pf', 'esi', 'tax', 'professional_tax', 'loan_deduction',
                      'pf', 'esi', 'tax', 'professionaltax', 'loandeduction'
                    ];

                    const customDeductions = Object.keys(dynamicValues)
                      .filter(k => !standardKeys.includes(k.toLowerCase().replace(/_/g, '')))
                      .filter(k => getFieldCategory(k) === 'deduction')
                      .map(k => ({ label: toTitleCase(k), val: Number(dynamicValues[k] || 0) }))
                      .filter(f => f.val > 0);

                    const allDeductions = [...activeStdDeductions, ...customDeductions];

                    if (allDeductions.length === 0) {
                      return <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No deductions recorded.</span>;
                    }

                    return allDeductions.map((f, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed var(--neutral-100)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                        <strong style={{ color: '#dc2626' }}>-{formatCurrency(f.val)}</strong>
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
                  if (drawerSalary.payment_details) {
                    try {
                      paymentDetails = typeof drawerSalary.payment_details === 'string' ? JSON.parse(drawerSalary.payment_details) : drawerSalary.payment_details;
                    } catch (e) { }
                  }
                  if (!paymentDetails) paymentDetails = {};
                  const mode = drawerSalary.payment_mode || 'Cash';

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
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.transactionId || drawerSalary.payment_reference || '-'}</strong>
                          </div>
                        </>
                      )}

                      {(mode === 'Bank' || mode === 'Bank Transfer') && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Bank Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.bankName || drawerSalary.bank_name || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Branch Name</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.branchName || drawerSalary.branch_name || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Account Number</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.accountNo || drawerSalary.account_no || '-'}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>IFSC</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.ifscCode || '-'}</strong>
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

                      {(mode === 'Card' || mode === 'Card Payment') && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Transaction ID</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{paymentDetails.transactionId || drawerSalary.payment_reference || '-'}</strong>
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
                    <span style={{ color: 'var(--text-secondary)' }}>Gross Salary</span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {formatCurrency(Number(drawerSalary.basic_salary || 0) + Number(drawerSalary.allowances || 0))}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Deductions</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(drawerSalary.deductions || 0))}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Net Salary</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{formatCurrency(drawerSalary.net_salary)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Email Delivery</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{drawerSalary.email_status || 'PENDING'}</strong>
                  </div>
                  {drawerSalary.email_sent_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email Sent Date</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{dayjs(drawerSalary.email_sent_at).format('DD MMM YYYY hh:mm A')}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Slip Created Date</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{dayjs(drawerSalary.created_at).format('DD MMM YYYY hh:mm A')}</strong>
                  </div>
                </div>
              </div>

              {/* Drawer Quick Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                <button
                  onClick={async () => {
                    if (!drawerSalary.employee_email && !drawerSalary.email) {
                      alert("Employee email address is not configured for this record.");
                      return;
                    }
                    try {
                      const res = await retryEmails({ id: drawerSalary.id });
                      if (res.success) {
                        alert("Salary slip email queued successfully!");
                        handleOpenSalaryDrawer(drawerSalary);
                      } else {
                        alert(res.message || "Failed to queue salary slip email.");
                      }
                    } catch (err) {
                      alert(err.message || "Connection error triggering email.");
                    }
                  }}
                  className="accounts-btn accounts-btn--secondary"
                  style={{ flex: 1, padding: '10px', borderColor: 'var(--primary-300)', color: 'var(--primary-600)' }}
                >
                  {drawerSalary.email_status === 'SENT' ? 'Resend Email' : 'Send Salary Slip'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bulk Send Salary Slips Modal */}
      {showBulkSendModal && (
        <div className="delivery-log-drawer-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="accounts-form-card" style={{ maxWidth: '650px', width: '90%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative', boxShadow: 'var(--shadow-xl)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>Bulk Send Salary Slips</h3>
              <button
                type="button"
                className="close-btn"
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--text-secondary)' }}
                onClick={() => { setShowBulkSendModal(false); setBulkSendMonth(''); }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label" style={{ fontWeight: 700 }}>Select Payroll Month *</label>
                <select
                  value={bulkSendMonth}
                  onChange={(e) => setBulkSendMonth(e.target.value)}
                  className="accounts-form-select"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--neutral-300)' }}
                >
                  <option value="">-- Choose Month --</option>
                  {(() => {
                    const dropdownMonths = [];
                    for (let i = 0; i < 12; i++) {
                      dropdownMonths.push(dayjs().subtract(i, 'month').format('MMMM YYYY'));
                    }
                    return dropdownMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ));
                  })()}
                </select>
              </div>

              {bulkSendMonth && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Employees List ({bulkSalaries.length})
                    </span>
                    {bulkSalaries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBulkSlips.length === bulkSalaries.length) {
                            setSelectedBulkSlips([]);
                          } else {
                            setSelectedBulkSlips(bulkSalaries.map(item => item.id));
                          }
                        }}
                        className="accounts-btn accounts-btn--secondary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        {selectedBulkSlips.length === bulkSalaries.length ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  {bulkSalariesLoading ? (
                    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="login-card__spinner" style={{ width: '24px', height: '24px', borderLeftColor: 'var(--primary-500)' }}></div>
                      <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>Loading employees for {bulkSendMonth}...</p>
                    </div>
                  ) : bulkSalaries.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', background: 'var(--neutral-50)', borderRadius: '8px', border: '1px dashed var(--neutral-300)' }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                        No payroll records found for {bulkSendMonth}.
                      </p>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--neutral-200)', borderRadius: '8px', overflow: 'hidden', maxHeight: '250px', overflowY: 'auto' }}>
                      <table className="accounts-table" style={{ margin: 0 }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--neutral-50)' }}>
                            <th style={{ width: '40px', textAlign: 'center' }}></th>
                            <th>Employee Name</th>
                            <th>Employee ID</th>
                            <th>Email Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkSalaries.map((item) => {
                            const isSelected = selectedBulkSlips.includes(item.id);
                            return (
                              <tr key={item.id} style={{ backgroundColor: isSelected ? 'var(--primary-25)' : 'transparent' }}>
                                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedBulkSlips(selectedBulkSlips.filter(id => id !== item.id));
                                      } else {
                                        setSelectedBulkSlips([...selectedBulkSlips, item.id]);
                                      }
                                    }}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  />
                                </td>
                                <td style={{ fontWeight: 600 }}>{item.employee_name}</td>
                                <td>{item.employee_id || '-'}</td>
                                <td>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    color: item.email_status === 'SENT' ? 'var(--success-600)' : item.email_status === 'FAILED' ? 'var(--danger-600)' : 'var(--text-secondary)'
                                  }}>
                                    {item.email_status || 'PENDING'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: '16px', marginTop: '16px' }}>
              <button
                type="button"
                className="accounts-btn accounts-btn--secondary"
                onClick={() => { setShowBulkSendModal(false); setBulkSendMonth(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="accounts-btn accounts-btn--primary"
                disabled={selectedBulkSlips.length === 0 || bulkSalariesLoading}
                onClick={async () => {
                  try {
                    const res = await retryEmails({ ids: selectedBulkSlips });
                    if (res.success) {
                      alert(`Successfully enqueued ${selectedBulkSlips.length} salary slip emails!`);
                      setShowBulkSendModal(false);
                      setBulkSendMonth('');
                      fetchSalaries();
                    } else {
                      alert(res.message || "Failed to trigger bulk send.");
                    }
                  } catch (err) {
                    alert(err.message || "Connection error during bulk send.");
                  }
                }}
              >
                Send Bulk Emails ({selectedBulkSlips.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmReceipt && (
        <div className="delivery-log-drawer-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="accounts-form-card" style={{ maxWidth: '450px', width: '90%', padding: '24px', boxShadow: 'var(--shadow-xl)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>Confirm Deletion</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete the salary slip for <strong>{deleteConfirmReceipt.employee_name}</strong> ({deleteConfirmReceipt.month})?<br />
              This action cannot be undone and will delete the associated records.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="accounts-btn accounts-btn--secondary"
                disabled={actionLoading}
                onClick={() => setDeleteConfirmReceipt(null)}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="accounts-btn"
                disabled={actionLoading}
                onClick={() => handleDeleteReceipt(deleteConfirmReceipt.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalaryList;
