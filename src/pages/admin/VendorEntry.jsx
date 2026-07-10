import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { registerVendor, getMasterRecordById, updateMasterRecord } from '../../services/api';
import Toast from '../../components/common/Toast';
import CustomModal from '../../components/common/CustomModal';
import { searchStudentByPhone } from '../../services/api';
import './VendorEntry.css';


const FormFooter = ({ onCancel, onSubmit, submitLabel = "Register Vendor", disabled, saving }) => (
  <div className="standard-form-footer">
    <div className="footer-top-row" style={{ justifyContent: 'flex-end' }}>
      <div className="action-buttons-standard">
        <button className="form-btn secondary" onClick={onCancel} type="button" disabled={saving}>Cancel</button>
        <button className="form-btn primary" onClick={onSubmit} type="submit" disabled={disabled || saving}>
          {saving ? (
            <div className="spinner-small"></div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
          {saving ? 'Processing...' : submitLabel}
        </button>
      </div>
    </div>
  </div>
);

const VendorEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
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
  const [formState, setFormState] = useState({
    vendorName: '',
    contactNo: '',
    company: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
    } else {
      // Reset form for fresh entry
      setFormState({
        vendorName: '',
        contactNo: '',
        company: ''
      });
      setErrors({});
      setLoading(false);
    }
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      const response = await getMasterRecordById('vendors', id);
      if (response.success) {
        const vendor = response.data;
        setFormState({
          vendorName: vendor.name,
          contactNo: vendor.phone,
          company: vendor.company
        });
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      setToastConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load vendor details.',
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

  const handlePhoneChangeInternal = (value) => {
    if (/^[+\d]*$/.test(value)) {
      const digitsOnly = value.replace(/\D/g, '');
      const prevValue = formState.contactNo || '';
      const isDeleting = value.length < prevValue.length;
      const maxDigits = value.startsWith('+91') ? 12 : 10;

      if (digitsOnly.length <= maxDigits || isDeleting) {
        setFormState(prev => ({ ...prev, contactNo: value }));
        setErrors(prev => ({ ...prev, contactNo: '' }));
      }
    } else {
      showError('contactNo', 'Only numbers and + are allowed');
    }
  };

  const isFormValid = () => {
    const { vendorName, contactNo, company } = formState;
    if (!vendorName || !/^[A-Za-z\s]+$/.test(vendorName)) return false;
    if (!contactNo || contactNo.replace('+91', '').length !== 10) return false;
    if (!company) return false;
    return true;
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

  const handlePhoneBlur = (value) => {
    const formatted = formatPhone(value);
    setFormState({ ...formState, contactNo: formatted });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const newErrors = {};
    if (!formState.vendorName?.trim()) {
      newErrors.vendorName = "Vendor Name is mandatory";
    }

    const getDigitsCount = (val) => val ? val.replace(/\D/g, '').replace(/^91/, '').length : 0;
    const phoneDigits = getDigitsCount(formState.contactNo);
    if (!formState.contactNo) {
      newErrors.contactNo = "Contact Number is mandatory";
    } else if (phoneDigits !== 10) {
      newErrors.contactNo = "Contact number must be exactly 10 digits";
    }

    if (!formState.company?.trim()) {
      newErrors.company = "Company Name is mandatory";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }

    const checkOverlappingAndSubmit = async () => {
      let foundParentName = null;
      let foundStudentName = null;

      try {
        const res = await searchStudentByPhone(formState.contactNo);
        if (res.success && res.data) {
          foundParentName = res.data.parentName;
          foundStudentName = res.data.studentName;
        }
      } catch (e) {
        // No student parent found
      }

      if (foundStudentName) {
        setSaving(false);
        setModalConfig({
          isOpen: true,
          title: 'Confirm Dual-Role Registration',
          message: `This contact number belongs to registered Parent: "${foundParentName}" (Student: "${foundStudentName}"). Are you sure you want to register this number as a Vendor as well?`,
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
        name: formState.vendorName,
        phone: formState.contactNo,
        company: formState.company
      };

      const response = id
        ? await updateMasterRecord('vendors', id, payload)
        : await registerVendor(payload);

      if (response.success) {
        setToastConfig({
          isOpen: true,
          title: id ? 'Update Successful' : 'Registered Successfully',
          message: id ? 'Vendor record has been updated.' : 'The vendor record has been added to the database.',
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
        console.error('Error processing vendor:', error);
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
      <div className="vendor-entry-page-wrapper loading">
        <div className="spinner-large"></div>
        <p>Fetching vendor details...</p>
      </div>
    );
  }

  return (
    <div className="vendor-entry-page-wrapper">
      <Toast
        {...toastConfig}
        onClose={() => setToastConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <CustomModal
        {...modalConfig}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <div className="form-container-standard">
        <div className="entry-card-standard">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-section-title">
              <h3>Vendor Information</h3>
              <div className="section-divider"></div>
            </div>

            <div className="form-grid-v2">
              <div className="form-group col-span-6">
                <label>Vendor Full Name</label>
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

              <div className="form-group col-span-4">
                <label>Contact Number</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={formState.contactNo}
                    onChange={(e) => handlePhoneChangeInternal(e.target.value)}
                    onBlur={(e) => handlePhoneBlur(e.target.value)}
                    className={errors.contactNo ? 'border-error' : ''}
                  />
                </div>
                {errors.contactNo && <p className="error-text">{errors.contactNo}</p>}
              </div>

              <div className="form-group col-span-10">
                <label>Company / Organization Name</label>
                <div className="input-with-icon">
                  <svg className="field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Amazon, Tech Solutions"
                    value={formState.company}
                    onChange={(e) => {
                      setFormState({ ...formState, company: e.target.value });
                      setErrors(prev => ({ ...prev, company: '' }));
                    }}
                    className={errors.company ? 'border-error' : ''}
                  />
                </div>
                {errors.company && <p className="error-text">{errors.company}</p>}
              </div>
            </div>

            <div style={{ marginTop: '32px' }}></div>

            <FormFooter
              onCancel={handleCancel}
              onSubmit={handleSubmit}
              submitLabel={id ? "Update Vendor" : "Register Vendor"}
              disabled={saving}
              saving={saving}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorEntry;
