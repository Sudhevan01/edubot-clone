import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './VisitorEntry.css';
import { registerVisitor, searchStudentByPhone, searchVendorByPhone, searchVisitorByPhone, getQrUrl, getOrgSettings } from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
import { triggerVisitorPassPrint, printElementFast } from '../../utils/vmsPrint';

const StepperInput = ({ label, value, onChange, icon, className = "", error }) => {
  const increment = () => onChange((parseInt(value) || 1) + 1);
  const decrement = () => {
    const newVal = (parseInt(value) || 1) - 1;
    if (newVal >= 1) onChange(newVal);
  };

  return (
    <div className={`form-group stepper-container ${className}`}>
      <label>{label}</label>
      <div className={`stepper-box ${error ? 'border-error' : ''}`}>
        {icon && <span className="stepper-field-icon">{icon}</span>}
        <div className="stepper-controls">
          <button type="button" className="step-btn minus" onClick={decrement}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <span className="step-value">{value || 1}</span>
          <button type="button" className="step-btn plus" onClick={increment}>
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

const CustomDropdown = ({ label, options, placeholder, value, onChange, icon, className = "", error }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`form-group custom-dropdown-container ${isOpen ? 'active' : ''} ${className}`}>
      <label>{label}</label>
      <div className={`custom-select-box ${isOpen ? 'active' : ''} ${error ? 'border-error' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {icon && <span className="dropdown-field-icon">{icon}</span>}
        <span className={`select-value ${!value ? 'placeholder' : ''}`}>{value || placeholder}</span>
        <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {isOpen && (
        <div className="dropdown-options">
          {options.map((opt) => (
            <div
              key={opt}
              className={`option-item ${value === opt ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
            >
              {opt}
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

const FormFooter = ({ onCancel, onSubmit, submitLabel = "Generate Pass", isFullWidth = false, disabled = false }) => (
  <div className="standard-form-footer">
    <div className="footer-top-row" style={{ justifyContent: 'flex-end' }}>
      <div className={`action-buttons-standard ${isFullWidth ? 'full-width' : ''}`}>
        <button className="form-btn secondary" onClick={onCancel} type="button" disabled={false}>Cancel</button>
        <button className="form-btn primary" onClick={onSubmit} type="submit" disabled={disabled}>
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
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, videoWidth, videoHeight);

      // Use PNG format for maximum clarity
      const dataUrl = canvas.toDataURL('image/png');
      onCapture(dataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="camera-modal-overlay">
      <div className="camera-modal-content">
        <div className="camera-modal-header">
          <h3>Capture Visitor Photo</h3>
          <button className="close-camera-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
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
          <p>Align face within the frame and capture</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

const VisitorEntry = () => {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [submittedVisitor, setSubmittedVisitor] = useState(null);
  const [lastVisit, setLastVisit] = useState(null);

  const [allowedGrades, setAllowedGrades] = useState([]);
  const [allowedSections, setAllowedSections] = useState([]);
  const [allowedParentReasons, setAllowedParentReasons] = useState([]);
  const [allowedVendorReasons, setAllowedVendorReasons] = useState([]);
  const [allowedOtherReasons, setAllowedOtherReasons] = useState([]);
  const [dualRoleData, setDualRoleData] = useState(null); // { parentData, vendorData, formattedPhone }
  const [showRoleSelectModal, setShowRoleSelectModal] = useState(false);

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
    } catch (e) {}

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


  const [formState, setFormState] = useState({
    class: '',
    section: '',
    reason: '',
    vendorName: '',
    companyName: '',
    vendorContact: '',
    vehicleNumber: '',
    vendorReason: '',
    otherName: '',
    otherContact: '',
    otherReason: '',
    otherCustomReason: '',
    relation: '',
    noofentry: 1
  });

  const [errors, setErrors] = useState({});

  const showError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }, 2000);
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) return '+' + cleaned;
    if (cleaned.length === 10) return '+91' + cleaned;
    return value;
  };

  const handlePhoneBlur = async (type, value) => {
    const formatted = formatPhone(value);
    const fieldMap = {
      parent: 'parentContact',
      vendor: 'vendorContact',
      other: 'otherContact'
    };
    const field = fieldMap[type];

    setFormState(prev => ({ ...prev, [field]: formatted }));

    // Auto-fetch logic
    if (formatted.length === 13 && formatted.startsWith('+91')) {
      try {
        // Run both checks in parallel to detect if the phone matches both roles
        const [parentRes, vendorRes] = await Promise.allSettled([
          searchStudentByPhone(formatted),
          searchVendorByPhone(formatted)
        ]);

        const parentSuccess = parentRes.status === 'fulfilled' && parentRes.value.success;
        const vendorSuccess = vendorRes.status === 'fulfilled' && vendorRes.value.success;

        if (parentSuccess && vendorSuccess) {
          // Both records exist! Show selection modal.
          setDualRoleData({
            parentData: parentRes.value.data,
            vendorData: vendorRes.value.data,
            formattedPhone: formatted
          });
          setShowRoleSelectModal(true);
          return;
        }

        // Fallback to single match logic if only one matches
        if (parentSuccess && type === 'parent') {
          const data = parentRes.value.data;
          setFormState(prev => ({
            ...prev,
            studentName: data.studentName,
            parentName: data.parentName,
            class: data.grade,
            section: data.section,
            relation: data.relation
          }));
        } else if (vendorSuccess && type === 'vendor') {
          const data = vendorRes.value.data;
          setFormState(prev => ({
            ...prev,
            vendorName: data.name,
            companyName: data.company
          }));
        }

        // Fetch from Visitor table to get the name for 'other' type
        const visitorRes = await searchVisitorByPhone(formatted);
        if (visitorRes.success && type === 'other') {
          setFormState(prev => ({
            ...prev,
            otherName: visitorRes.data.name
          }));
        }
      } catch (err) {
        console.log("No existing record found for this number", err);
      }
    }
  };

  const handlePhoneChange = (type, value) => {
    const fieldMap = {
      parent: 'parentContact',
      vendor: 'vendorContact',
      other: 'otherContact'
    };
    const field = fieldMap[type];
    if (/^[+\d\s]*$/.test(value)) {
      const digitsOnly = value.replace(/\D/g, '');
      const prevValue = formState[field] || '';
      const isDeleting = value.length < prevValue.length;
      const maxDigits = value.startsWith('+91') ? 12 : 10;

      if (digitsOnly.length <= maxDigits || isDeleting) {
        setFormState(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    } else {
      showError('phone', 'Only numbers and + are allowed');
    }
  };

  const handleNameChange = (field, value) => {
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormState(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      showError(field, 'Only letters are allowed');
    }
  };

  const isFormValid = (type) => {

    if (type === 'parent') {
      const { parentContact, studentName, parentName, class: grade, section, relation, reason } = formState;
      if (!parentContact || parentContact.length < 10) return false;
      if (!studentName || !/^[A-Za-z\s]+$/.test(studentName)) return false;
      if (!parentName || !/^[A-Za-z\s]+$/.test(parentName)) return false;
      if (!grade || !section || !relation || !reason) return false;
    } else if (type === 'vendor') {
      const { vendorContact, vendorName, companyName, vehicleNumber, vendorReason } = formState;
      if (!vendorContact || vendorContact.length < 10) return false;
      if (!vendorName || !/^[A-Za-z\s]+$/.test(vendorName)) return false;
      const vehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
      if (!companyName || !vendorReason) return false;
      if (vehicleNumber && !vehicleRegex.test(vehicleNumber)) return false;
    } else {
      const { otherContact, otherName, otherReason, otherCustomReason } = formState;
      if (!otherContact || otherContact.length < 10) return false;
      if (!otherName || !/^[A-Za-z\s]+$/.test(otherName)) return false;
      if (!otherReason) return false;
      if (otherReason === 'Others' && !otherCustomReason.trim()) return false;
    }
    return true;
  };

  const handleImageChange = async (e) => {
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
          processCapturedPhoto(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const processCapturedPhoto = async (dataUrl) => {
    setSelectedImage(dataUrl);
  };

  const triggerUpload = () => {
    setIsCameraOpen(true);
  };

  const handleCancel = () => {
    // Clear form state
    setFormState({
      class: '',
      section: '',
      reason: '',
      vendorName: '',
      companyName: '',
      vendorContact: '',
      vehicleNumber: '',
      vendorReason: '',
      otherName: '',
      otherContact: '',
      otherReason: '',
      otherCustomReason: '',
      relation: '',
      noofentry: ''
    });
    setSelectedImage(null);
    setShowBadge(false);
    setSubmittedVisitor(null);
    // Redirect to dashboard
    navigate('/gateguard/dashboard');
  };

  const handlePreparePass = async (type) => {
    // Field Validation
    const newErrors = {};
    const getDigitsCount = (val) => val ? val.replace(/\D/g, '').replace(/^91/, '').length : 0;

    if (type === 'parent') {
      const { parentContact, studentName, parentName, class: grade, section, relation, reason } = formState;
      if (!parentContact) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(parentContact) !== 10) {
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
      const { vendorContact, vendorName, companyName, vehicleNumber, vendorReason } = formState;
      if (!vendorContact) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(vendorContact) !== 10) {
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
      const { otherContact, otherName, otherReason, otherCustomReason } = formState;
      if (!otherContact) {
        newErrors.phone = "Contact Number is mandatory";
      } else if (getDigitsCount(otherContact) !== 10) {
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
      const payload = {
        type: type.toUpperCase(),
        purpose: type === 'other' && formState.otherReason === 'Others' 
          ? formState.otherCustomReason 
          : (formState.reason || formState.vendorReason || formState.otherReason || 'General'),
        photo: selectedImage,
        noofentry: formState.noofentry || 1,
        vehicleNumber: formState.vehicleNumber || null
      };

      if (type === 'parent') {
        payload.name = formState.parentName;
        payload.phone = formState.parentContact;
        payload.studentName = formState.studentName;
        payload.grade = formState.class;
        payload.section = formState.section;
        payload.relation = formState.relation;
      } else if (type === 'vendor') {
        payload.name = formState.vendorName;
        payload.phone = formState.vendorContact;
        payload.companyName = formState.companyName;
      } else {
        payload.name = formState.otherName;
        payload.phone = formState.otherContact;
      }

      if (payload.phone) {
        payload.phone = payload.phone.replace(/\s/g, '');
      }

      if (formState.class) {
        payload.class = formState.class;
      }

      const response = await registerVisitor(payload);

      if (response.success) {
        const { visitor: apiVisitor, visit: apiVisit } = response.data;
        const savedVisitor = {
          ...formState,
          type: type,
          name: apiVisitor.name,
          reason: type === 'other' && formState.otherReason === 'Others' 
            ? formState.otherCustomReason 
            : (formState.reason || formState.vendorReason || formState.otherReason || 'General'),
          id: apiVisit.id,
          qrCode: apiVisit.qrCode,
          displayId: apiVisit.displayId,
          photo: selectedImage || apiVisitor.photo,
          entryTime: apiVisit.createdAt,
        };

        // Store last visit data for manual printing
        setSubmittedVisitor(savedVisitor);
        // Also keep raw api data for printing later
        setLastVisit({ visitor: apiVisitor, visit: apiVisit, photoBase64: selectedImage });

        // ✅ AUTO-PRINT: Trigger Bluetooth print BEFORE UI update
        console.log('[VMS Print] Registration success — triggering visitor pass print');
        triggerVisitorPassPrint(apiVisitor, apiVisit, selectedImage);

        // Small delay to allow bridge to initiate print
        await new Promise(r => setTimeout(r, 200));

        setShowBadge(true);
      } else {
        alert(response.message || 'Failed to save entry');
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
      // Delay navigation so the browser has time to capture the printable badge before route changes
      setTimeout(() => {
        navigate('/gateguard/dashboard');
      }, 1000);
    } else {
      navigate('/gateguard/dashboard');
    }
  };

  const visitorType = searchParams.get('type') || 'Visitor';

  const renderParentForm = () => (
    <div className="form-container-standard">
      <FormHeader
        title="Parent Visitor Entry"
        subtitle="Register new visitor details for security logging and school safety."
      />

      <div className="entry-card-standard parent-compact-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Contact Number</label>
            <div className="input-with-icon">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <input
                type="text"
                placeholder="+91 0000000000"
                value={formState.parentContact}
                onChange={(e) => handlePhoneChange('parent', e.target.value)}
                onBlur={(e) => handlePhoneBlur('parent', e.target.value)}
                className={errors.phone ? 'border-error' : ''}
              />
            </div>
            {errors.phone && <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>{errors.phone}</p>}
          </div>
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
              error={errors.section}
              icon={(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              )}
            />
          </div>

          <CustomDropdown
            label="Relation"
            placeholder="Select "
            options={['Father', 'Mother', 'Guardian', 'Other']}
            value={formState.relation}
            onChange={(val) => {
              setFormState({ ...formState, relation: val });
              setErrors(prev => ({ ...prev, relation: '' }));
            }}
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
          <CustomDropdown
            className="full-width-field"
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
              capture="environment"
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
            <button className="edit-btn-standard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
          <p className="photo-label-standard">Visitor Photo Identification</p>
        </div>

          <FormFooter
            onCancel={handleCancel}
            onSubmit={() => handlePreparePass('parent')}
            submitLabel="Generate Pass"
            disabled={loading}
          />
          {showBadge && (
            <div className="action-buttons-standard full-width">
              <button className="form-btn primary" onClick={handlePrintOnly} type="button">
                Print Pass
              </button>
            </div>
          )}
      </div>
    </div>
  );

  const renderVendorForm = () => (
    <div className="form-container-standard">
      <FormHeader
        title="Vendor Visitor Entry"
        subtitle="Please provide accurate identification and visit details for the security log."
      />

      <div className="entry-card-standard parent-compact-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Contact Number</label>
            <div className="input-with-icon">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <input
                type="text"
                placeholder="+91 0000000000"
                value={formState.vendorContact}
                onChange={(e) => handlePhoneChange('vendor', e.target.value)}
                onBlur={(e) => handlePhoneBlur('vendor', e.target.value)}
                className={errors.phone ? 'border-error' : ''}
              />
            </div>
            {errors.phone && <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>{errors.phone}</p>}
          </div>
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
                className={errors.vendorName ? 'border-error' : ''}
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
                className={errors.companyName ? 'border-error' : ''}
              />
            </div>
            {errors.companyName && <p className="error-text">{errors.companyName}</p>}
          </div>

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
                <p className="error-text">
                  Please enter a valid vehicle number (e.g. KA01AB1234)
                </p>
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
          <CustomDropdown
            label="Reason for Visit"
            placeholder="Select"
            options={allowedVendorReasons}
            value={formState.vendorReason}
            onChange={(val) => {
              setFormState({ ...formState, vendorReason: val });
              setErrors(prev => ({ ...prev, vendorReason: '' }));
            }}
            error={errors.vendorReason}
          />
        </div>

        <div className="photo-profile-section-standard parent-compact-section">
          <div className="photo-circle-standard parent-compact-circle" onClick={triggerUpload}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="environment"
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
            <button className="edit-btn-standard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
          <p className="photo-label-standard">Vendor Identification Photo</p>
        </div>

        <FormFooter
          onCancel={handleCancel}
          onSubmit={() => handlePreparePass('vendor')}
          disabled={loading}
        />
      </div>
    </div>
  );

  const renderOtherForm = () => (
    <div className="form-container-standard">
      <FormHeader
        title="Other Visitor Entry"
        subtitle="Please record details for administrative or general visitors."
      />

      <div className="entry-card-standard parent-compact-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Contact Number</label>
            <div className="input-with-icon">
              <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <input
                type="text"
                placeholder="+91 0000000000"
                value={formState.otherContact}
                onChange={(e) => handlePhoneChange('other', e.target.value)}
                onBlur={(e) => handlePhoneBlur('other', e.target.value)}
                className={errors.phone ? 'border-error' : ''}
              />
            </div>
            {errors.phone && <p style={{ color: '#ef4444', fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>{errors.phone}</p>}
          </div>
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
                className={errors.otherName ? 'border-error' : ''}
              />
            </div>
            {errors.otherName && <p className="error-text">{errors.otherName}</p>}
          </div>

          <div className="form-group">
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
          <div className="form-group">
            <CustomDropdown
              label="Reason for Visit"
              placeholder="Select"
              options={allowedOtherReasons}
              value={formState.otherReason}
              onChange={(val) => {
                setFormState({ ...formState, otherReason: val });
                setErrors(prev => ({ ...prev, otherReason: '' }));
              }}
              error={errors.otherReason}
            />
          </div>
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
              capture="environment"
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
            <button className="edit-btn-standard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
            </button>
          </div>
          <p className="photo-label-standard">Visitor Identification Photo</p>
        </div>

        <FormFooter
          onCancel={handleCancel}
          onSubmit={() => handlePreparePass('other')}
          disabled={loading}
        />
      </div>
    </div>
  );

  const renderFormContent = () => {
    switch (visitorType) {
      case 'parent': return renderParentForm();
      case 'vendor': return renderVendorForm();
      case 'other': return renderOtherForm();
      default: return renderOtherForm();
    }
  };


  const handleBackToForm = () => {
    setFormState({
      class: '',
      section: '',
      reason: '',
      vendorName: '',
      companyName: '',
      vendorContact: '',
      vehicleNumber: '',
      vendorReason: '',
      otherName: '',
      otherContact: '',
      otherReason: '',
      otherCustomReason: '',
      relation: '',
      noofentry: 1,
      studentName: '',
      parentName: '',
      parentContact: ''
    });
    setSelectedImage(null);
    setSubmittedVisitor(null);
    setLastVisit(null);
    setErrors({});
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
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${visitor.id}`;

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
                    <h1 className="badge-visitor-name">
                      {visitor.name || 'N/A'}
                    </h1>
                  </div>

                  <div className="badge-info-item">
                    <label>VISITOR TYPE</label>
                    <p className="badge-text-primary">{visitor.type.toUpperCase()}</p>
                  </div>

                  <div className="badge-info-item">
                    <label>REASON FOR VISIT</label>
                    <p className="badge-text-secondary">{visitor.reason || visitor.vendorReason || visitor.otherReason || 'N/A'}</p>
                  </div>

                  <div className="badge-info-item">
                    <label>ENTRY TIME</label>
                    <p className="badge-text-secondary">{new Date(visitor.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
            <button
              className="print-btn"
              onClick={handleBackToForm}
            >
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

  const handleRoleSelection = (selectedType) => {
    setShowRoleSelectModal(false);
    if (!dualRoleData) return;

    const { parentData, vendorData, formattedPhone } = dualRoleData;

    if (selectedType === 'parent') {
      navigate('/gateguard/visitor-entry?type=parent', { replace: true });
      setFormState(prev => ({
        ...prev,
        parentContact: formattedPhone,
        studentName: parentData.studentName,
        parentName: parentData.parentName,
        class: parentData.grade,
        section: parentData.section,
        relation: parentData.relation
      }));
    } else if (selectedType === 'vendor') {
      navigate('/gateguard/visitor-entry?type=vendor', { replace: true });
      setFormState(prev => ({
        ...prev,
        vendorContact: formattedPhone,
        vendorName: vendorData.name,
        companyName: vendorData.company
      }));
    }
    setDualRoleData(null);
  };

  return (
    <div className="visitor-entry-page-wrapper">
      {showBadge ? (
        <BadgePreview visitor={submittedVisitor} onBack={() => setShowBadge(false)} />
      ) : (
        renderFormContent()
      )}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(img) => processCapturedPhoto(img)}
      />
      {showRoleSelectModal && dualRoleData && createPortal(
        <div className="camera-modal-overlay" style={{ zIndex: 1100 }}>
          <div className="camera-modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
            <div className="camera-modal-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Select Visitor Role</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
              This phone number <strong>{dualRoleData.formattedPhone}</strong> is registered under multiple roles. Please select who is visiting:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => handleRoleSelection('parent')}
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>Parent / Guardian</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Parent: {dualRoleData.parentData.parentName} • Student: {dualRoleData.parentData.studentName} ({dualRoleData.parentData.grade}-{dualRoleData.parentData.section})
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelection('vendor')}
                style={{
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#eff6ff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
              >
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>Vendor</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Vendor: {dualRoleData.vendorData.name} • Company: {dualRoleData.vendorData.company}
                </span>
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="form-btn secondary"
                onClick={() => {
                  setShowRoleSelectModal(false);
                  setDualRoleData(null);
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: '600' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default VisitorEntry;
