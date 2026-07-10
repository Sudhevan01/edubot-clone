import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { registerVisitor, searchStudentByPhone, searchVendorByPhone, searchVisitorByPhone, getOrgSettings, getQrUrl } from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
import { FaUsers, FaBuilding, FaUser, FaCar } from 'react-icons/fa';
import './VisitorEntry.css';
import './Dashboard.css';
import { triggerVisitorPassPrint } from '../../utils/vmsPrint';

// Reuse modular custom elements with disabled support
const StepperInput = ({ label, value, onChange, icon, className = "", disabled = false, error }) => {
  const increment = () => !disabled && onChange((parseInt(value) || 1) + 1);
  const decrement = () => {
    if (disabled) return;
    const newVal = (parseInt(value) || 1) - 1;
    if (newVal >= 1) onChange(newVal);
  };

  return (
    <div className={`form-group stepper-container ${className}`} style={{ opacity: disabled ? 0.75 : 1 }}>
      <label>{label}</label>
      <div className={`stepper-box ${error ? 'border-error' : ''}`} style={{ backgroundColor: disabled ? '#f1f5f9' : '#fff', cursor: disabled ? 'not-allowed' : 'default' }}>
        {icon && <span className="stepper-field-icon">{icon}</span>}
        <div className="stepper-controls">
          <button type="button" className="step-btn minus" onClick={decrement} disabled={disabled} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="step-value" style={{ color: disabled ? '#64748b' : '#1e293b' }}>{value || 1}</span>
          <button type="button" className="step-btn plus" onClick={increment} disabled={disabled} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

const getOptionIcon = (opt) => {
  if (!opt) return null;
  switch (opt.toLowerCase()) {
    case 'parent':
      return <FaUsers style={{ marginRight: '8px', color: '#64748b', fontSize: '18px', display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'vendor':
      return <FaCar style={{ marginRight: '8px', color: '#64748b', fontSize: '16px', display: 'inline-block', verticalAlign: 'middle' }} />;
    case 'other':
      return <FaUser style={{ marginRight: '8px', color: '#64748b', fontSize: '16px', display: 'inline-block', verticalAlign: 'middle' }} />;
    default:
      return null;
  }
};

const CustomDropdown = ({ label, options, placeholder, value, onChange, icon, className = "", disabled = false, error }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`form-group custom-dropdown-container ${isOpen && !disabled ? 'active' : ''} ${className}`} style={{ opacity: disabled ? 0.75 : 1 }}>
      <label>{label}</label>
      <div
        className={`custom-select-box ${isOpen && !disabled ? 'active' : ''} ${error ? 'border-error' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={disabled ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', borderColor: '#e2e8f0' } : {}}
      >
        {value && getOptionIcon(value) ? (
          <span className="dropdown-field-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {getOptionIcon(value)}
          </span>
        ) : icon ? (
          <span className="dropdown-field-icon">{icon}</span>
        ) : null}
        <span className={`select-value ${!value ? 'placeholder' : ''}`} style={disabled ? { color: '#64748b' } : {}}>
          {value || placeholder}
        </span>
        {!disabled && (
          <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {isOpen && !disabled && (
        <div className="dropdown-options">
          {options.map((opt) => (
            <div
              key={opt}
              className={`option-item ${value === opt ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {getOptionIcon(opt)}
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

const FormHeader = ({ title, subtitle, badge }) => (
  <header className="standard-form-header">
    {badge && (
      <div className="security-badge-standard">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>{badge}</span>
      </div>
    )}
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>
);

const FormFooter = ({ onCancel, onSubmit, submitLabel = "Generate Pass", disabled = false }) => (
  <div className="standard-form-footer">
    <div className="footer-top-row" style={{ justifyContent: 'flex-end' }}>
      <div className="action-buttons-standard">
        <button
          className="form-btn secondary"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="form-btn primary"
          onClick={onSubmit}
          type="submit"
          disabled={disabled}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {submitLabel}
        </button>
      </div>
    </div>
  </div>
);

const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback: try without facingMode constraints
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (fallbackErr) {
        alert("Could not access camera. Please check permissions.");
        onClose();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const MAX_WIDTH = 640;
      const MAX_HEIGHT = 640;
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      onCapture(dataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        <div className="camera-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Capture Visitor Photo</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="switch-camera-btn"
              onClick={toggleCamera}
              type="button"
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'none',
                transform: 'none'
              }}
              title="Switch Camera"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <button
              className="close-camera-btn"
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'none',
                transform: 'none'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div className="camera-view-container">
          <video ref={videoRef} autoPlay playsInline className="camera-video-feed" />
          <div className="camera-overlay-frame"></div>
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="camera-modal-footer">
          <button className="capture-action-btn" onClick={capturePhoto}>
            <div className="capture-btn-inner"></div>
          </button>
          <p>Align face within the frame and capture ({facingMode === 'environment' ? 'Back Camera' : 'Front Camera'})</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

const GateGuardDashboard = () => {
  const navigate = useNavigate();
  const [allowedGrades, setAllowedGrades] = useState([]);
  const [allowedSections, setAllowedSections] = useState([]);
  const [allowedParentReasons, setAllowedParentReasons] = useState([]);
  const [allowedVendorReasons, setAllowedVendorReasons] = useState([]);
  const [allowedOtherReasons, setAllowedOtherReasons] = useState([]);
  useEffect(() => {
    try {
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      setAllowedGrades(org.grades ? sortGrades(org.grades.split(',').map(g => g.trim())) : []);
      setAllowedSections(org.sections ? sortSections(org.sections.split(',').map(s => s.trim())) : []);
      if (org.parentReasons) setAllowedParentReasons(org.parentReasons.split(',').map(r => r.trim()));
      if (org.vendorReasons) setAllowedVendorReasons(org.vendorReasons.split(',').map(r => r.trim()));
      if (org.otherReasons) {
        const parsed = org.otherReasons.split(',').map(r => r.trim());
        if (!parsed.includes('Others')) parsed.push('Others');
        setAllowedOtherReasons(parsed);
      }
    } catch (e) { }
    const loadSettings = async () => {
      try {
        const response = await getOrgSettings();
        if (response.success && response.data) {
          setAllowedGrades(response.data.grades ? sortGrades(response.data.grades.split(',').map(g => g.trim())) : []);
          setAllowedSections(response.data.sections ? sortSections(response.data.sections.split(',').map(s => s.trim())) : []);
          if (response.data.parentReasons) {
            setAllowedParentReasons(response.data.parentReasons.split(',').map(r => r.trim()));
          }
          if (response.data.vendorReasons) {
            setAllowedVendorReasons(response.data.vendorReasons.split(',').map(r => r.trim()));
          }
          if (response.data.otherReasons) {
            const parsed = response.data.otherReasons.split(',').map(r => r.trim());
            if (!parsed.includes('Others')) parsed.push('Others');
            setAllowedOtherReasons(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to load custom settings:', err);
      }
    };
    loadSettings();
  }, []);
  // State for mandatory search fields
  const [contactNumber, setContactNumber] = useState('');
  const [visitorType, setVisitorType] = useState(''); // 'parent', 'vendor', 'other'
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [isFetched, setIsFetched] = useState(false); // true if loaded from DB
  const [showNotExistMessage, setShowNotExistMessage] = useState(false); // true if searched and not found
  const [fetchedStudentData, setFetchedStudentData] = useState(null);
  const [fetchedVendorData, setFetchedVendorData] = useState(null);
  const [hasMultipleTypes, setHasMultipleTypes] = useState(false);
  const [fetchedStudents, setFetchedStudents] = useState([]);

  const [formState, setFormState] = useState({
    studentName: '',
    parentName: '',
    class: '',
    section: '',
    relation: '',
    reason: '',
    vendorName: '',
    companyName: '',
    vehicleNumber: '',
    vendorReason: '',
    otherName: '',
    otherReason: '',
    otherCustomReason: '',
    noofentry: 1,
  });

  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [submittedVisitor, setSubmittedVisitor] = useState(null);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  // Phone number clean and formatting (+91)
  const formatPhone = (val) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    if (cleaned.length === 10) return '+91' + cleaned;
    return val;
  };

  const getDigitsCount = (val) => {
    if (!val) return 0;
    const digits = val.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) {
      return 10;
    }
    return digits.length;
  };

  // Reset form fields
  const resetForm = () => {
    setFormState({
      studentName: '',
      parentName: '',
      class: '',
      section: '',
      relation: '',
      reason: '',
      vendorName: '',
      companyName: '',
      vehicleNumber: '',
      vendorReason: '',
      otherName: '',
      otherReason: '',
      otherCustomReason: '',
      noofentry: 1,
    });
    setSelectedImage(null);
    setIsFetched(false);
    setShowNotExistMessage(false);
    setErrors({});
    setFetchedStudentData(null);
    setFetchedVendorData(null);
    setHasMultipleTypes(false);
    setFetchedStudents([]);
  };

  const handleStudentSelect = (student) => {
    setFormState(prev => ({
      ...prev,
      studentName: student.studentName || '',
      parentName: student.parentName || '',
      class: student.grade || '',
      section: student.section || '',
      relation: student.relation || '',
    }));
  };

  const handleSearch = async (phone) => {
    const formatted = formatPhone(phone);
    if (formatted.length === 13 && formatted.startsWith('+91')) {
      setLoadingSearch(true);
      setShowNotExistMessage(false); // Reset warning on new search
      setFetchedStudentData(null);
      setFetchedVendorData(null);
      setHasMultipleTypes(false);
      setFetchedStudents([]);
      try {
        let studentData = null;
        let vendorData = null;
        let studentsList = [];

        // 1. Check Student Table first
        try {
          const studentRes = await searchStudentByPhone(formatted);
          if (studentRes.success && studentRes.data) {
            studentsList = studentRes.students || [studentRes.data];
            setFetchedStudents(studentsList);
            studentData = studentsList[0];
            setFetchedStudentData(studentData);
          }
        } catch (studentErr) {
          console.log("No student record found for phone:", formatted);
        }

        // 2. Check Vendor Table second
        try {
          const vendorRes = await searchVendorByPhone(formatted);
          if (vendorRes.success && vendorRes.data) {
            vendorData = vendorRes.data;
            setFetchedVendorData(vendorData);
          }
        } catch (vendorErr) {
          console.log("No vendor record found for phone:", formatted);
        }

        // 3. Process combined results
        if (studentData && vendorData) {
          setHasMultipleTypes(true);
          setFormState(prev => ({
            ...prev,
            studentName: studentData.studentName || '',
            parentName: studentData.parentName || '',
            class: studentData.grade || '',
            section: studentData.section || '',
            relation: studentData.relation || '',
          }));
          setVisitorType('parent');
          setIsFetched(true);
          setLoadingSearch(false);
          return;
        } else if (studentData) {
          setFormState(prev => ({
            ...prev,
            studentName: studentData.studentName || '',
            parentName: studentData.parentName || '',
            class: studentData.grade || '',
            section: studentData.section || '',
            relation: studentData.relation || '',
          }));
          setVisitorType('parent');
          setIsFetched(true);
          setLoadingSearch(false);
          return;
        } else if (vendorData) {
          setFormState(prev => ({
            ...prev,
            vendorName: vendorData.name || '',
            companyName: vendorData.company || '',
          }));
          setVisitorType('vendor');
          setIsFetched(true);
          setLoadingSearch(false);
          return;
        }

        // 4. Check Visitor Table third (only if not found in Student and Vendor)
        try {
          const visitorRes = await searchVisitorByPhone(formatted);
          if (visitorRes.success && visitorRes.data) {
            const visitor = visitorRes.data;
            const type = visitor.type.toLowerCase(); // 'parent', 'vendor', 'other'

            if (type === 'parent') {
              setFormState(prev => ({
                ...prev,
                parentName: visitor.name || '',
              }));
              setVisitorType('parent');
              setIsFetched(false); // student record not found, so allow manual entry
              setLoadingSearch(false);
              return;
            } else if (type === 'vendor') {
              setFormState(prev => ({
                ...prev,
                vendorName: visitor.name || '',
              }));
              setVisitorType('vendor');
              setIsFetched(false); // vendor record not found in vendor master, allow manual entry
              setLoadingSearch(false);
              return;
            } else if (type === 'other') {
              setFormState(prev => ({
                ...prev,
                otherName: visitor.name || '',
              }));
              setVisitorType('other');
              setIsFetched(true);
              setLoadingSearch(false);
              return;
            }
          }
        } catch (visitorErr) {
          console.log("No visitor record found for phone:", formatted);
        }

        // 5. If not found in any table, allow manual select
        setIsFetched(false);
        setShowNotExistMessage(true);
      } catch (err) {
        console.log("Error during auto-search:", err.message);
        setIsFetched(false);
        setShowNotExistMessage(true);
      } finally {
        setLoadingSearch(false);
      }
    }
  };

  // Input changes and event triggers
  const handlePhoneChange = (val) => {
    if (/^[+\d\s]*$/.test(val)) {
      const digitsOnly = val.replace(/\D/g, '');
      const maxDigits = val.startsWith('+91') ? 12 : 10;
      if (digitsOnly.length <= maxDigits) {
        setContactNumber(val);
        setErrors(prev => ({ ...prev, phone: '' }));
        const formatted = formatPhone(val);
        if (formatted.length === 13) {
          handleSearch(formatted);
        } else {
          resetForm();
          setVisitorType('');
          setShowNotExistMessage(false);
        }
      }
    }
  };

  const handleTypeSelect = (type) => {
    setVisitorType(type);
    
    if (type === 'parent' && fetchedStudents.length > 0) {
      const activeStudent = fetchedStudents[0];
      setFormState({
        studentName: activeStudent.studentName || '',
        parentName: activeStudent.parentName || '',
        class: activeStudent.grade || '',
        section: activeStudent.section || '',
        relation: activeStudent.relation || '',
        reason: '',
        vendorName: '',
        companyName: '',
        vehicleNumber: '',
        vendorReason: '',
        otherName: '',
        otherReason: '',
        otherCustomReason: '',
        noofentry: 1,
      });
      setIsFetched(true);
    } else if (type === 'parent' && fetchedStudentData) {
      setFormState({
        studentName: fetchedStudentData.studentName || '',
        parentName: fetchedStudentData.parentName || '',
        class: fetchedStudentData.grade || '',
        section: fetchedStudentData.section || '',
        relation: fetchedStudentData.relation || '',
        reason: '',
        vendorName: '',
        companyName: '',
        vehicleNumber: '',
        vendorReason: '',
        otherName: '',
        otherReason: '',
        otherCustomReason: '',
        noofentry: 1,
      });
      setIsFetched(true);
    } else if (type === 'vendor' && fetchedVendorData) {
      setFormState({
        studentName: '',
        parentName: '',
        class: '',
        section: '',
        relation: '',
        reason: '',
        vendorName: fetchedVendorData.name || '',
        companyName: fetchedVendorData.company || '',
        vehicleNumber: '',
        vendorReason: '',
        otherName: '',
        otherReason: '',
        otherCustomReason: '',
        noofentry: 1,
      });
      setIsFetched(true);
    } else {
      setFormState({
        studentName: '',
        parentName: '',
        class: '',
        section: '',
        relation: '',
        reason: '',
        vendorName: '',
        companyName: '',
        vehicleNumber: '',
        vendorReason: '',
        otherName: '',
        otherReason: '',
        otherCustomReason: '',
        noofentry: 1,
      });
      setIsFetched(false);
    }
    setSelectedImage(null);
  };

  const handlePhoneBlur = () => {
    if (contactNumber) {
      const formatted = formatPhone(contactNumber);
      if (formatted.length === 13) {
        handleSearch(formatted);
      }
    }
  };

  const handleNameChange = (field, value) => {
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormState(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      setErrors(prev => ({ ...prev, [field]: 'Only letters are allowed' }));
    }
  };

  const triggerUpload = () => {
    setIsCameraOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 640;
          const MAX_HEIGHT = 640;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setSelectedImage(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancel = () => {
    resetForm();
    setContactNumber('');
    setVisitorType('');
    setShowBadge(false);
    setSubmittedVisitor(null);
    setShowNotExistMessage(false);
  };

  const isFormValid = (type) => {
    if (type === 'parent') {
      const { studentName, parentName, class: grade, section, relation, reason } = formState;
      if (!studentName || !parentName || !grade || !section || !relation || !reason) return false;
    } else if (type === 'vendor') {
      const { vendorName, companyName, vendorReason, vehicleNumber } = formState;
      if (!vendorName || !companyName || !vendorReason) return false;
      if (vehicleNumber && !/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(vehicleNumber)) return false;
    } else {
      const { otherName, otherReason } = formState;
      if (!otherName || !otherReason) return false;
    }
    return true;
  };

  const handlePreparePass = async (type) => {
    // Field Validation
    const newErrors = {};
    const getDigitsCount = (val) => val ? val.replace(/\D/g, '').replace(/^91/, '').length : 0;

    if (type === 'parent') {
      const { studentName, parentName, class: grade, section, relation, reason } = formState;
      if (!contactNumber) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(contactNumber) !== 10) {
        newErrors.phone = "Contact number must be exactly 10 digits";
      }

      if (!studentName?.trim()) {
        newErrors.studentName = "Student Name is mandatory";
      } else if (!/^[A-Za-z\s]+$/.test(studentName)) {
        newErrors.studentName = "Student Name can only contain letters";
      }

      if (!parentName?.trim()) {
        newErrors.parentName = "Parent Name is mandatory";
      } else if (!/^[A-Za-z\s]+$/.test(parentName)) {
        newErrors.parentName = "Parent Name can only contain letters";
      }

      if (!grade) newErrors.class = "Grade is mandatory";
      if (!section) newErrors.section = "Section is mandatory";
      if (!relation) newErrors.relation = "Relation is mandatory";
      if (!reason) newErrors.reason = "Reason for Visit is mandatory";
    }
    else if (type === 'vendor') {
      const { vendorName, companyName, vehicleNumber, vendorReason } = formState;
      if (!contactNumber) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(contactNumber) !== 10) {
        newErrors.phone = "Contact number must be exactly 10 digits";
      }

      if (!vendorName?.trim()) {
        newErrors.vendorName = "Vendor Name is mandatory";
      } else if (!/^[A-Za-z\s]+$/.test(vendorName)) {
        newErrors.vendorName = "Vendor Name can only contain letters";
      }

      if (!companyName?.trim()) {
        newErrors.companyName = "Company Name is mandatory";
      }

      if (vehicleNumber && !/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(vehicleNumber)) {
        newErrors.vehicleNumber = "Vehicle number must be valid format (e.g. KA01AB1234)";
      }

      if (!vendorReason) newErrors.vendorReason = "Reason for Visit is mandatory";
    }
    else { // other
      const { otherName, otherReason, otherCustomReason } = formState;
      if (!contactNumber) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(contactNumber) !== 10) {
        newErrors.phone = "Contact number must be exactly 10 digits";
      }

      if (!otherName?.trim()) {
        newErrors.otherName = "Visitor Name is mandatory";
      } else if (!/^[A-Za-z\s]+$/.test(otherName)) {
        newErrors.otherName = "Visitor Name can only contain letters";
      }

      if (!otherReason) {
        newErrors.otherReason = "Reason for Visit is mandatory";
      } else if (otherReason === 'Others' && !otherCustomReason?.trim()) {
        newErrors.otherCustomReason = "Actual Reason for Visit is mandatory";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const formattedPhone = formatPhone(contactNumber);
      const payload = {
        type: type.toUpperCase(),
        purpose: type === 'other' && formState.otherReason === 'Others'
          ? formState.otherCustomReason
          : (formState.reason || formState.vendorReason || formState.otherReason || 'General'),
        photo: selectedImage,
        noofentry: formState.noofentry || 1,
        vehicleNumber: formState.vehicleNumber || null,
        phone: formattedPhone
      };

      if (type === 'parent') {
        payload.name = formState.parentName;
        payload.studentName = formState.studentName;
        payload.grade = formState.class;
        payload.class = formState.class;
        payload.section = formState.section;
        payload.relation = formState.relation;
      } else if (type === 'vendor') {
        payload.name = formState.vendorName;
        payload.companyName = formState.companyName;
      } else {
        payload.name = formState.otherName;
      }

      const response = await registerVisitor(payload);

      if (response.success) {
        const { visitor: apiVisitor, visit: apiVisit } = response.data;
        const savedVisitor = {
          ...formState,
          type: type,
          name: (type === 'parent' ? formState.parentName : (type === 'vendor' ? formState.vendorName : formState.otherName)),
          reason: type === 'other' && formState.otherReason === 'Others'
            ? formState.otherCustomReason
            : (formState.reason || formState.vendorReason || formState.otherReason || 'General'),
          id: apiVisit.id,
          qrCode: apiVisit.qrCode,
          displayId: apiVisit.displayId,
          photo: selectedImage || apiVisitor.photo,
          entryTime: apiVisit.createdAt
        };

        // ✅ AUTO-PRINT: Trigger Bluetooth print BEFORE UI update
        console.log('[VMS Print] Dashboard registration success — triggering visitor pass print');
        triggerVisitorPassPrint(apiVisitor, apiVisit, selectedImage);

        // Small delay to allow bridge to initiate print
        await new Promise(r => setTimeout(r, 200));

        setSubmittedVisitor(savedVisitor);
        setShowBadge(true);
      } else {
        alert(response.message || 'Failed to save visitor entry');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error saving to database');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintOnly = () => {
    if (typeof window.Android === 'undefined') {
      console.log('[VMS Print] No Android bridge — using browser print fallback');
      window.print();
      // Delay reset so the browser has time to capture the printable badge before it unmounts
      setTimeout(() => {
        handleCancel();
      }, 1000);
    } else {
      handleCancel();
    }
  };

  // Render Form Fields Only (no card wrapper or header)
  const renderFormFieldsOnly = () => {
    if (visitorType === 'parent') {
      return (
        <div className="parent-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Student Name</label>
              <div className="input-with-icon">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="Student Name"
                  value={formState.studentName}
                  onChange={(e) => handleNameChange('studentName', e.target.value)}
                  disabled={isFetched}
                  style={isFetched ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  className={errors.studentName ? 'border-error' : ''}
                />
              </div>
              {errors.studentName && <p className="error-text">{errors.studentName}</p>}
            </div>

            <div className="form-group">
              <label>Parent Name</label>
              <div className="input-with-icon">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formState.parentName}
                  onChange={(e) => handleNameChange('parentName', e.target.value)}
                  disabled={isFetched}
                  style={isFetched ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  className={errors.parentName ? 'border-error' : ''}
                />
              </div>
              {errors.parentName && <p className="error-text">{errors.parentName}</p>}
            </div>

            <div className="form-row-nested">
              <CustomDropdown
                label="Grade"
                placeholder="Select"
                options={allowedGrades}
                value={formState.class}
                onChange={(val) => {
                  setFormState({ ...formState, class: val });
                  setErrors(prev => ({ ...prev, class: '' }));
                }}
                disabled={isFetched}
                error={errors.class}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                )}
              />
              <CustomDropdown
                label="Section"
                placeholder="Select"
                options={allowedSections}
                value={formState.section}
                onChange={(val) => {
                  setFormState({ ...formState, section: val });
                  setErrors(prev => ({ ...prev, section: '' }));
                }}
                disabled={isFetched}
                error={errors.section}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                )}
              />
            </div>

            <div className="parent-mobile-inline">
              <CustomDropdown
                label="Relation"
                placeholder="Select"
                options={['Father', 'Mother', 'Guardian', 'Other']}
                value={formState.relation}
                onChange={(val) => {
                  setFormState({ ...formState, relation: val });
                  setErrors(prev => ({ ...prev, relation: '' }));
                }}
                disabled={isFetched}
                error={errors.relation}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                )}
              />

              <StepperInput
                label="No of Entry"
                value={formState.noofentry}
                onChange={(val) => {
                  setFormState({ ...formState, noofentry: val });
                  setErrors(prev => ({ ...prev, noofentry: '' }));
                }}
                error={errors.noofentry}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                )}
              />
            </div>

            <CustomDropdown
              label="Reason for Visit"
              placeholder="Select"
              options={allowedParentReasons}
              value={formState.reason}
              onChange={(val) => {
                setFormState({ ...formState, reason: val });
                setErrors(prev => ({ ...prev, reason: '' }));
              }}
              error={errors.reason}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            />
          </div>

          <div className="photo-profile-section-standard parent-compact-section">
            <div className="photo-circle-standard parent-compact-circle" onClick={triggerUpload}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="photo-preview-img-standard" />
              ) : (
                <div className="upload-placeholder-standard">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Capture Photo</span>
                </div>
              )}
            </div>
            <p className="photo-label-standard">Visitor Identification Photo</p>
          </div>

          <FormFooter
            onCancel={handleCancel}
            onSubmit={() => handlePreparePass('parent')}
            disabled={loading}
          />
        </div>
      );
    } else if (visitorType === 'vendor') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Vendor Name</label>
              <div className="input-with-icon">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formState.vendorName}
                  onChange={(e) => handleNameChange('vendorName', e.target.value)}
                  disabled={isFetched}
                  style={isFetched ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
              </div>
              {errors.vendorName && <p className="error-text">{errors.vendorName}</p>}
            </div>

            <div className="form-group">
              <label>Company Name</label>
              <div className="input-with-icon">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <input
                  type="text"
                  placeholder="e.g. Tech Solutions Inc."
                  value={formState.companyName}
                  onChange={(e) => {
                    setFormState({ ...formState, companyName: e.target.value });
                    setErrors(prev => ({ ...prev, companyName: '' }));
                  }}
                  disabled={isFetched}
                  style={isFetched ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  className={errors.companyName ? 'border-error' : ''}
                />
              </div>
              {errors.companyName && <p className="error-text">{errors.companyName}</p>}
            </div>

            <div className="parent-mobile-inline">
              <div className="form-group">
                <label>Vehicle Number (Optional)</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g. KA01AB1234"
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                    value={formState.vehicleNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormState({ ...formState, vehicleNumber: val });
                      setErrors(prev => ({ ...prev, vehicleNumber: '' }));
                    }}
                    className={errors.vehicleNumber ? 'border-error' : ''}
                  />
                </div>
                {errors.vehicleNumber ? (
                  <p className="error-text">{errors.vehicleNumber}</p>
                ) : (
                  formState.vehicleNumber && !/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(formState.vehicleNumber) && (
                    <p className="error-text">Please enter a valid vehicle number (e.g. KA01AB1234)</p>
                  )
                )}
              </div>

              <StepperInput
                label="No of Entry"
                value={formState.noofentry}
                onChange={(val) => {
                  setFormState({ ...formState, noofentry: val });
                  setErrors(prev => ({ ...prev, noofentry: '' }));
                }}
                error={errors.noofentry}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                )}
              />
            </div>

            <CustomDropdown
              className="full-width-field"
              label="Reason for Visit"
              placeholder="Select"
              options={allowedVendorReasons}
              value={formState.vendorReason}
              onChange={(val) => {
                setFormState({ ...formState, vendorReason: val });
                setErrors(prev => ({ ...prev, vendorReason: '' }));
              }}
              error={errors.vendorReason}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            />
          </div>

          <div className="photo-profile-section-standard parent-compact-section">
            <div className="photo-circle-standard parent-compact-circle" onClick={triggerUpload}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="photo-preview-img-standard" />
              ) : (
                <div className="upload-placeholder-standard">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Capture Photo</span>
                </div>
              )}
            </div>
            <p className="photo-label-standard">Visitor Identification Photo</p>
          </div>

          <FormFooter
            onCancel={handleCancel}
            onSubmit={() => handlePreparePass('vendor')}
            disabled={loading}
          />
        </div>
      );
    } else if (visitorType === 'other') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div className="form-grid">
            <div className="form-group">
              <label>Visitor Name</label>
              <div className="input-with-icon">
                <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formState.otherName}
                  onChange={(e) => handleNameChange('otherName', e.target.value)}
                  disabled={isFetched}
                  style={isFetched ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                  className={errors.otherName ? 'border-error' : ''}
                />
              </div>
              {errors.otherName && <p className="error-text">{errors.otherName}</p>}
            </div>

            <StepperInput
              label="No of Entry"
              value={formState.noofentry}
              onChange={(val) => {
                setFormState({ ...formState, noofentry: val });
                setErrors(prev => ({ ...prev, noofentry: '' }));
              }}
              error={errors.noofentry}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              )}
            />

            <CustomDropdown
              className="full-width-field"
              label="Reason for Visit"
              placeholder="Select"
              options={allowedOtherReasons}
              value={formState.otherReason}
              onChange={(val) => {
                setFormState({ ...formState, otherReason: val });
                setErrors(prev => ({ ...prev, otherReason: '' }));
              }}
              error={errors.otherReason}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            />

            {formState.otherReason === 'Others' && (
              <div className="form-group full-width-field">
                <label>Actual Reason for Visit</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter actual reason for visit"
                    value={formState.otherCustomReason}
                    onChange={(e) => {
                      setFormState({ ...formState, otherCustomReason: e.target.value });
                      setErrors(prev => ({ ...prev, otherCustomReason: '' }));
                    }}
                    className={errors.otherCustomReason ? 'border-error' : ''}
                  />
                </div>
                {errors.otherCustomReason && <p className="error-text">{errors.otherCustomReason}</p>}
              </div>
            )}
          </div>

          <div className="photo-profile-section-standard parent-compact-section">
            <div className="photo-circle-standard parent-compact-circle" onClick={triggerUpload}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="photo-preview-img-standard" />
              ) : (
                <div className="upload-placeholder-standard">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Capture Photo</span>
                </div>
              )}
            </div>
            <p className="photo-label-standard">Visitor Identification Photo</p>
          </div>

          <FormFooter
            onCancel={handleCancel}
            onSubmit={() => handlePreparePass('other')}
            disabled={loading}
          />
        </div>
      );
    }
    return null;
  };

  const handleBackToForm = () => {
    resetForm();
    setContactNumber('');
    setVisitorType('');
    setSubmittedVisitor(null);
    setShowBadge(false);
  };

  const BadgePreview = ({ visitor, onBack }) => {
    if (!visitor) return null;

    useEffect(() => {
      const timer = setTimeout(() => {
        handleBackToForm();
      }, 5000);
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="badge-preview-screen">
        <div className="badge-preview-container">
          <div id="printable-badge" className="visitor-badge-card">
            <div className="badge-content">
              {/* Header: Logo and Title */}
              <div className="badge-header-row">
                <img
                  src={(() => {
                    try {
                      const org = JSON.parse(localStorage.getItem('vms_org'));
                      return org?.logo || '/assets/images/logo1.png';
                    } catch {
                      return '/assets/images/logo1.png';
                    }
                  })()}
                  alt="Logo"
                  className="badge-logo"
                />
                <span className="badge-type-label">Visitor Pass</span>
              </div>

              {/* Main Section: Details Left, Photo Right */}
              <div className="badge-middle-section">
                <div className="badge-info-left">
                  <div className="badge-info-item">
                    <label>NAME</label>
                    <h1 className="badge-visitor-name">{visitor.name || 'N/A'}</h1>
                  </div>

                  <div className="badge-info-item">
                    <label>VISITOR TYPE</label>
                    <p className="badge-text-primary">{visitor.type.toUpperCase()}</p>
                  </div>

                  <div className="badge-info-item">
                    <label>REASON FOR VISIT</label>
                    <p className="badge-text-secondary">{visitor.reason || 'General'}</p>
                  </div>

                  <div className="badge-info-item">
                    <label>ENTRY TIME</label>
                    <p className="badge-text-secondary">
                      {new Date(visitor.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="badge-photo-right">
                  <div className="badge-photo-circle">
                    {visitor.photo ? (
                      <img
                        src={visitor.photo.startsWith('data:') || visitor.photo.startsWith('http') ? visitor.photo : `${import.meta.env.VITE_API_URL}/${visitor.photo}`}
                        alt="Visitor"
                        className="badge-photo-img"
                      />
                    ) : (
                      <div className="badge-initials">
                        {visitor.name ? visitor.name.charAt(0).toUpperCase() : 'V'}
                      </div>
                    )}
                  </div>

                  <div className="badge-qr-section-right">
                    {visitor.qrCode ? (
                      <img
                        src={getQrUrl(visitor.qrCode)}
                        alt="QR Code"
                        className="badge-qr-image-small"
                      />
                    ) : (
                      <img
                        src={getQrUrl(visitor.id || 'PREVIEW')}
                        alt="QR Code"
                        className="badge-qr-image-small"
                      />
                    )}
                    <p className="badge-visitor-id-small">{visitor.displayId || visitor.id || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="badge-preview-footer">
            <button className="back-btn" onClick={() => navigate('/gateguard/entry-list')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              Entry List
            </button>
            <button className="print-btn" onClick={handleBackToForm}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back to Form
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="welcome-container">
      {showBadge ? (
        <BadgePreview visitor={submittedVisitor} onBack={() => setShowBadge(false)} />
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="welcome-header">
            <h1>Welcome</h1>
            <p>Please select the visitor type to begin registration</p>
          </div>

          {/* Combined Search & Form Card */}
          <div className="entry-card-standard search-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-grid">
              <div className="form-group" style={{ position: 'relative' }}>
                <label>
                  Contact Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="+91 XXXXXXXXXX"
                    value={contactNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    className={errors.phone ? 'border-error' : ''}
                  />
                </div>
                {errors.phone && <p className="error-text">{errors.phone}</p>}
                {showNotExistMessage && (
                  <p className="error-text" style={{
                    position: 'absolute',
                    bottom: '-24px',
                    left: 0,
                    margin: 0,
                    whiteSpace: 'nowrap'
                  }}>
                    Contact number is not existed in the database
                  </p>
                )}
                {hasMultipleTypes && (
                  <div className="multiple-records-selector" style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>
                      Multiple records found. Select profile:
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
                      {fetchedStudents.map((st, idx) => {
                        const isActive = visitorType === 'parent' && formState.studentName === st.studentName;
                        return (
                          <button
                            key={`parent-${idx}`}
                            type="button"
                            onClick={() => {
                              setVisitorType('parent');
                              handleStudentSelect(st);
                            }}
                            style={{
                              flex: 1,
                              minWidth: 'calc(33.33% - 6px)',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              border: '1.5px solid',
                              borderColor: isActive ? '#1d4ed8' : '#cbd5e1',
                              background: isActive ? '#eff6ff' : '#fff',
                              color: isActive ? '#1d4ed8' : '#475569',
                              fontSize: '13px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>Parent ({st.studentName})</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorType('vendor');
                          setFormState(prev => ({
                            ...prev,
                            studentName: '',
                            parentName: '',
                            class: '',
                            section: '',
                            relation: '',
                            reason: '',
                            vendorName: fetchedVendorData?.name || '',
                            companyName: fetchedVendorData?.company || '',
                          }));
                        }}
                        style={{
                          flex: 1,
                          minWidth: 'calc(33.33% - 6px)',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1.5px solid',
                          borderColor: visitorType === 'vendor' ? '#1d4ed8' : '#cbd5e1',
                          background: visitorType === 'vendor' ? '#eff6ff' : '#fff',
                          color: visitorType === 'vendor' ? '#1d4ed8' : '#475569',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>Vendor ({fetchedVendorData?.name})</span>
                      </button>
                    </div>
                  </div>
                )}
                {!hasMultipleTypes && fetchedStudents.length > 1 && visitorType === 'parent' && (
                  <div className="multiple-records-selector" style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', boxSizing: 'border-box' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>
                      Multiple records found. Select profile:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      {fetchedStudents.map((st, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleStudentSelect(st)}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: '10px',
                            border: '1.5px solid',
                            borderColor: formState.studentName === st.studentName ? '#1d4ed8' : '#cbd5e1',
                            background: formState.studentName === st.studentName ? '#eff6ff' : '#fff',
                            color: formState.studentName === st.studentName ? '#1d4ed8' : '#475569',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>Student ({st.studentName})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <CustomDropdown
                label="Visitor Type *"
                placeholder="Select Visitor Type"
                options={['Parent', 'Vendor', 'Other']}
                value={visitorType ? (visitorType.charAt(0).toUpperCase() + visitorType.slice(1)) : ''}
                onChange={(val) => handleTypeSelect(val.toLowerCase())}
                disabled={isFetched}
                icon={(
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  </svg>
                )}
              />
            </div>
            {loadingSearch && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2563eb', fontSize: '0.875rem' }}>
                <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: '0.25' }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path style={{ opacity: '0.75' }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching database in real-time...</span>
              </div>
            )}

            {/* Inline Form rendering directly inside selection card */}
            {getDigitsCount(contactNumber) === 10 && visitorType && renderFormFieldsOnly()}

            {visitorType && getDigitsCount(contactNumber) < 10 && (
              <div style={{ marginTop: '1rem', textAlign: 'center', padding: '1.5rem', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b', boxSizing: 'border-box' }}>
                Please enter a complete 10-digit contact number to display the registration form.
              </div>
            )}
          </div>
        </div>
      )}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setSelectedImage(dataUrl)}
      />
    </div>
  );
};

export default GateGuardDashboard;
