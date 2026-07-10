import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  createSalaryReceipt, 
  previewSalaryReceipt, 
  getSalaryReceiptById, 
  updateSalaryReceipt,
  getActiveTemplate,
  getAccountsSettings,
  getAccountsEmployees
} from '../../services/api';
import './styling/Accounts.css';

const convertNumberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numVal = Math.floor(Number(num));
  if (numVal <= 0) return 'Zero Rupees Only';
  if (numVal > 999999999) return 'Amount too high';

  let n = ('000000000' + numVal).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
  return str.trim();
};

const SalaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [dynamicValues, setDynamicValues] = useState({});
  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    remarks: '',
    designation: '',
    pan_no: '',
    bank_name: '',
    branch_name: '',
    account_no: '',
    email: '',
    employee_email: '',
    generate_without_email: false,
    scheduled_send_at: ''
  });

  const [netSalary, setNetSalary] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    utrNumber: '',
    bankName: '',
    accountNo: '',
    cardType: '',
    cardNumber: '',
    chequeNumber: '',
    chequeDate: ''
  });
  
  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (formData.employee_name) {
      setEmployeeSearch(formData.employee_name);
    }
  }, [formData.employee_name]);

  const handleEmployeeSearchChange = async (e) => {
    const val = e.target.value;
    setEmployeeSearch(val);
    setFormData(prev => ({ ...prev, employee_name: val }));
    if (errors.employee_name) setErrors(prev => ({ ...prev, employee_name: '' }));

    if (val.trim().length > 0) {
      try {
        const res = await getAccountsEmployees({ search: val, limit: 10 });
        if (res.success && res.data) {
          setEmployeeSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setEmployeeSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setFormData(prev => ({
      ...prev,
      employee_name: emp.employee_name,
      employee_id: emp.employee_id,
      designation: emp.designation || '',
      department: emp.department || '',
      employee_email: emp.email_address || '',
      email: emp.email_address || ''
    }));
    setEmployeeSearch(emp.employee_name);
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, employee_name: '', employee_id: '', employee_email: '' }));
  };

  // 1. Fetch Active Salary Template & Settings
  useEffect(() => {
    const fetchActiveTemplateAndSettings = async () => {
      try {
        const [templateRes, settingsRes] = await Promise.all([
          getActiveTemplate('salary'),
          getAccountsSettings()
        ]);

        if (templateRes.success && templateRes.data) {
          setActiveTemplate(templateRes.data);
          const initialValues = {};
          templateRes.data.fields.forEach(f => {
            if (f.is_active) {
              initialValues[f.field_name] = 0;
            }
          });
          setDynamicValues(initialValues);
        }

        if (settingsRes.success) {
          setSettings(settingsRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch active template / settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTemplateAndSettings();
  }, []);

  // 2. Fetch record details if in edit mode
  useEffect(() => {
    if (isEdit) {
      const fetchReceipt = async () => {
        try {
          setLoading(true);
          const res = await getSalaryReceiptById(id);
          if (res.success && res.data) {
            const data = res.data;
            let mode = data.payment_mode === 'Bank' ? 'Bank Transfer' : data.payment_mode === 'Card' ? 'Card Payment' : data.payment_mode === 'Cheque' ? 'Cheque Payment' : (data.payment_mode || 'Cash');
            let details = {
              transactionId: '',
              utrNumber: '',
              bankName: '',
              accountNo: '',
              cardType: '',
              cardNumber: '',
              chequeNumber: '',
              chequeDate: ''
            };
            if (data.payment_details) {
              const parsed = typeof data.payment_details === 'string' ? JSON.parse(data.payment_details) : data.payment_details;
              details = { ...details, ...parsed };
            } else if (data.bank_name || data.account_no || data.branch_name) {
              mode = 'Bank Transfer';
              details.bankName = data.bank_name || '';
              details.branchName = data.branch_name || '';
              details.accountNo = data.account_no || '';
              details.utrNumber = data.payment_reference || '';
            }

            setFormData({
              employee_name: data.employee_name,
              employee_id: data.employee_id,
              basic_salary: Number(data.basic_salary),
              allowances: Number(data.allowances),
              deductions: Number(data.deductions),
              month: data.month,
              remarks: data.remarks || '',
              template_id: data.template_id || '',
              designation: data.designation || '',
              pan_no: data.pan_no || '',
              bank_name: data.bank_name || '',
              branch_name: data.branch_name || '',
              account_no: data.account_no || '',
              email: data.employee_email || data.email || '',
              employee_email: data.employee_email || data.email || '',
              generate_without_email: data.email_status === 'PENDING' && !data.employee_email,
              scheduled_send_at: data.scheduled_send_at ? data.scheduled_send_at.slice(0, 16) : '',
              payment_mode: mode
            });
            setPaymentDetails(details);

            // Populate dynamic values
            if (data.dynamic_values) {
              const parsed = typeof data.dynamic_values === 'string' ? JSON.parse(data.dynamic_values) : data.dynamic_values;
              setDynamicValues(parsed);
            } else if (activeTemplate) {
              // Legacy fallback mapping
              const mapped = {};
              activeTemplate.fields.forEach(f => {
                if (f.field_name === 'basic_salary') {
                  mapped['basic_salary'] = Number(data.basic_salary);
                } else {
                  // Fall back allowances and deductions to HRA/DA or PF/Tax
                  if (f.field_category === 'deduction') {
                    mapped[f.field_name] = f.field_name === 'pf' ? Number(data.deductions) : 0;
                  } else {
                    mapped[f.field_name] = f.field_name === 'hra' ? Number(data.allowances) : 0;
                  }
                }
              });
              setDynamicValues(mapped);
            }
          } else {
            setError(res.message || 'Salary slip not found.');
          }
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to fetch salary data.');
        } finally {
          setLoading(false);
        }
      };

      fetchReceipt();
    }
  }, [id, isEdit, activeTemplate]);

  // 3. Recalculate net salary whenever salary fields or template values change
  useEffect(() => {
    if (activeTemplate) {
      let earnings = 0;
      let deductions = 0;

      activeTemplate.fields.forEach(f => {
        if (f.is_active) {
          const val = Number(dynamicValues[f.field_name] || 0);
          if (f.field_category === 'deduction') {
            deductions += val;
          } else {
            earnings += val;
          }
        }
      });

      setNetSalary(earnings - deductions);
    } else {
      // Legacy Calculation
      const basic = Number(formData.basic_salary || 0);
      const allow = Number(formData.allowances || 0);
      const deduct = Number(formData.deductions || 0);
      setNetSalary(basic + allow - deduct);
    }
  }, [activeTemplate, dynamicValues, formData.basic_salary, formData.allowances, formData.deductions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'employee_email' && errors.employee_email) {
      setErrors(prev => ({ ...prev, employee_email: '' }));
    }
    if (error) setError('');
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    const numericVal = value === '' ? 0 : Math.max(0, Number(value));
    setFormData(prev => ({
      ...prev,
      [name]: numericVal
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const handleDynamicValueChange = (name, val) => {
    const numericVal = val === '' ? 0 : Math.max(0, Number(val));
    setDynamicValues(prev => ({
      ...prev,
      [name]: numericVal
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (name === 'basic_salary' && errors.basic_salary_dynamic) {
      setErrors(prev => ({ ...prev, basic_salary_dynamic: '' }));
    }
    if (error) setError('');
  };

  const [errors, setErrors] = useState({});

  const validateSalaryForm = () => {
    const newErrors = {};
    if (!formData.employee_name || !formData.employee_name.trim()) {
      newErrors.employee_name = 'Employee name is required.';
    } else if (!/^[A-Za-z\s]+$/.test(formData.employee_name.trim())) {
      newErrors.employee_name = 'Employee name can only contain letters and spaces.';
    }

    if (!formData.employee_id || !formData.employee_id.trim()) {
      newErrors.employee_id = 'Employee ID is required.';
    }

    const emailVal = (formData.employee_email || '').trim();
    if (emailVal) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        newErrors.employee_email = 'Please enter a valid employee email address.';
      }
    }

    if (!formData.month || !formData.month.trim()) {
      newErrors.month = 'Salary month is required.';
    }

    if (formData.account_no && formData.account_no.trim() !== '') {
      const accNo = formData.account_no.trim();
      if (!/^\d+$/.test(accNo)) {
        newErrors.account_no = 'Account number must contain digits only.';
      } else if (accNo.length < 9 || accNo.length > 18) {
        newErrors.account_no = 'Account number must be between 9 and 18 digits.';
      }
    }

    if (formData.payment_mode === 'UPI') {
      if (!paymentDetails.transactionId || !paymentDetails.transactionId.trim()) {
        newErrors.transactionId = 'Transaction ID is required for UPI payment.';
      }
    } else if (formData.payment_mode === 'Bank' || formData.payment_mode === 'Bank Transfer') {
      if (!paymentDetails.utrNumber || !paymentDetails.utrNumber.trim()) {
        newErrors.utrNumber = 'UTR Number is required for Bank Transfer.';
      }
      if (paymentDetails.accountNo && paymentDetails.accountNo.trim() !== '') {
        const acc = paymentDetails.accountNo.trim();
        if (!/^\d+$/.test(acc)) {
          newErrors.accountNo = 'Account number must contain digits only.';
        } else if (acc.length < 9 || acc.length > 18) {
          newErrors.accountNo = 'Account number must be between 9 and 18 digits.';
        }
      }
    } else if (formData.payment_mode === 'Card' || formData.payment_mode === 'Card Payment') {
      if (!paymentDetails.transactionId || !paymentDetails.transactionId.trim()) {
        newErrors.transactionId = 'Transaction ID is required for Card payment.';
      }
      if (paymentDetails.cardNumber && paymentDetails.cardNumber.trim() !== '') {
        const cardNum = paymentDetails.cardNumber.trim();
        if (!/^\d{4}$/.test(cardNum)) {
          newErrors.cardNumber = 'Card number must be exactly 4 digits.';
        }
      }
    } else if (formData.payment_mode === 'Cheque' || formData.payment_mode === 'Cheque Payment') {
      if (!paymentDetails.chequeNumber || !paymentDetails.chequeNumber.trim()) {
        newErrors.chequeNumber = 'Cheque number is required for Cheque payment.';
      }
    }

    const basicField = activeTemplate ? activeTemplate.fields.find(f => f.field_name === 'basic_salary') : null;
    const basicVal = basicField ? Number(dynamicValues['basic_salary'] || 0) : Number(formData.basic_salary || 0);
    if (basicVal <= 0) {
      if (basicField) {
        newErrors.basic_salary_dynamic = 'Basic Salary must be greater than 0.';
      } else {
        newErrors.basic_salary = 'Basic Salary must be greater than 0.';
      }
    }

    if (activeTemplate) {
      activeTemplate.fields.forEach(f => {
        if (f.is_active && f.is_required === 1 && f.field_name !== 'basic_salary') {
          const val = dynamicValues[f.field_name];
          if (val === undefined || val === null || val === '') {
            newErrors[f.field_name] = `${f.field_label} is mandatory.`;
          }
        }
      });
    }

    if (netSalary < 0) {
      newErrors.net_salary = 'Net salary cannot be negative. Earnings must exceed deductions.';
    }

    return newErrors;
  };

  const handlePreview = async () => {
    setError('');
    setErrors({});
    const validationErrors = validateSalaryForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    const filteredDetails = {};
    const mode = formData.payment_mode || 'Cash';
    if (mode === 'UPI') {
      filteredDetails.transactionId = paymentDetails.transactionId;
    } else if (mode === 'Bank' || mode === 'Bank Transfer') {
      filteredDetails.utrNumber = paymentDetails.utrNumber;
      filteredDetails.bankName = paymentDetails.bankName;
      filteredDetails.accountNo = paymentDetails.accountNo;
    } else if (mode === 'Card' || mode === 'Card Payment') {
      filteredDetails.transactionId = paymentDetails.transactionId;
      filteredDetails.cardType = paymentDetails.cardType;
      filteredDetails.cardNumber = paymentDetails.cardNumber;
    } else if (mode === 'Cheque' || mode === 'Cheque Payment') {
      filteredDetails.chequeNumber = paymentDetails.chequeNumber;
      filteredDetails.bankName = paymentDetails.bankName;
      filteredDetails.chequeDate = paymentDetails.chequeDate;
    }

    const hasEmail = !!(formData.employee_email || '').trim();
    const payload = {
      ...formData,
      employee_email: hasEmail ? formData.employee_email.trim() : '',
      email: hasEmail ? formData.employee_email.trim() : '',
      email_status: hasEmail ? 'QUEUED' : 'PENDING',
      scheduled_send_at: (hasEmail && formData.scheduled_send_at) 
        ? dayjs(formData.scheduled_send_at).format('YYYY-MM-DD HH:mm:ss') 
        : null,
      generate_without_email: !hasEmail,
      template_id: activeTemplate ? activeTemplate.id : undefined,
      dynamic_values: activeTemplate ? dynamicValues : undefined,
      net_salary: netSalary,
      amount_in_words: convertNumberToWords(netSalary),
      payment_mode: mode,
      payment_details: filteredDetails
    };

    try {
      setPreviewLoading(true);
      const res = await previewSalaryReceipt(payload);
      if (res.success) {
        setPreviewData(res.data);
        setShowPreviewModal(true);
      } else {
        setError(res.message || 'Failed to compile preview.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error generating preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setErrors({});
    const validationErrors = validateSalaryForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please correct the validation errors below.');
      return;
    }
    setLoading(true);

    const filteredDetails = {};
    const mode = formData.payment_mode || 'Cash';
    if (mode === 'UPI') {
      filteredDetails.transactionId = paymentDetails.transactionId;
    } else if (mode === 'Bank' || mode === 'Bank Transfer') {
      filteredDetails.utrNumber = paymentDetails.utrNumber;
      filteredDetails.bankName = paymentDetails.bankName;
      filteredDetails.accountNo = paymentDetails.accountNo;
    } else if (mode === 'Card' || mode === 'Card Payment') {
      filteredDetails.transactionId = paymentDetails.transactionId;
      filteredDetails.cardType = paymentDetails.cardType;
      filteredDetails.cardNumber = paymentDetails.cardNumber;
    } else if (mode === 'Cheque' || mode === 'Cheque Payment') {
      filteredDetails.chequeNumber = paymentDetails.chequeNumber;
      filteredDetails.bankName = paymentDetails.bankName;
      filteredDetails.chequeDate = paymentDetails.chequeDate;
    }

    const hasEmail = !!(formData.employee_email || '').trim();
    const payload = {
      ...formData,
      employee_email: hasEmail ? formData.employee_email.trim() : '',
      email: hasEmail ? formData.employee_email.trim() : '',
      email_status: hasEmail ? 'QUEUED' : 'PENDING',
      scheduled_send_at: (hasEmail && formData.scheduled_send_at) 
        ? dayjs(formData.scheduled_send_at).format('YYYY-MM-DD HH:mm:ss') 
        : null,
      generate_without_email: !hasEmail,
      template_id: activeTemplate ? activeTemplate.id : undefined,
      dynamic_values: activeTemplate ? dynamicValues : undefined,
      net_salary: netSalary,
      amount_in_words: convertNumberToWords(netSalary),
      payment_mode: mode,
      payment_details: filteredDetails
    };

    try {
      let res;
      if (isEdit) {
        res = await updateSalaryReceipt(id, payload);
      } else {
        res = await createSalaryReceipt(payload);
      }

      if (res.success) {
        if (isEdit) {
          navigate('/admin/accounts/salary', {
            state: { successMessage: 'Salary slip updated successfully!' }
          });
        } else {
          const targetId = res.data && res.data.id ? res.data.id : id;
          navigate(`/admin/accounts/salary/success/${targetId}`);
        }
      } else {
        setError(res.message || 'Failed to save salary slip.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error saving salary details.');
    } finally {
      setLoading(false);
      setShowPreviewModal(false);
    }
  };


  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading salary slip configuration...</p>
      </div>
    );
  }

  const activeEarnings = activeTemplate ? activeTemplate.fields.filter(f => f.is_active === 1 && f.field_category !== 'deduction') : [];
  const activeDeductions = activeTemplate ? activeTemplate.fields.filter(f => f.is_active === 1 && f.field_category === 'deduction') : [];

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

      <div className="accounts-form-card">
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} noValidate>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 'var(--sp-4)', color: 'var(--primary-700)' }}>
            Employee Details
          </h3>
          
          <div className="accounts-form-grid">
            <div className="accounts-form-group autocomplete-wrapper" style={{ position: 'relative' }}>
              <label className="accounts-form-label">Employee Name *</label>
              <input
                type="text"
                placeholder="Type to search or add name..."
                value={employeeSearch}
                onChange={handleEmployeeSearchChange}
                onFocus={() => employeeSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={`accounts-form-input ${errors.employee_name ? 'border-error' : ''}`}
              />
              {errors.employee_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.employee_name}</p>}
              {showSuggestions && (
                <div className="autocomplete-dropdown" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', border: '1px solid var(--neutral-300)', borderRadius: '6px', boxShadow: 'var(--shadow-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                  {employeeSuggestions.map(emp => (
                    <div
                      key={emp.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelectEmployee(emp); }}
                      className="autocomplete-item"
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--neutral-100)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-25)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <strong>{emp.employee_name}</strong> ({emp.employee_id}) <br/>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Email: {emp.email_address}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Employee ID *</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleInputChange}
                className={`accounts-form-input ${errors.employee_id ? 'border-error' : ''}`}
              />
              {errors.employee_id && <p className="error-text" style={{ marginTop: '4px' }}>{errors.employee_id}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Designation</label>
              <input
                type="text"
                name="designation"
                placeholder="e.g. Teacher, Clerk"
                value={formData.designation}
                onChange={handleInputChange}
                className="accounts-form-input"
              />
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">PAN Number</label>
              <input
                type="text"
                name="pan_no"
                placeholder="e.g. ABCDE1234F"
                value={formData.pan_no || ''}
                onChange={handleInputChange}
                className="accounts-form-input"
              />
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Employee Email Address</label>
              <input
                type="email"
                name="employee_email"
                placeholder="e.g. employee@school.com"
                value={formData.employee_email}
                onChange={handleInputChange}
                className={`accounts-form-input ${errors.employee_email ? 'border-error' : ''}`}
              />
              {errors.employee_email && <p className="error-text" style={{ marginTop: '4px' }}>{errors.employee_email}</p>}
            </div>

            {formData.employee_email && formData.employee_email.trim() && (
              <div className="accounts-form-group">
                <label className="accounts-form-label">Schedule Email Dispatch (Optional)</label>
                <input
                  type="datetime-local"
                  name="scheduled_send_at"
                  value={formData.scheduled_send_at || ''}
                  onChange={handleInputChange}
                  className="accounts-form-input"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Leave blank to dispatch immediately.
                </span>
              </div>
            )}

            <div className="accounts-form-group">
              <label className="accounts-form-label">Salary Month *</label>
              <input
                type="text"
                name="month"
                placeholder="e.g. June 2026"
                value={formData.month}
                onChange={handleInputChange}
                className={`accounts-form-input ${errors.month ? 'border-error' : ''}`}
              />
              {errors.month && <p className="error-text" style={{ marginTop: '4px' }}>{errors.month}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Payment Mode *</label>
              <select
                name="payment_mode"
                value={formData.payment_mode || 'Cash'}
                onChange={(e) => {
                  handleInputChange(e);
                  if (errors.payment_mode) setErrors(prev => ({ ...prev, payment_mode: '' }));
                }}
                className="accounts-form-select"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card Payment">Card Payment</option>
                <option value="Cheque Payment">Cheque Payment</option>
              </select>
            </div>

            {/* Conditional Payment Details Fields */}
            {formData.payment_mode === 'UPI' && (
              <div className="accounts-form-group">
                <label className="accounts-form-label">Transaction ID *</label>
                <input
                  type="text"
                  placeholder="Enter UPI Transaction ID"
                  value={paymentDetails.transactionId}
                  onChange={(e) => {
                    setPaymentDetails({ ...paymentDetails, transactionId: e.target.value });
                    if (errors.transactionId) setErrors(prev => ({ ...prev, transactionId: '' }));
                  }}
                  className={`accounts-form-input ${errors.transactionId ? 'border-error' : ''}`}
                />
                {errors.transactionId && <p className="error-text" style={{ marginTop: '4px' }}>{errors.transactionId}</p>}
              </div>
            )}

            {(formData.payment_mode === 'Bank' || formData.payment_mode === 'Bank Transfer') && (
              <>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">UTR Number *</label>
                  <input
                    type="text"
                    placeholder="Enter UTR Number"
                    value={paymentDetails.utrNumber}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, utrNumber: e.target.value });
                      if (errors.utrNumber) setErrors(prev => ({ ...prev, utrNumber: '' }));
                    }}
                    className={`accounts-form-input ${errors.utrNumber ? 'border-error' : ''}`}
                  />
                  {errors.utrNumber && <p className="error-text" style={{ marginTop: '4px' }}>{errors.utrNumber}</p>}
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI, ICICI"
                    value={paymentDetails.bankName}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, bankName: e.target.value });
                      setFormData(prev => ({ ...prev, bank_name: e.target.value }));
                    }}
                    className="accounts-form-input"
                  />
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Branch Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Koramangala"
                    value={paymentDetails.branchName || ''}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, branchName: e.target.value });
                      setFormData(prev => ({ ...prev, branch_name: e.target.value }));
                    }}
                    className="accounts-form-input"
                  />
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Account Number</label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    value={paymentDetails.accountNo}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, accountNo: e.target.value });
                      setFormData(prev => ({ ...prev, account_no: e.target.value }));
                      if (errors.accountNo) setErrors(prev => ({ ...prev, accountNo: '' }));
                    }}
                    className={`accounts-form-input ${errors.accountNo ? 'border-error' : ''}`}
                  />
                  {errors.accountNo && <p className="error-text" style={{ marginTop: '4px' }}>{errors.accountNo}</p>}
                </div>
              </>
            )}

            {(formData.payment_mode === 'Card' || formData.payment_mode === 'Card Payment') && (
              <>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Transaction ID *</label>
                  <input
                    type="text"
                    placeholder="Enter Card Transaction ID"
                    value={paymentDetails.transactionId}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, transactionId: e.target.value });
                      if (errors.transactionId) setErrors(prev => ({ ...prev, transactionId: '' }));
                    }}
                    className={`accounts-form-input ${errors.transactionId ? 'border-error' : ''}`}
                  />
                  {errors.transactionId && <p className="error-text" style={{ marginTop: '4px' }}>{errors.transactionId}</p>}
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Card Type</label>
                  <select
                    value={paymentDetails.cardType}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, cardType: e.target.value })}
                    className="accounts-form-select"
                  >
                    <option value="">Select Card Type</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Rupay">Rupay</option>
                    <option value="Amex">Amex</option>
                  </select>
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Card Number (Last 4 digits)</label>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="e.g. 1234"
                    value={paymentDetails.cardNumber}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, cardNumber: e.target.value.replace(/\D/g, '') });
                      if (errors.cardNumber) setErrors(prev => ({ ...prev, cardNumber: '' }));
                    }}
                    className={`accounts-form-input ${errors.cardNumber ? 'border-error' : ''}`}
                  />
                  {errors.cardNumber && <p className="error-text" style={{ marginTop: '4px' }}>{errors.cardNumber}</p>}
                </div>
              </>
            )}

            {(formData.payment_mode === 'Cheque' || formData.payment_mode === 'Cheque Payment') && (
              <>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Cheque Number *</label>
                  <input
                    type="text"
                    placeholder="Enter Cheque Number"
                    value={paymentDetails.chequeNumber}
                    onChange={(e) => {
                      setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value });
                      if (errors.chequeNumber) setErrors(prev => ({ ...prev, chequeNumber: '' }));
                    }}
                    className={`accounts-form-input ${errors.chequeNumber ? 'border-error' : ''}`}
                  />
                  {errors.chequeNumber && <p className="error-text" style={{ marginTop: '4px' }}>{errors.chequeNumber}</p>}
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Bank drawing cheque"
                    value={paymentDetails.bankName}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                    className="accounts-form-input"
                  />
                </div>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Cheque Date</label>
                  <input
                    type="date"
                    value={paymentDetails.chequeDate}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeDate: e.target.value })}
                    className="accounts-form-input"
                  />
                </div>
              </>
            )}
          </div>

          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, margin: 'var(--sp-6) 0 var(--sp-4)', color: 'var(--primary-700)' }}>
            Salary Breakdown
          </h3>

          <div className="accounts-form-grid">
            {activeTemplate ? (
              <>
                {/* Earnings */}
                {activeEarnings.map(f => (
                  <div key={f.field_name} className="accounts-form-group">
                    <label className="accounts-form-label">
                      {f.field_label} {f.is_required === 1 && '*'} (Earning)
                    </label>
                    <input
                      type="number"
                      value={dynamicValues[f.field_name] === 0 ? '' : dynamicValues[f.field_name]}
                      onChange={(e) => handleDynamicValueChange(f.field_name, e.target.value)}
                      className={`accounts-form-input ${errors[f.field_name] || (f.field_name === 'basic_salary' && errors.basic_salary_dynamic) ? 'border-error' : ''}`}
                      required={f.is_required === 1}
                    />
                    {(errors[f.field_name] || (f.field_name === 'basic_salary' && errors.basic_salary_dynamic)) && (
                      <p className="error-text" style={{ marginTop: '4px' }}>
                        {errors[f.field_name] || errors.basic_salary_dynamic}
                      </p>
                    )}
                  </div>
                ))}

                {/* Deductions */}
                {activeDeductions.map(f => (
                  <div key={f.field_name} className="accounts-form-group">
                    <label className="accounts-form-label" style={{ color: 'var(--danger-600)' }}>
                      {f.field_label} {f.is_required === 1 && '*'} (Deduction)
                    </label>
                    <input
                      type="number"
                      value={dynamicValues[f.field_name] === 0 ? '' : dynamicValues[f.field_name]}
                      onChange={(e) => handleDynamicValueChange(f.field_name, e.target.value)}
                      className={`accounts-form-input ${errors[f.field_name] ? 'border-error' : ''}`}
                      style={{ borderColor: errors[f.field_name] ? '#ef4444' : 'var(--danger-200)' }}
                      required={f.is_required === 1}
                    />
                    {errors[f.field_name] && (
                      <p className="error-text" style={{ marginTop: '4px' }}>
                        {errors[f.field_name]}
                      </p>
                    )}
                  </div>
                ))}
              </>
            ) : (
              // Legacy fallback
              <>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Basic Salary *</label>
                  <input
                    type="number"
                    name="basic_salary"
                    value={formData.basic_salary || ''}
                    onChange={handleNumericChange}
                    className={`accounts-form-input ${errors.basic_salary ? 'border-error' : ''}`}
                  />
                  {errors.basic_salary && <p className="error-text" style={{ marginTop: '4px' }}>{errors.basic_salary}</p>}
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Allowances</label>
                  <input
                    type="number"
                    name="allowances"
                    value={formData.allowances || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Deductions</label>
                  <input
                    type="number"
                    name="deductions"
                    value={formData.deductions || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>
              </>
            )}
          </div>

          <div className="accounts-form-grid" style={{ marginTop: 'var(--sp-4)' }}>
            <div className="accounts-form-group">
              <label className="accounts-form-label">Remarks</label>
              <input
                type="text"
                name="remarks"
                placeholder="Optional payroll notes..."
                value={formData.remarks}
                onChange={handleInputChange}
                className="accounts-form-input"
              />
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Net Salary (Auto Calculated)</label>
              <input
                type="text"
                value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(netSalary)}
                readOnly
                className={`accounts-form-input ${errors.net_salary ? 'border-error' : ''}`}
                style={{ 
                  backgroundColor: 'var(--neutral-100)', 
                  fontWeight: 700, 
                  color: netSalary < 0 ? 'var(--danger-600)' : 'var(--text-primary)' 
                }}
              />
              {errors.net_salary && <p className="error-text" style={{ marginTop: '4px' }}>{errors.net_salary}</p>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', marginTop: 'var(--sp-8)' }}>
            <Link to="/admin/accounts/salary" className="accounts-btn accounts-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || previewLoading}
              className="accounts-btn accounts-btn--primary"
            >
              {previewLoading ? 'Loading Preview...' : 'Preview Slip'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '650px', backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Salary Slip Preview</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Slip layout sheet */}
            {(() => {
              const currentLayout = activeTemplate?.layout || {
                header_alignment: 'center',
                logo_position: 'left',
                watermark_opacity: 0.08,
                watermark_position: 'center',
                receipt_font_size: 'medium',
                primary_color: '#0F172A',
                secondary_color: '#475569',
                footer_text: 'Thank you for your cooperation.'
              };
              const currentBranding = settings || {};
              const previewFontSize = currentLayout.receipt_font_size === 'small' ? '11px' : (currentLayout.receipt_font_size === 'large' ? '14px' : '13px');

              let salaryRows = [];
              if (activeTemplate && activeTemplate.fields) {
                activeTemplate.fields.forEach(field => {
                  if (field.is_active) {
                    const val = dynamicValues[field.field_name];
                    if (val !== undefined && val !== null && val !== '') {
                      const isDeduct = field.field_category === 'deduction';
                      salaryRows.push({
                        label: field.field_label,
                        value: isDeduct && Number(val) > 0 ? `-${Number(val).toFixed(2)}` : Number(val).toFixed(2),
                        isDeduction: isDeduct
                      });
                    }
                  }
                });
              } else {
                // Legacy fallback inputs
                salaryRows = [
                  { label: 'Basic Salary', value: Number(formData.basic_salary).toFixed(2) },
                  { label: 'Allowances', value: Number(formData.allowances).toFixed(2) },
                  { label: 'Deductions', value: Number(formData.deductions) > 0 ? `-${Number(formData.deductions).toFixed(2)}` : '0.00', isDeduction: true }
                ];
              }

              return (
                <div style={{ 
                  width: '100%',
                  maxWidth: '520px',
                  margin: '0 auto',
                  backgroundColor: '#fff',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '20px',
                  boxSizing: 'border-box',
                  fontFamily: '"Times New Roman", Times, serif',
                  position: 'relative',
                  borderRadius: '0px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    border: '1.5px solid ' + currentLayout.primary_color,
                    padding: '12px 16px',
                    boxSizing: 'border-box',
                    minHeight: '500px',
                    position: 'relative'
                  }}>
                    {/* Watermark Logo */}
                    {currentLayout.watermark_opacity > 0 && currentBranding.watermark_logo && (
                      <div style={
                        currentLayout.watermark_position === 'tile' ? {
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundImage: `url(${currentBranding.watermark_logo})`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'repeat',
                          backgroundSize: '80px',
                          opacity: currentLayout.watermark_opacity,
                          pointerEvents: 'none',
                          zIndex: 0
                        } : {
                          position: 'absolute',
                          top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundImage: `url(${currentBranding.watermark_logo})`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '170px',
                          width: '170px',
                          height: '170px',
                          opacity: currentLayout.watermark_opacity,
                          pointerEvents: 'none',
                          zIndex: 0
                        }
                      }></div>
                    )}

                    {/* Header Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, marginBottom: '12px' }}>
                      <div style={{ 
                        display: 'flex', 
                        width: '100%', 
                        position: 'relative',
                        justifyContent: currentLayout.header_alignment === 'left' ? 'flex-start' : (currentLayout.header_alignment === 'right' ? 'flex-end' : 'center'), 
                        alignItems: 'center', 
                        minHeight: currentLayout.logo_position !== 'hidden' && currentBranding.school_logo ? '60px' : 'auto'
                      }}>
                        {currentLayout.logo_position !== 'hidden' && currentBranding.school_logo && (
                          <img 
                            src={currentBranding.school_logo} 
                            alt="Logo" 
                            style={
                              currentLayout.header_alignment === 'center' ? {
                                width: '55px',
                                height: '55px',
                                objectFit: 'contain',
                                position: 'absolute',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                left: currentLayout.logo_position === 'left' ? '0px' : 'auto',
                                right: currentLayout.logo_position === 'right' ? '0px' : 'auto'
                              } : {
                                width: '55px',
                                height: '55px',
                                objectFit: 'contain',
                                marginRight: currentLayout.logo_position === 'left' ? '16px' : '0px',
                                marginLeft: currentLayout.logo_position === 'right' ? '16px' : '0px',
                                order: currentLayout.logo_position === 'right' ? 2 : 0
                              }
                            } 
                          />
                        )}
                        <div style={{ 
                          textAlign: currentLayout.header_alignment, 
                          order: 1,
                          width: currentLayout.header_alignment === 'center' ? '100%' : 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1.5px'
                        }}>
                          {(() => {
                            let fieldOrder = ["school_name", "extra_info", "school_address", "school_phone", "alternative_contact_number", "school_email", "website"];
                            if (currentBranding.header_fields_order) {
                              try {
                                fieldOrder = typeof currentBranding.header_fields_order === 'string' ? JSON.parse(currentBranding.header_fields_order) : currentBranding.header_fields_order;
                              } catch (e) {}
                            }

                            const items = [];
                            const primaryColor = currentLayout.primary_color || '#000000';
                            const secondaryColor = currentLayout.secondary_color || '#000000';

                            for (let i = 0; i < fieldOrder.length; i++) {
                              const key = fieldOrder[i];

                              if (key === 'school_name') {
                                if (currentBranding.school_name) {
                                  items.push(
                                    <h4 key="school_name" style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: primaryColor, textTransform: 'uppercase' }}>
                                      {currentBranding.school_name}
                                    </h4>
                                  );
                                }
                              }
                              else if (key === 'extra_info') {
                                if (currentBranding.extra_info) {
                                  items.push(
                                    <p key="extra_info" style={{ fontSize: '8px', margin: 0, color: '#000000', fontWeight: 'normal' }}>
                                      {currentBranding.extra_info}
                                    </p>
                                  );
                                }
                              }
                              else if (key === 'school_address') {
                                if (currentBranding.school_address) {
                                  items.push(
                                    <p key="school_address" style={{ fontSize: '7.5px', margin: 0, color: '#64748b' }}>
                                      {currentBranding.school_address}
                                    </p>
                                  );
                                }
                              }
                              else if (key === 'school_phone') {
                                const nextKey = fieldOrder[i + 1];
                                const phoneVal = currentBranding.school_phone;
                                if (nextKey === 'alternative_contact_number' && (phoneVal || currentBranding.alternative_contact_number)) {
                                  items.push(
                                    <p key="combined_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                      Phone: {phoneVal}{currentBranding.alternative_contact_number ? `, ${currentBranding.alternative_contact_number}` : ''}
                                    </p>
                                  );
                                  i++;
                                } else if (phoneVal) {
                                  items.push(
                                    <p key="school_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                      Phone: {phoneVal}
                                    </p>
                                  );
                                }
                              }
                              else if (key === 'alternative_contact_number') {
                                if (currentBranding.alternative_contact_number) {
                                  items.push(
                                    <p key="alternative_contact_number" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                      Phone: {currentBranding.alternative_contact_number}
                                    </p>
                                  );
                                }
                              }
                              else if (key === 'school_email') {
                                const nextKey = fieldOrder[i + 1];
                                if (nextKey === 'website' && currentBranding.school_email && currentBranding.website) {
                                  items.push(
                                    <p key="combined_email_website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                      Email: {currentBranding.school_email} &nbsp; | &nbsp; Website: {currentBranding.website}
                                    </p>
                                  );
                                  i++;
                                } else if (currentBranding.school_email) {
                                  items.push(
                                    <p key="school_email" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                      Email: {currentBranding.school_email}
                                    </p>
                                  );
                                }
                              }
                              else if (key === 'website') {
                                if (currentBranding.website) {
                                  items.push(
                                    <p key="website" style={{ fontSize: '7.5px', margin: 0, color: '#000' }}>
                                      Website: {currentBranding.website}
                                    </p>
                                  );
                                }
                              }
                            }
                            return items;
                          })()}
                        </div>
                      </div>
                      {/* Double bottom lines */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '10px' }}>
                        <div style={{ borderBottom: `0.5px solid ${currentLayout.primary_color}`, width: '100%' }}></div>
                        <div style={{ borderBottom: `1.5px solid ${currentLayout.primary_color}`, width: '100%' }}></div>
                      </div>
                    </div>
 
                    {/* Receipt title */}
                    <div style={{ textAlign: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                      <h5 style={{ fontSize: '12px', fontWeight: 'bold', textDecoration: 'underline', margin: 0, textTransform: 'uppercase', color: currentLayout.primary_color }}>
                        Salary Slip
                      </h5>
                    </div>
 
                    {/* Metadata layout grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px 20px', marginBottom: '16px', fontSize: '9.5px', position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Employee Name :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.employee_name}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Employee ID :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.employee_id}
                          </div>
                        </div>
                        {formData.pan_no && formData.pan_no.trim() !== '' && (
                          <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                            <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>PAN Number :</span>
                            <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                              {formData.pan_no}
                            </div>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Month :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.month}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '80px', flexShrink: 0 }}>Slip No :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontWeight: 'bold', color: 'red', fontFamily: 'Courier, monospace', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {previewData?.receipt_no || 'SAL-YYYY-XXXX'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '80px', flexShrink: 0 }}>Date :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {new Date().toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '80px', flexShrink: 0 }}>Designation :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.designation || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: '1px solid ' + currentLayout.primary_color, marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'center', width: '10%', fontWeight: 'bold' }}>SL. NO.</th>
                          <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'left', width: '60%', fontWeight: 'bold' }}>DESCRIPTION</th>
                          <th style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'right', width: '30%', fontWeight: 'bold' }}>AMOUNT (Rs.)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'center' }}>{idx + 1}.</td>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px' }}>{row.label}</td>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'right', fontWeight: 'bold', color: row.isDeduction ? 'var(--danger-600)' : 'var(--text-primary)' }}>{row.value}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan="2" style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', textTransform: 'uppercase' }}>TOTAL</td>
                          <td style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', color: currentLayout.primary_color }}>
                            Rs. {Number(netSalary).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Rupees in Words */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '10px', fontSize: '9px', position: 'relative', zIndex: 1 }}>
                      <strong style={{ color: currentLayout.primary_color, marginRight: '4px', whiteSpace: 'nowrap', width: '90px' }}>Rupees in Words:</strong>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {convertNumberToWords(netSalary)}
                      </div>
                    </div>

                    {/* Note Section */}
                    {currentLayout.show_note !== false && (
                      <div style={{ marginTop: '12px', fontSize: '8px', position: 'relative', zIndex: 1, textAlign: 'left' }}>
                        <strong style={{ color: currentLayout.primary_color }}>Note :</strong>
                        <div style={{ marginTop: '4px', color: '#000' }}>
                          {(currentLayout.note_text || "1. This is a computer generated slip.\n2. All amounts are in Indian Rupees.")
                            .split('\n')
                            .map(line => line.trim())
                            .filter(Boolean)
                            .map((line, i) => (
                              <div key={i} style={{ marginLeft: '10px', marginTop: '2px' }}>{line}</div>
                            ))
                          }
                        </div>
                      </div>
                    )}

                    {/* Payment Details Container */}
                    {formData.payment_mode && formData.payment_mode !== 'Cash' && currentLayout.show_payment_details !== false && (
                      <div style={{
                        marginTop: '15px',
                        border: `0.5px solid ${currentLayout.secondary_color}`,
                        padding: '8px 12px',
                        position: 'relative',
                        zIndex: 1,
                        fontSize: '8px',
                        textAlign: 'left'
                      }}>
                        <div style={{
                          textAlign: 'center',
                          fontWeight: 'bold',
                          textDecoration: 'underline',
                          color: currentLayout.primary_color,
                          marginBottom: '6px',
                          fontSize: '8.5px',
                          textTransform: 'uppercase'
                        }}>
                          Payment Details
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex' }}>
                            <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Payment Mode</span>
                            <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                            <span style={{ color: '#000' }}>{formData.payment_mode}</span>
                          </div>
                          {formData.payment_mode === 'UPI' && paymentDetails.transactionId && (
                            <div style={{ display: 'flex' }}>
                              <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Transaction ID</span>
                              <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                              <span style={{ color: '#000' }}>{paymentDetails.transactionId}</span>
                            </div>
                          )}
                          {(formData.payment_mode === 'Bank' || formData.payment_mode === 'Bank Transfer') && (
                            <>
                              {paymentDetails.utrNumber && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>UTR Number</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.utrNumber}</span>
                                </div>
                              )}
                              {(paymentDetails.bankName || formData.bank_name) && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Bank Name</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.bankName || formData.bank_name}</span>
                                </div>
                              )}
                              {(paymentDetails.accountNo || formData.account_no) && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Account No</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{maskAccountNumber(paymentDetails.accountNo || formData.account_no)}</span>
                                </div>
                              )}
                              {paymentDetails.ifscCode && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>IFSC Code</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.ifscCode}</span>
                                </div>
                              )}
                            </>
                          )}
                          {(formData.payment_mode === 'Card' || formData.payment_mode === 'Card Payment') && (
                            <>
                              {paymentDetails.transactionId && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Transaction ID</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.transactionId}</span>
                                </div>
                              )}
                              {paymentDetails.cardType && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Card Type</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.cardType}</span>
                                </div>
                              )}
                              {paymentDetails.cardNumber && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Card Number</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.cardNumber}</span>
                                </div>
                              )}
                            </>
                          )}
                          {(formData.payment_mode === 'Cheque' || formData.payment_mode === 'Cheque Payment') && (
                            <>
                              {paymentDetails.chequeNumber && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Cheque No.</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.chequeNumber}</span>
                                </div>
                              )}
                              {paymentDetails.bankName && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Bank</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.bankName}</span>
                                </div>
                              )}
                              {paymentDetails.chequeDate && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Date</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{new Date(paymentDetails.chequeDate).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Signatures Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '8.5px', position: 'relative', zIndex: 1, marginTop: '55px' }}>
                      <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ height: '35px' }}></div>
                        <div style={{ borderTop: '0.5px solid ' + currentLayout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Signature of Employee</div>
                      </div>
                      <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {currentBranding.salary_seal ? (
                          <img src={currentBranding.salary_seal} alt="Salary Seal" style={{ height: '35px', objectFit: 'contain', marginBottom: '2px' }} />
                        ) : (
                          <div style={{ height: '35px' }}></div>
                        )}
                        <div style={{ borderTop: '0.5px solid ' + currentLayout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Signature of Employer</div>
                      </div>
                    </div>

                    {/* Footer Text */}
                    {currentLayout.show_footer !== false && currentLayout.footer_text && (
                      <div style={{ textAlign: 'center', fontSize: '8px', fontStyle: 'italic', color: currentLayout.secondary_color, marginTop: '20px', position: 'relative', zIndex: 1 }}>
                        {currentLayout.footer_text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="accounts-btn accounts-btn--secondary"
                disabled={loading}
              >
                Back to Edit
              </button>
              <button 
                onClick={() => handleSubmit()}
                className="accounts-btn accounts-btn--primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Confirm and Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryForm;
