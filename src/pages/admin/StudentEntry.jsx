import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate, useParams } from 'react-router-dom';
import { registerStudent, getMasterRecordById, updateMasterRecord, importStudents, getOrgSettings } from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
import Toast from '../../components/common/Toast';
import CustomModal from '../../components/common/CustomModal';
import { searchVendorByPhone } from '../../services/api';
import './StudentEntry.css';


const FormFooter = ({ onCancel, onSubmit, submitLabel = "Register Student", disabled }) => (
  <div className="standard-form-footer">
    <div className="footer-top-row" style={{ justifyContent: 'flex-end' }}>
      <div className="action-buttons-standard">
        <button className="form-btn secondary" onClick={onCancel} type="button">Cancel</button>
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

const StudentEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const importProgressRef = useRef(null);
  const [toastConfig, setToastConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const triggerImportClick = () => {
    setImportErrors([]);
    importFileInputRef.current.value = '';
    importFileInputRef.current.click();
  };

  const downloadTemplate = () => {
    const headers = [
      "Student Full Name",
      "Grade",
      "Section",
      "Father's Name",
      "Father's Phone Number",
      "Mother's Name",
      "Mother's Phone Number",
      "Guardian's Name",
      "Guardian's Phone Number"
    ];
    const sampleData = [
      headers,
      ["John Doe", "1", "A", "Richard Doe", "9876543210", "", "", "", ""],
      ["Jane Smith", "LKG", "B", "", "", "Mary Smith", "9876543211", "", ""]
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wscols = [
      { wch: 22 },
      { wch: 8 },
      { wch: 8 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 }
    ];
    ws['!cols'] = wscols;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "student_import_template.xlsx");
  };

  const startProgressAnimation = () => {
    setImportProgress(0);
    setImporting(true);
    // Animate progress to 90% smoothly, leave last 10% for completion
    importProgressRef.current = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(importProgressRef.current);
          return 90;
        }
        return prev + Math.random() * 8;
      });
    }, 300);
  };

  const finishProgressAnimation = (success) => {
    clearInterval(importProgressRef.current);
    setImportProgress(100);
    setTimeout(() => {
      setImporting(false);
      setImportProgress(0);
    }, success ? 1200 : 800);
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      alert("Invalid file format. Please upload a .csv or .xlsx file.");
      return;
    }

    setSaving(true);
    setImportErrors([]);
    startProgressAnimation();

    try {
      const response = await importStudents(file);
      if (response.success) {
        finishProgressAnimation(true);
        setToastConfig({
          isOpen: true,
          title: 'Import Successful',
          message: response.message || 'Successfully imported students.',
          type: 'success'
        });
        setTimeout(() => navigate('/admin/master-records'), 2000);
      }
    } catch (error) {
      console.error('Error importing students:', error);
      finishProgressAnimation(false);
      setToastConfig({
        isOpen: true,
        title: 'Import Failed',
        message: error.message || 'An error occurred during file upload.',
        type: 'error'
      });
      if (error.errors) {
        setImportErrors(error.errors);
      }
    } finally {
      setSaving(false);
    }
  };
  const [allowedGrades, setAllowedGrades] = useState([]);
  const [allowedSections, setAllowedSections] = useState([]);

  useEffect(() => {
    try {
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      setAllowedGrades(org.grades ? sortGrades(org.grades.split(',').map(g => g.trim())) : []);
      setAllowedSections(org.sections ? sortSections(org.sections.split(',').map(s => s.trim())) : []);
    } catch (e) {}

    const loadSettings = async () => {
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
    loadSettings();
  }, []);

  const [formState, setFormState] = useState({
    studentName: '',
    studentClass: '',
    section: '',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    guardianName: '',
    guardianPhone: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    } else {
      // Reset form for fresh entry
      setFormState({
        studentName: '',
        studentClass: '',
        section: '',
        fatherName: '',
        fatherPhone: '',
        motherName: '',
        motherPhone: '',
        guardianName: '',
        guardianPhone: ''
      });
      setErrors({});
      setLoading(false);
    }
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      const response = await getMasterRecordById('students', id);
      if (response.success) {
        const student = response.data;
        setFormState({
          studentName: student.name,
          studentClass: student.grade,
          section: student.section,
          fatherName: student.fatherName || '',
          fatherPhone: student.fatherPhone || '',
          motherName: student.motherName || '',
          motherPhone: student.motherPhone || '',
          guardianName: student.guardianName || '',
          guardianPhone: student.guardianPhone || ''
        });
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setToastConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load student details.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const showError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    setTimeout(() => {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }, 2000);
  };

  const handleNameChange = (field, value) => {
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormState(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    } else {
      showError(field, 'Only letters are allowed');
    }
  };

  const handlePhoneChange = (field, value) => {
    if (/^[+\d\s]*$/.test(value)) {
      const digitsOnly = value.replace(/\D/g, '');
      const prevValue = formState[field] || '';
      const isDeleting = value.length < prevValue.length;
      const maxDigits = value.startsWith('+91') ? 12 : 10;

      if (digitsOnly.length <= maxDigits || isDeleting) {
        setFormState(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    } else {
      showError(field, 'Only numbers and + are allowed');
    }
  };

  const isFormValid = () => {
    const {
      studentName, studentClass, section,
      fatherName, fatherPhone,
      motherName, motherPhone,
      guardianName, guardianPhone
    } = formState;

    // Basic student info is mandatory
    if (!studentName || !/^[A-Za-z\s]+$/.test(studentName)) return false;
    if (!studentClass || !section) return false;

    // Check if at least one parent/guardian is complete
    const hasFather = fatherName?.trim() && fatherPhone?.replace('+91', '').length === 10;
    const hasMother = motherName?.trim() && motherPhone?.replace('+91', '').length === 10;
    const hasGuardian = guardianName?.trim() && guardianPhone?.replace('+91', '').length === 10;

    return hasFather || hasMother || hasGuardian;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current.click();
  };

  const handleCancel = () => {
    navigate(id ? '/admin/master-records' : '/admin/dashboard');
  };

  const formatPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    return value;
  };

  const handlePhoneChangeInternal = (field, value) => {
    handlePhoneChange(field, value);
  };

  const handlePhoneBlur = (field, value) => {
    const formatted = formatPhone(value);
    setFormState({ ...formState, [field]: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const newErrors = {};

    // 1. Basic Student Info Validation
    if (!formState.studentName?.trim()) {
      newErrors.studentName = "Student Name is mandatory";
    }
    if (!formState.studentClass) {
      newErrors.studentClass = "Grade is mandatory";
    }
    if (!formState.section) {
      newErrors.section = "Section is mandatory";
    }

    // 2. Parent/Guardian Selection Validation (At least one must be present)
    const getDigitsCount = (val) => val ? val.replace(/\D/g, '').replace(/^91/, '').length : 0;

    const hasFather = formState.fatherName?.trim() && getDigitsCount(formState.fatherPhone) === 10;
    const hasMother = formState.motherName?.trim() && getDigitsCount(formState.motherPhone) === 10;
    const hasGuardian = formState.guardianName?.trim() && getDigitsCount(formState.guardianPhone) === 10;

    // Check partials
    if (formState.fatherName?.trim() && getDigitsCount(formState.fatherPhone) !== 10) {
      newErrors.fatherPhone = "Father's Phone must be a 10-digit number";
    }
    if (!formState.fatherName?.trim() && formState.fatherPhone?.replace('+91', '').replace(/-/g, '').trim()) {
      newErrors.fatherName = "Father's Name is mandatory";
    }

    if (formState.motherName?.trim() && getDigitsCount(formState.motherPhone) !== 10) {
      newErrors.motherPhone = "Mother's Phone must be a 10-digit number";
    }
    if (!formState.motherName?.trim() && formState.motherPhone?.replace('+91', '').replace(/-/g, '').trim()) {
      newErrors.motherName = "Mother's Name is mandatory";
    }

    if (formState.guardianName?.trim() && getDigitsCount(formState.guardianPhone) !== 10) {
      newErrors.guardianPhone = "Guardian's Phone must be a 10-digit number";
    }
    if (!formState.guardianName?.trim() && formState.guardianPhone?.replace('+91', '').replace(/-/g, '').trim()) {
      newErrors.guardianName = "Guardian's Name is mandatory";
    }

    if (!hasFather && !hasMother && !hasGuardian) {
      if (!newErrors.fatherName && !newErrors.fatherPhone &&
          !newErrors.motherName && !newErrors.motherPhone &&
          !newErrors.guardianName && !newErrors.guardianPhone) {
        newErrors.fatherName = "Father's Name is mandatory";
        newErrors.fatherPhone = "Father's Phone is mandatory";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    const checkOverlappingAndSubmit = async () => {
      const activePhones = [formState.fatherPhone, formState.motherPhone, formState.guardianPhone].filter(p => p && p.trim().length >= 10);
      let foundVendorName = null;

      for (const phone of activePhones) {
        try {
          const res = await searchVendorByPhone(phone);
          if (res.success && res.data) {
            foundVendorName = res.data.name;
            break;
          }
        } catch (e) {
          // No vendor found
        }
      }

      if (foundVendorName) {
        setSaving(false);
        setModalConfig({
          isOpen: true,
          title: 'Confirm Dual-Role Registration',
          message: `One or more contact numbers belong to registered Vendor: "${foundVendorName}". Are you sure you want to link this number as a parent as well?`,
          confirmText: 'Register Anyway',
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            executeRegistration();
          }
        });
      } else {
        executeRegistration();
      }
    };

    const executeRegistration = async () => {
      setSaving(true);
      try {
      const payload = {
        name: formState.studentName,
        grade: formState.studentClass,
        section: formState.section,
        fatherName: formState.fatherName,
        fatherPhone: formState.fatherPhone,
        motherName: formState.motherName,
        motherPhone: formState.motherPhone,
        guardianName: formState.guardianName,
        guardianPhone: formState.guardianPhone
      };

      const response = id
        ? await updateMasterRecord('students', id, payload)
        : await registerStudent(payload);

      if (response.success) {
        setToastConfig({
          isOpen: true,
          title: id ? 'Update Successful' : 'Registered Successfully',
          message: id ? 'Student record has been updated.' : 'The student record has been added to the database.',
          type: 'success'
        });
        setTimeout(() => navigate('/admin/master-records'), 1500);
      } else {
        let title = 'Operation Failed';
        let message = response.message || 'Failed to process request';
        if (message.includes('already registered to')) {
          title = 'Duplicate entry';
          message = message.replace('One or more ', '');
        }
        setToastConfig({
          isOpen: true,
          title,
          message,
          type: 'error'
        });
        }
      } catch (error) {
        console.error('Error processing student:', error);
        let title = 'Error';
        let message = error.message || 'Error connecting to server';

        if (message.includes('already registered to')) {
          title = 'Duplicate entry';
          message = message.replace('One or more ', '');
        }

        setToastConfig({
          isOpen: true,
          title,
          message,
          type: 'error'
        });
      }
    };

    checkOverlappingAndSubmit();
  };

  if (loading) {
    return (
      <div className="student-entry-page-wrapper loading">
        <div className="spinner-large"></div>
        <p>Fetching student details...</p>
      </div>
    );
  }

  return (
    <div className="student-entry-page-wrapper">
      <Toast
        {...toastConfig}
        onClose={() => setToastConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <CustomModal
        {...modalConfig}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      {showDownloadModal && (
        <CustomModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="custom-modal-container import-rules-modal" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
            <div className="modal-icon-wrapper info">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <h3 style={{ margin: '16px 0 8px', fontSize: '20px', fontWeight: '800', fontFamily: 'Outfit' }}>Important Rules to Avoid Upload Errors</h3>
            
            <div className="import-modal-instructions" style={{ textAlign: 'left', margin: '20px 0' }}>
              <ul className="modal-instructions-list" style={{ paddingLeft: '20px', margin: '0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                <li><strong>Format:</strong> Only upload <code>.xlsx</code> or <code>.csv</code> files.</li>
                <li><strong>Header Structure:</strong> Do not change the sequence or names of the columns in the template. The first 3 columns must be: <em>Student Full Name</em>, <em>Grade</em>, and <em>Section</em>.</li>
                <li><strong>All Names (Student/Parents/Guardian):</strong> Must contain letters and spaces only. <strong>No special characters or numbers</strong> (e.g., avoid <code>@, #, -, /, 123</code>).</li>
                <li><strong>Grade &amp; Section:</strong> Must match your organization's allowed settings (e.g. Grades: NUR, LKG, UKG, 1–12; Sections: A, B, C).</li>
                <li><strong>Phone Number Columns:</strong> Each phone number cell must contain <strong>only one 10-digit mobile number</strong>. Do not enter multiple numbers, spaces between digits, or any text in phone columns.</li>
                <li><strong>Parent/Guardian Details:</strong> At least <strong>one parent or guardian must be fully filled</strong> (both Name and a valid 10-digit Phone Number). If one parent is complete, incomplete or empty entries for other parents are automatically ignored — they will not cause an error.</li>
              </ul>
            </div>

            <div className="modal-actions-v2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                className="modal-btn-v2 cancel"
                onClick={() => setShowDownloadModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="modal-btn-v2 confirm info"
                style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                onClick={() => {
                  setShowDownloadModal(false);
                  downloadTemplate();
                }}
                type="button"
              >
                I Understand & Download
              </button>
            </div>
          </div>
        </CustomModal>
      )}
      <div className="form-container-standard">
        <div className="entry-card-standard">
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div className="form-section-title" style={{ marginBottom: 0 }}>
                <h3>Student Information</h3>
                <div className="section-divider"></div>
              </div>
              {!id && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleImportFileChange}
                    accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="download-template-btn"
                      onClick={() => setShowDownloadModal(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Excel Template
                    </button>
                    <button
                      type="button"
                      className="import-student-btn"
                      onClick={triggerImportClick}
                      disabled={saving || importing}
                    >
                      {importing ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin-icon">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      )}
                      {importing ? 'Importing...' : 'Import Student List'}
                    </button>
                  </div>
                  {importing && (
                    <div className="import-progress-wrapper">
                      <div className="import-progress-bar" style={{ width: `${importProgress}%` }} />
                      <span className="import-progress-label">{Math.round(importProgress)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {importErrors.length > 0 && (
              <div className="import-errors-container" style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: '#991b1b', margin: 0, fontWeight: 700 }}>Import Validation Errors</h4>
                  <button
                    type="button"
                    onClick={() => setImportErrors([])}
                    style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Dismiss
                  </button>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '13px', lineHeight: '1.6' }}>
                  {importErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-grid-v2">
              <div className="form-group col-span-6">
                <label>Student Full Name</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter student's full name"
                    value={formState.studentName}
                    onChange={(e) => handleNameChange('studentName', e.target.value)}
                    className={errors.studentName ? 'border-error' : ''}
                  />
                </div>
                {errors.studentName && <p className="error-text">{errors.studentName}</p>}
              </div>

              <div className="form-group col-span-2">
                <label>Grade</label>
                <select
                  className={`premium-select ${errors.studentClass ? 'border-error' : ''}`}
                  value={formState.studentClass}
                  onChange={(e) => {
                    setFormState({ ...formState, studentClass: e.target.value });
                    setErrors(prev => ({ ...prev, studentClass: '' }));
                  }}
                >
                  <option value="">Select Grade</option>
                  {allowedGrades.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
                {errors.studentClass && <p className="error-text">{errors.studentClass}</p>}
              </div>

              <div className="form-group col-span-2">
                <label>Section</label>
                <select
                  className={`premium-select ${errors.section ? 'border-error' : ''}`}
                  value={formState.section}
                  onChange={(e) => {
                    setFormState({ ...formState, section: e.target.value });
                    setErrors(prev => ({ ...prev, section: '' }));
                  }}
                >
                  <option value="">Select Section</option>
                  {allowedSections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.section && <p className="error-text">{errors.section}</p>}
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '40px' }}>
              <h3>Parent Details</h3>
              <div className="section-divider"></div>
            </div>

            <div className="form-grid-v2">
              {/* Father Details */}
              <div className="form-group col-span-6">
                <label>Father's Name</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    value={formState.fatherName}
                    onChange={(e) => handleNameChange('fatherName', e.target.value)}
                    className={errors.fatherName ? 'border-error' : ''}
                  />
                </div>
                {errors.fatherName && <p className="error-text">{errors.fatherName}</p>}
              </div>

              <div className="form-group col-span-4">
                <label>Father's Phone Number</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={formState.fatherPhone}
                    onChange={(e) => handlePhoneChange('fatherPhone', e.target.value)}
                    onBlur={(e) => handlePhoneBlur('fatherPhone', e.target.value)}
                    className={errors.fatherPhone ? 'border-error' : ''}
                  />
                </div>
                {errors.fatherPhone && <p className="error-text">{errors.fatherPhone}</p>}
              </div>

              {/* Mother Details */}
              <div className="form-group col-span-6">
                <label>Mother's Name</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Mother's full name"
                    value={formState.motherName}
                    onChange={(e) => handleNameChange('motherName', e.target.value)}
                    className={errors.motherName ? 'border-error' : ''}
                  />
                </div>
                {errors.motherName && <p className="error-text">{errors.motherName}</p>}
              </div>

              <div className="form-group col-span-4">
                <label>Mother's Phone Number</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={formState.motherPhone}
                    onChange={(e) => handlePhoneChange('motherPhone', e.target.value)}
                    onBlur={(e) => handlePhoneBlur('motherPhone', e.target.value)}
                    className={errors.motherPhone ? 'border-error' : ''}
                  />
                </div>
                {errors.motherPhone && <p className="error-text">{errors.motherPhone}</p>}
              </div>

              <div className="form-group col-span-10">
                <div className="form-or-divider">
                  <div className="or-line"></div>
                  <span>OR</span>
                  <div className="or-line"></div>
                </div>
              </div>

              <div className="form-group col-span-6">
                <label>Guardian's Name</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    placeholder="Guardian's full name"
                    value={formState.guardianName}
                    onChange={(e) => handleNameChange('guardianName', e.target.value)}
                    className={errors.guardianName ? 'border-error' : ''}
                  />
                </div>
                {errors.guardianName && <p className="error-text">{errors.guardianName}</p>}
              </div>

              <div className="form-group col-span-4">
                <label>Guardian's Phone Number</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={formState.guardianPhone}
                    onChange={(e) => handlePhoneChange('guardianPhone', e.target.value)}
                    onBlur={(e) => handlePhoneBlur('guardianPhone', e.target.value)}
                    className={errors.guardianPhone ? 'border-error' : ''}
                  />
                </div>
                {errors.guardianPhone && <p className="error-text">{errors.guardianPhone}</p>}
              </div>
            </div>

            <div style={{ marginTop: '32px' }}></div>

            <FormFooter
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              submitLabel={id ? "Update Student" : "Register Student"}
              disabled={saving}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentEntry;
