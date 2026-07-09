import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  searchAccountsStudents, 
  createFeeReceipt, 
  previewFeeReceipt, 
  getFeeReceiptById, 
  updateFeeReceipt,
  getActiveTemplate,
  getAccountsSettings,
  getOrgSettings
} from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
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

const maskAccountNumber = (accountNo) => {
  if (!accountNo) return '-';
  const clean = String(accountNo).trim();
  if (clean.length <= 4) return clean;
  return 'X'.repeat(clean.length - 4) + clean.slice(-4);
};

const getMatchingGrade = (gradeVal, allowedGrades = []) => {
  if (!gradeVal) return '';
  const availableGrades = allowedGrades.length > 0 
    ? allowedGrades 
    : ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  // Try exact match first
  const exactMatch = availableGrades.find(g => String(g).trim().toLowerCase() === String(gradeVal).trim().toLowerCase());
  if (exactMatch) return exactMatch;
  
  // Normalize (e.g. remove non-alphanumeric, strip leading 'grade')
  const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^grade/g, '').trim();
  const normVal = normalize(gradeVal);
  if (!normVal) return gradeVal;
  
  const matched = availableGrades.find(g => normalize(g) === normVal);
  return matched || gradeVal;
};

const FeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [dynamicValues, setDynamicValues] = useState({});
  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    studentId: '',
    student_name: '',
    parent_name: '',
    phone_number: '',
    parent_phone: '',
    parent_whatsapp_opt_in: 1,
    class: '',
    academic_year: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`,
    amount: 0,
    amount_in_words: 'Zero Rupees Only',
    payment_mode: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    school_maintenance_fee: 0,
    term_fee: 0,
    tuition_fee: 0,
    computer_fee: 0,
    library_fee: 0,
    lab_fee: 0,
    smart_class_fee: 0,
    sports_games_fee: 0,
    others_fee: 0,
    remarks: ''
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [allowedGrades, setAllowedGrades] = useState([]);
  const [allowedSections, setAllowedSections] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  
  // Preview State
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [errors, setErrors] = useState({});

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

  const searchTimeoutRef = useRef(null);

  // 1. Fetch Active Template Configuration & Settings
  useEffect(() => {
    const fetchActiveTemplateAndSettings = async () => {
      try {
        const [templateRes, settingsRes] = await Promise.all([
          getActiveTemplate('fee'),
          getAccountsSettings()
        ]);

        if (templateRes.success && templateRes.data) {
          setActiveTemplate(templateRes.data);
          const initialValues = {};
          templateRes.data.fields.forEach(f => {
            if (f.is_active) {
              initialValues[f.field_name] = f.field_type === 'text' ? '' : 0;
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

    // Load organization grade/section settings for dropdown options
    try {
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      setAllowedGrades(org.grades ? sortGrades(org.grades.split(',').map(g => g.trim())) : []);
      setAllowedSections(org.sections ? sortSections(org.sections.split(',').map(s => s.trim())) : []);
    } catch (e) {}

    const loadOrgConfig = async () => {
      try {
        const response = await getOrgSettings();
        if (response.success && response.data) {
          setAllowedGrades(response.data.grades ? sortGrades(response.data.grades.split(',').map(g => g.trim())) : []);
          setAllowedSections(response.data.sections ? sortSections(response.data.sections.split(',').map(s => s.trim())) : []);
        }
      } catch (err) {
        console.error('Failed to load custom grades/sections:', err);
      }
    };

    fetchActiveTemplateAndSettings();
    loadOrgConfig();
  }, []);

  // 2. Fetch record details if in edit mode
  useEffect(() => {
    if (isEdit) {
      const fetchReceipt = async () => {
        try {
          setLoading(true);
          const res = await getFeeReceiptById(id);
          if (res.success && res.data) {
            const data = res.data;
            setFormData({
              studentId: data.studentId,
              student_name: data.student_name,
              parent_name: data.parent_name,
              phone_number: data.phone_number || '',
              parent_phone: data.parent_phone || '',
              parent_whatsapp_opt_in: data.parent_whatsapp_opt_in !== undefined ? data.parent_whatsapp_opt_in : 1,
              class: data.class,
              academic_year: data.academic_year,
              amount: Number(data.amount),
              amount_in_words: data.amount_in_words,
              payment_mode: data.payment_mode === 'Bank' ? 'Bank Transfer' : data.payment_mode === 'Card' ? 'Card Payment' : data.payment_mode === 'Cheque' ? 'Cheque Payment' : data.payment_mode,
              date: new Date(data.date).toISOString().slice(0, 10),
              school_maintenance_fee: Number(data.school_maintenance_fee || 0),
              term_fee: Number(data.term_fee || 0),
              tuition_fee: Number(data.tuition_fee || 0),
              computer_fee: Number(data.computer_fee || 0),
              library_fee: Number(data.library_fee || 0),
              lab_fee: Number(data.lab_fee || 0),
              smart_class_fee: Number(data.smart_class_fee || 0),
              sports_games_fee: Number(data.sports_games_fee || 0),
              others_fee: Number(data.others_fee || 0),
              remarks: data.remarks || '',
              template_id: data.template_id || ''
            });
            setStudentSearch(data.student_name);

            // Split class into grade and section for dropdowns
            const classParts = (data.class || '').trim().split(/\s+/);
            if (classParts.length > 1) {
              const lastPart = classParts[classParts.length - 1];
              if (lastPart.length === 1 && /[A-Za-z]/.test(lastPart)) {
                setSelectedGrade(getMatchingGrade(classParts.slice(0, -1).join(' '), allowedGrades));
                setSelectedSection(lastPart.toUpperCase());
              } else {
                setSelectedGrade(getMatchingGrade(data.class, allowedGrades));
                setSelectedSection('');
              }
            } else {
              const lastChar = (data.class || '').trim().slice(-1);
              const restStr = (data.class || '').trim().slice(0, -1);
              if (lastChar.length === 1 && /[A-Za-z]/.test(lastChar) && restStr.length > 0) {
                setSelectedGrade(getMatchingGrade(restStr, allowedGrades));
                setSelectedSection(lastChar.toUpperCase());
              } else {
                setSelectedGrade(getMatchingGrade(data.class || '', allowedGrades));
                setSelectedSection('');
              }
            }

            // Populate dynamic values
            if (data.dynamic_values) {
              const parsed = typeof data.dynamic_values === 'string' ? JSON.parse(data.dynamic_values) : data.dynamic_values;
              setDynamicValues(parsed);
            } else if (activeTemplate) {
              // Legacy fallback: map standard db columns to active template fields
              const mapped = {};
              activeTemplate.fields.forEach(f => {
                mapped[f.field_name] = data[f.field_name] !== undefined ? Number(data[f.field_name]) : (f.field_type === 'text' ? '' : 0);
              });
              setDynamicValues(mapped);
            }

            if (data.payment_details) {
              const parsedDetails = typeof data.payment_details === 'string' ? JSON.parse(data.payment_details) : data.payment_details;
              setPaymentDetails(prev => ({
                ...prev,
                ...parsedDetails
              }));
            }
          } else {
            setError(res.message || 'Receipt not found.');
          }
        } catch (err) {
          console.error(err);
          setError(err.message || 'Failed to fetch receipt data.');
        } finally {
          setLoading(false);
        }
      };

      // Wait until activeTemplate is loaded to perform mapping if applicable
      fetchReceipt();
    }
  }, [id, isEdit, activeTemplate]);

  // 3. Recalculate amount whenever dynamic values or legacy fields change
  useEffect(() => {
    if (activeTemplate) {
      let sum = 0;
      activeTemplate.fields.forEach(f => {
        if (f.is_active && (f.field_type === 'currency' || f.field_type === 'number')) {
          sum += Number(dynamicValues[f.field_name] || 0);
        }
      });

      setFormData(prev => ({
        ...prev,
        amount: sum,
        amount_in_words: convertNumberToWords(sum)
      }));
    } else {
      // Legacy Sum Calculation
      const sum = 
        Number(formData.school_maintenance_fee || 0) + 
        Number(formData.term_fee || 0) + 
        Number(formData.tuition_fee || 0) + 
        Number(formData.computer_fee || 0) + 
        Number(formData.library_fee || 0) + 
        Number(formData.lab_fee || 0) + 
        Number(formData.smart_class_fee || 0) + 
        Number(formData.sports_games_fee || 0) + 
        Number(formData.others_fee || 0);

      setFormData(prev => ({
        ...prev,
        amount: sum,
        amount_in_words: convertNumberToWords(sum)
      }));
    }
  }, [
    activeTemplate,
    dynamicValues,
    formData.school_maintenance_fee,
    formData.term_fee,
    formData.tuition_fee,
    formData.computer_fee,
    formData.library_fee,
    formData.lab_fee,
    formData.smart_class_fee,
    formData.sports_games_fee,
    formData.others_fee
  ]);

  // Auto-complete Search logic
  const handleStudentSearchChange = (e) => {
    const value = e.value || e.target.value;
    setStudentSearch(value);

    setFormData(prev => ({
      ...prev,
      studentId: '',
      student_name: value
    }));

    // Reset dropdown selections
    setSelectedGrade('');
    setSelectedSection('');

    setErrors(prev => ({ ...prev, student_name: '' }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!value.trim()) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchAccountsStudents(value);
        if (res.success && res.data) {
          setStudentSuggestions(res.data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Error suggesting students:', err);
      }
    }, 300);
  };

  const handleSelectStudent = (student) => {
    const studentPhone = student.fatherPhone || student.motherPhone || student.guardianPhone || '';
    let formattedPhone = studentPhone;
    if (studentPhone.replace(/\D/g, '').length === 10 && !studentPhone.startsWith('+')) {
      formattedPhone = `+91${studentPhone.replace(/\D/g, '')}`;
    }
    setFormData(prev => ({
      ...prev,
      studentId: student.id,
      student_name: student.name,
      parent_name: student.fatherName || '',
      phone_number: studentPhone,
      parent_phone: formattedPhone,
      class: `${student.grade || ''} ${student.section || ''}`.trim()
    }));
    setStudentSearch(student.name);
    setShowSuggestions(false);
    setSelectedGrade(getMatchingGrade(student.grade || '', allowedGrades));
    setSelectedSection(student.section || '');
    setErrors(prev => ({
      ...prev,
      student_name: '',
      parent_name: '',
      grade: '',
      section: ''
    }));
  };

  const handleGradeSelectChange = (e) => {
    const gradeVal = e.target.value;
    setSelectedGrade(gradeVal);
    setFormData(prev => ({
      ...prev,
      class: `${gradeVal} ${selectedSection}`.trim()
    }));
    setErrors(prev => ({ ...prev, grade: '' }));
  };

  const handleSectionSelectChange = (e) => {
    const sectionVal = e.target.value;
    setSelectedSection(sectionVal);
    setFormData(prev => ({
      ...prev,
      class: `${selectedGrade} ${sectionVal}`.trim()
    }));
    setErrors(prev => ({ ...prev, section: '' }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
    if (error) setError('');
  };

  const handleDynamicValueChange = (name, val, type) => {
    let finalVal = val;
    if (type !== 'text') {
      finalVal = val === '' ? 0 : Math.max(0, Number(val));
    }
    setDynamicValues(prev => ({
      ...prev,
      [name]: finalVal
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
    if (error) setError('');
  };

  const handleParentPhoneChange = (e) => {
    let val = e.target.value;
    const digits = val.replace(/\D/g, '');
    if (digits.length === 10 && !val.startsWith('+')) {
      val = `+91${digits}`;
    }
    setFormData(prev => ({ 
      ...prev, 
      parent_phone: val,
      phone_number: digits.slice(-10)
    }));
    if (errors.parent_phone) {
      setErrors(prev => ({ ...prev, parent_phone: '' }));
    }
  };

  const validateFeeForm = () => {
    const newErrors = {};
    if (!formData.student_name || !formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required.';
    } else if (!/^[A-Za-z\s]+$/.test(formData.student_name.trim())) {
      newErrors.student_name = 'Student name can only contain letters and spaces.';
    }



    if (formData.parent_phone && formData.parent_phone.trim()) {
      if (!/^(\+91|91)?[6-9]\d{9}$/.test(formData.parent_phone.trim())) {
        newErrors.parent_phone = 'Please enter a valid Indian mobile number (e.g. +919876543210 or 9876543210).';
      }
    }

    if (!selectedGrade) {
      newErrors.grade = 'Grade is required.';
    }

    if (!selectedSection) {
      newErrors.section = 'Section is required.';
    }

    if (!formData.academic_year || !formData.academic_year.trim()) {
      newErrors.academic_year = 'Academic Year is required.';
    } else if (!/^\d{4}-\d{2,4}$/.test(formData.academic_year.trim())) {
      newErrors.academic_year = 'Academic Year must be in the format YYYY-YY or YYYY-YYYY (e.g. 2026-27 or 2026-2027).';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Total receipt amount must be greater than 0.';
    }

    if (!formData.date) {
      newErrors.date = 'Receipt date is required.';
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

    if (activeTemplate) {
      activeTemplate.fields.forEach(f => {
        if (f.is_active && f.is_required === 1) {
          const val = dynamicValues[f.field_name];
          if (val === undefined || val === null || val === '') {
            newErrors[f.field_name] = `${f.field_label} is mandatory.`;
          }
        }
      });
    }

    return newErrors;
  };

  const handlePreview = async () => {
    setError('');
    setErrors({});
    const validationErrors = validateFeeForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    const cleanPhone = formData.parent_phone ? formData.parent_phone.replace(/\D/g, '').slice(-10) : '';
    
    const filteredDetails = {};
    const mode = formData.payment_mode;
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

    const payload = {
      ...formData,
      phone_number: cleanPhone,
      template_id: activeTemplate ? activeTemplate.id : undefined,
      dynamic_values: activeTemplate ? dynamicValues : undefined,
      payment_details: filteredDetails
    };

    try {
      setPreviewLoading(true);
      const res = await previewFeeReceipt(payload);
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
    const validationErrors = validateFeeForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setError('Please correct the validation errors below.');
      return;
    }
    setLoading(true);

    const cleanPhone = formData.parent_phone ? formData.parent_phone.replace(/\D/g, '').slice(-10) : '';
    
    const filteredDetails = {};
    const mode = formData.payment_mode;
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

    const payload = {
      ...formData,
      phone_number: cleanPhone,
      template_id: activeTemplate ? activeTemplate.id : undefined,
      dynamic_values: activeTemplate ? dynamicValues : undefined,
      payment_details: filteredDetails
    };

    try {
      let res;
      if (isEdit) {
        res = await updateFeeReceipt(id, payload);
      } else {
        res = await createFeeReceipt(payload);
      }

      if (res.success) {
        const targetId = res.data && res.data.id ? res.data.id : id;
        navigate(`/admin/accounts/fees/success/${targetId}`);
      } else {
        setError(res.message || 'Failed to save receipt.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error saving receipt details.');
    } finally {
      setLoading(false);
      setShowPreviewModal(false);
    }
  };


  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading fee receipt configuration...</p>
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

      <div className="accounts-form-card">
        <form onSubmit={(e) => { e.preventDefault(); handlePreview(); }} noValidate>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, marginBottom: 'var(--sp-4)', color: 'var(--primary-700)' }}>
            Student Information
          </h3>
          
          <div className="accounts-form-grid">
            <div className="accounts-form-group autocomplete-wrapper">
              <label className="accounts-form-label">Student Name *</label>
              <input
                type="text"
                placeholder="Type name to lookup student..."
                value={studentSearch}
                onChange={handleStudentSearchChange}
                onFocus={() => studentSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                disabled={isEdit}
                className={`accounts-form-input ${errors.student_name ? 'border-error' : ''}`}
              />
              {errors.student_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.student_name}</p>}
              {showSuggestions && (
                <div className="autocomplete-dropdown">
                  {studentSuggestions.map(student => (
                    <div
                      key={student.id}
                      onMouseDown={(e) => { e.preventDefault(); handleSelectStudent(student); }}
                      className="autocomplete-item"
                    >
                      <strong>{student.name}</strong> ({student.grade} - {student.section}) <br/>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Father: {student.fatherName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>




            <div className="accounts-form-group">
              <label className="accounts-form-label">Grade *</label>
              <select
                value={selectedGrade}
                onChange={handleGradeSelectChange}
                className={`accounts-form-select ${errors.grade ? 'border-error' : ''}`}
              >
                <option value="">Select Grade</option>
                {(allowedGrades.length > 0 ? allowedGrades : ['NUR', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              {errors.grade && <p className="error-text" style={{ marginTop: '4px' }}>{errors.grade}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Section *</label>
              <select
                value={selectedSection}
                onChange={handleSectionSelectChange}
                className={`accounts-form-select ${errors.section ? 'border-error' : ''}`}
              >
                <option value="">Select Section</option>
                {(allowedSections.length > 0 ? allowedSections : ['A', 'B', 'C', 'D', 'E']).map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
              {errors.section && <p className="error-text" style={{ marginTop: '4px' }}>{errors.section}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Academic Year *</label>
              <input
                type="text"
                name="academic_year"
                placeholder="2026-27"
                value={formData.academic_year}
                onChange={handleInputChange}
                className={`accounts-form-input ${errors.academic_year ? 'border-error' : ''}`}
              />
              {errors.academic_year && <p className="error-text" style={{ marginTop: '4px' }}>{errors.academic_year}</p>}
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Parent Phone (for WhatsApp)</label>
              <input
                type="text"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleParentPhoneChange}
                placeholder="+91 or 10-digit mobile number"
                className={`accounts-form-input ${errors.parent_phone ? 'border-error' : ''}`}
              />
              {errors.parent_phone && <p className="error-text" style={{ marginTop: '4px' }}>{errors.parent_phone}</p>}
            </div>

            <div className="accounts-form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', marginTop: 'auto', paddingBottom: '12px' }}>
              <label className="accounts-form-checkbox-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  name="parent_whatsapp_opt_in"
                  checked={formData.parent_whatsapp_opt_in === 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_whatsapp_opt_in: e.target.checked ? 1 : 0 }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Send WhatsApp Receipt Notification
              </label>
            </div>
          </div>

          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, margin: 'var(--sp-6) 0 var(--sp-4)', color: 'var(--primary-700)' }}>
            Payment Settings & Dates
          </h3>

          <div className="accounts-form-grid">
            <div className="accounts-form-group">
              <label className="accounts-form-label">Payment Mode *</label>
              <select
                name="payment_mode"
                value={formData.payment_mode}
                onChange={handleInputChange}
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
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
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

            <div className="accounts-form-group">
              <label className="accounts-form-label">Receipt Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`accounts-form-input ${errors.date ? 'border-error' : ''}`}
              />
              {errors.date && <p className="error-text" style={{ marginTop: '4px' }}>{errors.date}</p>}
            </div>
          </div>

          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, margin: 'var(--sp-6) 0 var(--sp-4)', color: 'var(--primary-700)' }}>
            Fee Breakdown
          </h3>

          <div className="accounts-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {activeTemplate ? (
              activeTemplate.fields.filter(f => f.is_active === 1).map(f => (
                <div key={f.field_name} className="accounts-form-group">
                  <label className="accounts-form-label">
                    {f.field_label} {f.is_required === 1 && '*'}
                  </label>
                  {f.field_type === 'text' ? (
                    <input
                      type="text"
                      value={dynamicValues[f.field_name] || ''}
                      onChange={(e) => handleDynamicValueChange(f.field_name, e.target.value, 'text')}
                      className={`accounts-form-input ${errors[f.field_name] ? 'border-error' : ''}`}
                    />
                  ) : (
                    <input
                      type="number"
                      value={dynamicValues[f.field_name] === 0 ? '' : dynamicValues[f.field_name]}
                      onChange={(e) => handleDynamicValueChange(f.field_name, e.target.value, f.field_type)}
                      className={`accounts-form-input ${errors[f.field_name] ? 'border-error' : ''}`}
                    />
                  )}
                  {errors[f.field_name] && <p className="error-text" style={{ marginTop: '4px' }}>{errors[f.field_name]}</p>}
                </div>
              ))
            ) : (
              // Legacy inputs fallback
              <>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">School Maintenance Fee</label>
                  <input
                    type="number"
                    name="school_maintenance_fee"
                    value={formData.school_maintenance_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Term Fee</label>
                  <input
                    type="number"
                    name="term_fee"
                    value={formData.term_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Tuition Fee</label>
                  <input
                    type="number"
                    name="tuition_fee"
                    value={formData.tuition_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Computer Fee</label>
                  <input
                    type="number"
                    name="computer_fee"
                    value={formData.computer_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Library Fee</label>
                  <input
                    type="number"
                    name="library_fee"
                    value={formData.library_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Lab Fee</label>
                  <input
                    type="number"
                    name="lab_fee"
                    value={formData.lab_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Smart Class Fee</label>
                  <input
                    type="number"
                    name="smart_class_fee"
                    value={formData.smart_class_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Sports & Games Fee</label>
                  <input
                    type="number"
                    name="sports_games_fee"
                    value={formData.sports_games_fee || ''}
                    onChange={handleNumericChange}
                    className="accounts-form-input"
                  />
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">Others Fee</label>
                  <input
                    type="number"
                    name="others_fee"
                    value={formData.others_fee || ''}
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
                placeholder="Optional payment notes..."
                value={formData.remarks}
                onChange={handleInputChange}
                className="accounts-form-input"
              />
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">Total Amount (Auto Calculated)</label>
              <input
                type="text"
                value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(formData.amount)}
                readOnly
                className={`accounts-form-input ${errors.amount ? 'border-error' : ''}`}
                style={{ backgroundColor: 'var(--neutral-100)', fontWeight: 700 }}
              />
              {errors.amount && <p className="error-text" style={{ marginTop: '4px' }}>{errors.amount}</p>}
            </div>
          </div>

          <div className="accounts-form-group" style={{ marginTop: 'var(--sp-2)' }}>
            <label className="accounts-form-label">Amount in Words (Auto Calculated)</label>
            <input
              type="text"
              value={formData.amount_in_words}
              readOnly
              className="accounts-form-input"
              style={{ backgroundColor: 'var(--neutral-100)', fontStyle: 'italic' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-3)', justifyContent: 'flex-end', marginTop: 'var(--sp-8)' }}>
            <Link to="/admin/accounts/fees" className="accounts-btn accounts-btn--secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || previewLoading}
              className="accounts-btn accounts-btn--primary"
            >
              {previewLoading ? 'Loading Preview...' : 'Preview Receipt'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="modal-overlay" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ width: '90%', maxWidth: '650px', backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Fee Receipt Preview</h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Receipt layout sheet */}
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

              let feeRows = [];
              if (activeTemplate && activeTemplate.fields) {
                activeTemplate.fields.forEach(field => {
                  if (field.is_active) {
                    const val = dynamicValues[field.field_name];
                    if (val !== undefined && val !== null && val !== '') {
                      feeRows.push({
                        label: field.field_label,
                        value: (field.field_type === 'currency' || field.field_type === 'number') ? Number(val).toFixed(2) : String(val)
                      });
                    }
                  }
                });
              } else {
                // Legacy fallback inputs
                feeRows = [
                  { label: 'School Maintenance Fee', value: Number(formData.school_maintenance_fee || 0).toFixed(2) },
                  { label: 'Term Fee', value: Number(formData.term_fee || 0).toFixed(2) },
                  { label: 'Tuition Fee', value: Number(formData.tuition_fee || 0).toFixed(2) },
                  { label: 'Computer Fee', value: Number(formData.computer_fee || 0).toFixed(2) },
                  { label: 'Library Fee', value: Number(formData.library_fee || 0).toFixed(2) },
                  { label: 'Lab Fee', value: Number(formData.lab_fee || 0).toFixed(2) },
                  { label: 'Smart Class Fee', value: Number(formData.smart_class_fee || 0).toFixed(2) },
                  { label: 'Sports & Games Fee', value: Number(formData.sports_games_fee || 0).toFixed(2) },
                  { label: 'Others Fee', value: Number(formData.others_fee || 0).toFixed(2) }
                ].filter(item => Number(item.value) > 0);
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
                                  items.push(
                                    <h4 key="school_name" style={{ fontSize: '13px', fontWeight: 'bold', margin: 0, color: primaryColor, textTransform: 'uppercase' }}>
                                      {currentBranding.school_name || 'DCS INTERNATIONAL SCHOOL'}
                                    </h4>
                                  );
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
                                  items.push(
                                    <p key="school_address" style={{ fontSize: '7.5px', margin: 0, color: '#64748b' }}>
                                      {currentBranding.school_address || 'Dummy Layout, Electronic City, Bengaluru - 560 100'}
                                    </p>
                                  );
                                }
                                else if (key === 'school_phone') {
                                  const nextKey = fieldOrder[i + 1];
                                  const phoneVal = currentBranding.school_phone || currentBranding.phone;
                                  if (nextKey === 'alternative_contact_number' && (phoneVal || currentBranding.alternative_contact_number)) {
                                    items.push(
                                      <p key="combined_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                        Phone: {phoneVal || '(M) : 9876543210'}{currentBranding.alternative_contact_number ? `, ${currentBranding.alternative_contact_number}` : ''}
                                      </p>
                                    );
                                    i++;
                                  } else {
                                    items.push(
                                      <p key="school_phone" style={{ fontSize: '7.5px', margin: 0, color: secondaryColor, fontWeight: 'bold' }}>
                                        Phone: {phoneVal || '(M) : 9876543210'}
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
                        Fee Receipt
                      </h5>
                    </div>

                    {/* Metadata layout grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px 20px', marginBottom: '16px', fontSize: '9.5px', position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Student's Name :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.student_name}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Grade :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.class}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '95px', flexShrink: 0 }}>Phone No. :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.parent_phone || formData.phone_number || '-'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>No. :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontWeight: 'bold', color: 'red', fontFamily: 'Courier, monospace', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {previewData?.receipt_no || 'FEE-YYYY-XXXX'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>Date :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {new Date(formData.date).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '40px', flexShrink: 0 }}>Year :</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.academic_year}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                          <span style={{ color: currentLayout.secondary_color, fontWeight: 'bold', marginRight: '4px', whiteSpace: 'nowrap', width: '85px', flexShrink: 0 }}>Payment Mode:</span>
                          <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                            {formData.payment_mode || 'Cash'}
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
                        {feeRows.map((row, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'center' }}>{idx + 1}.</td>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px' }}>{row.label}</td>
                            <td style={{ border: '1px solid ' + currentLayout.primary_color, padding: '5px', textAlign: 'right', fontWeight: 'bold' }}>{row.value}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr style={{ fontWeight: 'bold' }}>
                          <td colSpan="2" style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', textTransform: 'uppercase' }}>TOTAL</td>
                          <td style={{ border: '1px solid ' + currentLayout.primary_color, borderTop: '2px solid ' + currentLayout.primary_color, padding: '6px', textAlign: 'right', color: currentLayout.primary_color }}>
                            Rs. {Number(formData.amount).toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Rupees in Words */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: '10px', fontSize: '9px', position: 'relative', zIndex: 1 }}>
                      <strong style={{ color: currentLayout.primary_color, marginRight: '4px', whiteSpace: 'nowrap', width: '90px' }}>Rupees in Words:</strong>
                      <div style={{ flex: 1, borderBottom: `0.5px dashed ${currentLayout.secondary_color}`, fontStyle: 'italic', fontWeight: 'bold', color: '#000', paddingLeft: '4px', paddingBottom: '1px', lineHeight: '1.1', minHeight: '13px' }}>
                        {formData.amount_in_words || 'Zero Only'}
                      </div>
                    </div>

                    {/* Note Section */}
                    {currentLayout.show_note !== false && (
                      <div style={{ marginTop: '12px', fontSize: '8px', position: 'relative', zIndex: 1, textAlign: 'left' }}>
                        <strong style={{ color: currentLayout.primary_color }}>Note :</strong>
                        <div style={{ marginTop: '4px', color: '#000' }}>
                          {(currentLayout.note_text || "1. This is a computer generated receipt.\n2. Fees once paid will not be refunded.")
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
                              {paymentDetails.bankName && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Bank Name</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{paymentDetails.bankName}</span>
                                </div>
                              )}
                              {paymentDetails.accountNo && (
                                <div style={{ display: 'flex' }}>
                                  <span style={{ width: '85px', fontWeight: 'bold', color: currentLayout.primary_color }}>Account No</span>
                                  <span style={{ width: '10px', fontWeight: 'bold', color: currentLayout.primary_color }}>:</span>
                                  <span style={{ color: '#000' }}>{maskAccountNumber(paymentDetails.accountNo)}</span>
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
                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', fontSize: '8.5px', position: 'relative', zIndex: 1, marginTop: '35px' }}>
                      <div style={{ textAlign: 'center', width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {currentBranding.accountant_signature ? (
                          <img src={currentBranding.accountant_signature} alt="Accountant" style={{ height: '25px', objectFit: 'contain', marginBottom: '2px' }} />
                        ) : (
                          <div style={{ height: '25px' }}></div>
                        )}
                        <div style={{ borderTop: '0.5px solid ' + currentLayout.primary_color, width: '100%', paddingTop: '2px', fontWeight: 'bold' }}>Accountant Signature</div>
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

export default FeeForm;
