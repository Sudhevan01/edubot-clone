import { useState, useEffect } from 'react';
import { getOrgSettings, updateOrgSettings, uploadOrgLogo } from '../../services/api';
import { sortGrades, sortSections } from '../../utils/sorting';
import './Settings.css';

const extractTenDigits = (phoneStr) => {
  if (!phoneStr) return '';
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [organizationCode, setOrganizationCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [themeColor, setThemeColor] = useState('#1D4ED8');
  const [grades, setGrades] = useState('');
  const [sections, setSections] = useState('');
  const [departments, setDepartments] = useState('');
  const [approvingAuthorities, setApprovingAuthorities] = useState('');
  const [parentReasons, setParentReasons] = useState('');
  const [vendorReasons, setVendorReasons] = useState('');
  const [otherReasons, setOtherReasons] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    grades: '',
    sections: '',
    departments: '',
    approvingAuthorities: '',
    parentReasons: '',
    vendorReasons: '',
    otherReasons: ''
  });

  // Inputs for adding custom items
  const [customGradeInput, setCustomGradeInput] = useState('');
  const [customSectionInput, setCustomSectionInput] = useState('');
  const [customDepartmentInput, setCustomDepartmentInput] = useState('');
  const [customAuthorityInput, setCustomAuthorityInput] = useState('');
  const [customParentReasonInput, setCustomParentReasonInput] = useState('');
  const [customVendorReasonInput, setCustomVendorReasonInput] = useState('');
  const [customOtherReasonInput, setCustomOtherReasonInput] = useState('');

  const selectedGrades = grades ? grades.split(',').map(g => g.trim().toUpperCase()).filter(g => g) : [];
  const selectedSections = sections ? sections.split(',').map(s => s.trim().toUpperCase()).filter(s => s) : [];
  const selectedDepartments = departments ? departments.split(',').map(d => d.trim()).filter(d => d) : [];
  const selectedAuthorities = approvingAuthorities ? approvingAuthorities.split(',').map(a => a.trim()).filter(a => a) : [];
  const selectedParentReasons = parentReasons ? parentReasons.split(',').map(r => r.trim()).filter(r => r) : [];
  const selectedVendorReasons = vendorReasons ? vendorReasons.split(',').map(r => r.trim()).filter(r => r) : [];
  const selectedOtherReasons = otherReasons ? otherReasons.split(',').map(r => r.trim()).filter(r => r) : [];

  const handleAddGrade = (e) => {
    e.preventDefault();
    if (!customGradeInput.trim()) return;
    let updatedGrades = [...selectedGrades];
    const parts = customGradeInput.split(',').map(g => g.trim().toUpperCase()).filter(g => g);
    let added = false;
    parts.forEach(part => {
      if (!updatedGrades.includes(part)) {
        updatedGrades.push(part);
        added = true;
      }
    });
    if (added) {
      setGrades(sortGrades(updatedGrades).join(','));
      setErrors(prev => ({ ...prev, grades: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomGradeInput('');
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (!customSectionInput.trim()) return;
    let updatedSections = [...selectedSections];
    const parts = customSectionInput.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    let added = false;
    parts.forEach(part => {
      if (!updatedSections.includes(part)) {
        updatedSections.push(part);
        added = true;
      }
    });
    if (added) {
      setSections(sortSections(updatedSections).join(','));
      setErrors(prev => ({ ...prev, sections: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomSectionInput('');
  };

  const handleAddDepartment = (e) => {
    e.preventDefault();
    if (!customDepartmentInput.trim()) return;
    let updated = [...selectedDepartments];
    const parts = customDepartmentInput.split(',').map(d => d.trim()).filter(d => d);
    let added = false;
    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
        added = true;
      }
    });
    if (added) {
      setDepartments(updated.join(','));
      setErrors(prev => ({ ...prev, departments: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomDepartmentInput('');
  };

  const handleAddAuthority = (e) => {
    e.preventDefault();
    if (!customAuthorityInput.trim()) return;
    let updated = [...selectedAuthorities];
    const parts = customAuthorityInput.split(',').map(a => a.trim()).filter(a => a);
    let added = false;
    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
        added = true;
      }
    });
    if (added) {
      setApprovingAuthorities(updated.join(','));
      setErrors(prev => ({ ...prev, approvingAuthorities: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomAuthorityInput('');
  };

  const handleAddParentReason = (e) => {
    e.preventDefault();
    if (!customParentReasonInput.trim()) return;
    let updated = [...selectedParentReasons];
    const parts = customParentReasonInput.split(',').map(r => r.trim()).filter(r => r);
    let added = false;
    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
        added = true;
      }
    });
    if (added) {
      setParentReasons(updated.join(','));
      setErrors(prev => ({ ...prev, parentReasons: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomParentReasonInput('');
  };

  const handleAddVendorReason = (e) => {
    e.preventDefault();
    if (!customVendorReasonInput.trim()) return;
    let updated = [...selectedVendorReasons];
    const parts = customVendorReasonInput.split(',').map(r => r.trim()).filter(r => r);
    let added = false;
    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
        added = true;
      }
    });
    if (added) {
      setVendorReasons(updated.join(','));
      setErrors(prev => ({ ...prev, vendorReasons: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomVendorReasonInput('');
  };

  const handleAddOtherReason = (e) => {
    e.preventDefault();
    if (!customOtherReasonInput.trim()) return;
    let updated = [...selectedOtherReasons];
    const parts = customOtherReasonInput.split(',').map(r => r.trim()).filter(r => r);
    let added = false;
    parts.forEach(part => {
      if (!updated.includes(part)) {
        updated.push(part);
        added = true;
      }
    });
    if (added) {
      setOtherReasons(updated.join(','));
      setErrors(prev => ({ ...prev, otherReasons: '' }));
      if (error) setError('');
      if (success) setSuccess('');
    }
    setCustomOtherReasonInput('');
  };

  const handleDeleteDepartment = (val) => {
    const updated = selectedDepartments.filter(d => d !== val);
    setDepartments(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteAuthority = (val) => {
    const updated = selectedAuthorities.filter(a => a !== val);
    setApprovingAuthorities(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteParentReason = (val) => {
    const updated = selectedParentReasons.filter(r => r !== val);
    setParentReasons(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteVendorReason = (val) => {
    const updated = selectedVendorReasons.filter(r => r !== val);
    setVendorReasons(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteOtherReason = (val) => {
    const updated = selectedOtherReasons.filter(r => r !== val);
    setOtherReasons(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteGrade = (gradeToDelete) => {
    const updated = selectedGrades.filter(g => g !== gradeToDelete);
    setGrades(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleDeleteSection = (sectionToDelete) => {
    const updated = selectedSections.filter(s => s !== sectionToDelete);
    setSections(updated.join(','));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const hasProfileErrors = !!(errors.name || errors.contactPerson || errors.email || errors.phone || errors.address);
  const hasBusinessErrors = !!(errors.grades || errors.sections || errors.departments || errors.approvingAuthorities);
  const hasReasonsErrors = !!(errors.parentReasons || errors.vendorReasons || errors.otherReasons);

  const handleCopyCode = (e) => {
    e.preventDefault();
    if (!organizationCode) return;
    navigator.clipboard.writeText(organizationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await getOrgSettings();
        if (response.success) {
          setName(response.data.name || '');
          setLogo(response.data.logo || '');
          setThemeColor(response.data.themeColor || '#1D4ED8');
          setGrades(response.data.grades ? sortGrades(response.data.grades.split(',')).join(',') : '');
          setSections(response.data.sections ? sortSections(response.data.sections.split(',')).join(',') : '');
          setDepartments(response.data.departments || '');
          setApprovingAuthorities(response.data.approvingAuthorities || '');
          setParentReasons(response.data.parentReasons || '');
          setVendorReasons(response.data.vendorReasons || '');
          setOtherReasons(response.data.otherReasons || '');
          setContactPerson(response.data.contactPerson || '');
          setEmail(response.data.email || '');
          setPhone(extractTenDigits(response.data.phone || ''));
          setAddress(response.data.address || '');
          setOrganizationCode(response.data.organizationCode || '');
        } else {
          setError('Failed to load organization settings.');
          // Fallback to localStorage
          const storedOrg = localStorage.getItem('vms_org');
          if (storedOrg) {
            const orgInfo = JSON.parse(storedOrg);
            setName(orgInfo.name || '');
            setLogo(orgInfo.logo || '');
            setThemeColor(orgInfo.themeColor || '#1D4ED8');
            setGrades(orgInfo.grades ? sortGrades(orgInfo.grades.split(',')).join(',') : '');
            setSections(orgInfo.sections ? sortSections(orgInfo.sections.split(',')).join(',') : '');
            setDepartments(orgInfo.departments || '');
            setApprovingAuthorities(orgInfo.approvingAuthorities || '');
            setParentReasons(orgInfo.parentReasons || '');
            setVendorReasons(orgInfo.vendorReasons || '');
            setOtherReasons(orgInfo.otherReasons || '');
            setContactPerson(orgInfo.contactPerson || '');
            setPhone(extractTenDigits(orgInfo.phone || ''));
            setAddress(orgInfo.address || '');
            setOrganizationCode(orgInfo.organizationCode || '');
          }
          const storedUser = localStorage.getItem('vms_user');
          if (storedUser) {
            const userInfo = JSON.parse(storedUser);
            setEmail(userInfo.email || '');
          }
        }
      } catch (err) {
        console.error(err);
        setError('Error connecting to settings API.');
        // Fallback to localStorage
        const storedOrg = localStorage.getItem('vms_org');
        if (storedOrg) {
          const orgInfo = JSON.parse(storedOrg);
          setName(orgInfo.name || '');
          setLogo(orgInfo.logo || '');
          setThemeColor(orgInfo.themeColor || '#1D4ED8');
          setGrades(orgInfo.grades || '');
          setSections(orgInfo.sections || '');
          setDepartments(orgInfo.departments || '');
          setApprovingAuthorities(orgInfo.approvingAuthorities || '');
          setParentReasons(orgInfo.parentReasons || '');
          setVendorReasons(orgInfo.vendorReasons || '');
          setOtherReasons(orgInfo.otherReasons || '');
          setContactPerson(orgInfo.contactPerson || '');
          setPhone(extractTenDigits(orgInfo.phone || ''));
          setAddress(orgInfo.address || '');
          setOrganizationCode(orgInfo.organizationCode || '');
        }
        const storedUser = localStorage.getItem('vms_user');
        if (storedUser) {
          const userInfo = JSON.parse(storedUser);
          setEmail(userInfo.email || '');
        }
      } finally {
        setFetching(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await uploadOrgLogo(file);
      if (response.success && response.data.logoUrl) {
        setLogo(response.data.logoUrl);
        setSuccess('Logo uploaded to cloud storage successfully!');
      } else {
        setError(response.message || 'Failed to upload logo.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      grades: '',
      sections: '',
      departments: '',
      approvingAuthorities: '',
      parentReasons: '',
      vendorReasons: '',
      otherReasons: ''
    };
    let hasAnyError = false;

    if (!name.trim()) {
      newErrors.name = "Organization Name is mandatory";
      hasAnyError = true;
    }
    if (contactPerson.trim() && !/^[A-Za-z\s]+$/.test(contactPerson)) {
      newErrors.contactPerson = "Contact person name can only contain letters.";
      hasAnyError = true;
    }
    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      hasAnyError = true;
    }
    if (phone.trim() && (phone.trim().length !== 10 || !/^\d+$/.test(phone))) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
      hasAnyError = true;
    }

    if (hasAnyError) {
      setErrors(newErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanedPhone = phone.trim();
      const finalPhone = cleanedPhone ? cleanedPhone : null;

      const response = await updateOrgSettings({
        name: name.trim(),
        logo: logo.trim() || null,
        themeColor,
        grades: grades.trim() || null,
        sections: sections.trim() || null,
        departments: departments.trim() || null,
        parentReasons: parentReasons.trim() || null,
        vendorReasons: vendorReasons.trim() || null,
        otherReasons: otherReasons.trim() || null,
        approvingAuthorities: approvingAuthorities.trim() || null,
        contactPerson: contactPerson.trim() || null,
        phone: finalPhone,
        address: address.trim() || null,
        email: email.trim() || null,
        password: password.trim() ? password.trim() : null
      });

      if (response.success) {
        setSuccess('Organization details updated successfully!');
        setPassword('');

        // 1. Update vms_org in localStorage
        const storedOrg = localStorage.getItem('vms_org');
        if (storedOrg) {
          const orgInfo = JSON.parse(storedOrg);
          orgInfo.name = response.data.name;
          orgInfo.logo = response.data.logo;
          orgInfo.themeColor = response.data.themeColor;
          orgInfo.grades = response.data.grades || '';
          orgInfo.sections = response.data.sections || '';
          orgInfo.departments = response.data.departments || '';
          orgInfo.parentReasons = response.data.parentReasons || '';
          orgInfo.vendorReasons = response.data.vendorReasons || '';
          orgInfo.otherReasons = response.data.otherReasons || '';
          orgInfo.approvingAuthorities = response.data.approvingAuthorities || '';
          orgInfo.contactPerson = response.data.contactPerson || '';
          orgInfo.phone = response.data.phone || '';
          orgInfo.address = response.data.address || '';
          localStorage.setItem('vms_org', JSON.stringify(orgInfo));
        }

        // 2. Update vms_user organization in localStorage
        const storedUser = localStorage.getItem('vms_user');
        if (storedUser) {
          const userInfo = JSON.parse(storedUser);
          userInfo.email = response.data.email || userInfo.email;
          if (userInfo.organization) {
            userInfo.organization.name = response.data.name;
            userInfo.organization.logo = response.data.logo;
            userInfo.organization.themeColor = response.data.themeColor;
            userInfo.organization.grades = response.data.grades;
            userInfo.organization.sections = response.data.sections;
            userInfo.organization.departments = response.data.departments;
            userInfo.organization.parentReasons = response.data.parentReasons;
            userInfo.organization.vendorReasons = response.data.vendorReasons;
            userInfo.organization.otherReasons = response.data.otherReasons;
            userInfo.organization.approvingAuthorities = response.data.approvingAuthorities;
            userInfo.organization.contactPerson = response.data.contactPerson;
            userInfo.organization.phone = response.data.phone;
            userInfo.organization.address = response.data.address;
          }
          localStorage.setItem('vms_user', JSON.stringify(userInfo));
        }

        // 3. Fire custom event to trigger instant sidebar/header refresh
        window.dispatchEvent(new Event('brandingUpdated'));
      } else {
        setError(response.message || 'Failed to update settings.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection error. Could not update settings.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="settings-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <span className="login-card__spinner" style={{ borderColor: '#e2e8f0', borderTopColor: '#2563eb', width: '32px', height: '32px', borderWidth: '4px' }}></span>
      </div>
    );
  }

  return (
    <div className="settings-container" style={{ '--theme-color': themeColor }}>

      {/* Tab Headers */}
      <div className="settings-tabs-container">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''} ${hasProfileErrors ? 'tab-btn--error' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
          {hasProfileErrors && <span className="tab-error-dot"></span>}
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'business_info' ? 'active' : ''} ${hasBusinessErrors ? 'tab-btn--error' : ''}`}
          onClick={() => setActiveTab('business_info')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          Manage Dropdown List
          {hasBusinessErrors && <span className="tab-error-dot"></span>}
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'reasons' ? 'active' : ''} ${hasReasonsErrors ? 'tab-btn--error' : ''}`}
          onClick={() => setActiveTab('reasons')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Visitor Reasons
          {hasReasonsErrors && <span className="tab-error-dot"></span>}
        </button>
      </div>

      {success && (
        <div className="settings-alert settings-alert--success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      {error && (
        <div className="settings-alert settings-alert--error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span style={{ fontWeight: '700' }}>{error}</span>
          </div>
          {Object.values(errors).some(x => x) && (
            <ul style={{ margin: '4px 0 4px 26px', padding: 0, fontSize: '12.5px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {Object.entries(errors).map(([key, val]) => {
                if (!val) return null;
                let tabName = '';
                if (['name', 'contactPerson', 'email', 'phone', 'address'].includes(key)) tabName = 'Profile';
                else if (['grades', 'sections', 'departments', 'approvingAuthorities'].includes(key)) tabName = 'Manage Dropdown List';
                else if (['parentReasons', 'vendorReasons', 'otherReasons'].includes(key)) tabName = 'Visitor Reasons';
                return (
                  <li key={key} style={{ color: '#be123c', lineHeight: '1.4' }}>
                    <strong style={{ textTransform: 'uppercase', fontSize: '11px', background: '#ffe4e6', padding: '2px 6px', borderRadius: '4px', marginRight: '6px' }}>{tabName}</strong>
                    {val}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form" noValidate>
        {activeTab === 'profile' && (
          <div className="settings-grid settings-grid--profile anim-fade-in">
            {/* Left Column: Profile Information Form */}
            <div className="settings-card" style={{ flex: 1 }}>
              <h2 className="settings-card__title">Profile Information</h2>
              <div className="settings-form-row">
                <div className="settings-group">
                  <label htmlFor="settings-name" className="settings-label">Organization Name</label>
                  <div className="settings-input-wrapper">
                    <span className="settings-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="settings-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors(prev => ({ ...prev, name: '' }));
                        if (error) setError('');
                      }}
                      placeholder="My School / Company"
                      className={`settings-input settings-input-with-icon ${errors.name ? 'border-error' : ''}`}
                    />
                  </div>
                  {errors.name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.name}</p>}
                </div>

                <div className="settings-group">
                  <label htmlFor="settings-contact" className="settings-label">Contact Person</label>
                  <div className="settings-input-wrapper">
                    <span className="settings-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="settings-contact"
                      value={contactPerson}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContactPerson(val);
                        if (val && !/^[A-Za-z\s]+$/.test(val)) {
                          setErrors(prev => ({ ...prev, contactPerson: 'Contact person name can only contain letters.' }));
                        } else {
                          setErrors(prev => ({ ...prev, contactPerson: '' }));
                        }
                        if (error) setError('');
                      }}
                      placeholder="Full Name"
                      className={`settings-input settings-input-with-icon ${errors.contactPerson ? 'border-error' : ''}`}
                    />
                  </div>
                  {errors.contactPerson && <p className="error-text" style={{ marginTop: '4px' }}>{errors.contactPerson}</p>}
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-group" style={{ flex: 1 }}>
                  <label className="settings-label">Organization Code</label>
                  <div className="settings-input-wrapper">
                    <span className="settings-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={organizationCode}
                      readOnly
                      className="settings-input settings-input-with-icon"
                      style={{ background: '#f3f4f6', cursor: 'default', paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="settings-password-toggle"
                      title={copied ? 'Copied!' : 'Copy Code'}
                      style={{ border: 'none', background: 'none' }}
                    >
                      {copied ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="settings-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                    💡 <strong>Note:</strong> Use this code when logging into VMS if your email exists in multiple organizations.
                  </p>
                </div>
              </div>

              <div className="settings-form-row">
                <div className="settings-group">
                  <label htmlFor="settings-email" className="settings-label">Admin Email Address</label>
                  <div className="settings-input-wrapper">
                    <span className="settings-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-10 6L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="settings-email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors(prev => ({ ...prev, email: '' }));
                        if (error) setError('');
                      }}
                      placeholder="admin@myorg.com"
                      className={`settings-input settings-input-with-icon ${errors.email ? 'border-error' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="error-text" style={{ marginTop: '4px' }}>{errors.email}</p>}
                </div>

                <div className="settings-group">
                  <label htmlFor="settings-phone" className="settings-label">Phone Number</label>
                  <div className="settings-input-wrapper">
                    <span className="settings-input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span style={{ marginLeft: '8px', fontWeight: '600', color: '#475569', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }}>
                        <span>+91</span>
                        <span style={{ marginLeft: '6px', marginRight: '2px' }}>-</span>
                      </span>
                    </span>
                    <input
                      type="text"
                      id="settings-phone"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length > 10) return;
                        setPhone(val);
                        if (val && !/^\d+$/.test(val)) {
                          setErrors(prev => ({ ...prev, phone: 'Phone number can only contain digits.' }));
                        } else if (val && val.length !== 10) {
                          setErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
                        } else {
                          setErrors(prev => ({ ...prev, phone: '' }));
                        }
                        if (error) setError('');
                      }}
                      placeholder="98********"
                      className={`settings-input settings-input-with-prefix ${errors.phone ? 'border-error' : ''}`}
                    />
                  </div>
                  {errors.phone && <p className="error-text" style={{ marginTop: '4px' }}>{errors.phone}</p>}
                </div>
              </div>

              <div className="settings-group" style={{ marginTop: '12px' }}>
                <label htmlFor="settings-address" className="settings-label">Address</label>
                <div className="settings-input-wrapper">
                  <span className="settings-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="settings-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setErrors(prev => ({ ...prev, address: '' }));
                      if (error) setError('');
                    }}
                    placeholder="Organization HQ Address"
                    className={`settings-input settings-input-with-icon ${errors.address ? 'border-error' : ''}`}
                  />
                </div>
                {errors.address && <p className="error-text" style={{ marginTop: '4px' }}>{errors.address}</p>}
              </div>

              <div className="settings-group" style={{ marginTop: '12px' }}>
                <label htmlFor="settings-password" className="settings-label">Password</label>
                <div className="settings-input-wrapper">
                  <span className="settings-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="settings-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Leave blank to keep current password"
                    className="settings-input settings-input-with-icon"
                  />
                  <button
                    type="button"
                    className="settings-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Logo & Preview */}
            <div className="settings-card logo-preview-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 className="settings-card__title">Organization Logo</h2>
              <div className="preview-box">
                <div className={`preview-logo-placeholder ${logo ? 'has-image' : ''}`} style={{ width: '100%', height: '140px' }}>
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo Preview"
                      className="preview-logo-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerText = 'No Logo Uploaded';
                      }}
                    />
                  ) : (
                    'No Logo Uploaded'
                  )}
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '16px', fontWeight: '500', lineHeight: '1.5' }}>
                  This logo is displayed in the sidebar header and on all printable gatepasses.
                </p>
              </div>

              <div className="settings-group" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <label
                    className="settings-save-btn"
                    style={{
                      margin: 0,
                      backgroundColor: '#1d4ed8',
                      color: '#ffffff',
                      boxShadow: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                      height: '48px',
                      boxSizing: 'border-box',
                      width: '100%'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {logo ? 'Change Logo' : 'Upload Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginTop: '4px' }}>Uploading file...</span>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business_info' && (
          <div className="settings-card anim-fade-in">
            <h2 className="settings-card__title">Manage Dropdown List</h2>
            
            {/* Grades & Sections */}
            <div className="management-grid">
              {/* Grades Column */}
              <div className="settings-column">
                <span className="settings-label">Grade</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter Grade"
                    value={customGradeInput}
                    onChange={(e) => setCustomGradeInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddGrade(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddGrade}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.grades && <p className="error-text" style={{ marginTop: '4px' }}>{errors.grades}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <span className="settings-label-sub">Grades Configured</span>
                  <div className="settings-tags-list">
                    {selectedGrades.length > 0 ? (
                      selectedGrades.map((g, index) => (
                        <span key={`${g}-${index}`} className="settings-tag-pill">
                          {g}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteGrade(g)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No grades added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sections Column */}
              <div className="settings-column">
                <span className="settings-label">Section</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter Section"
                    value={customSectionInput}
                    onChange={(e) => setCustomSectionInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSection(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.sections && <p className="error-text" style={{ marginTop: '4px' }}>{errors.sections}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <span className="settings-label-sub">Sections Configured</span>
                  <div className="settings-tags-list">
                    {selectedSections.length > 0 ? (
                      selectedSections.map((s, index) => (
                        <span key={`${s}-${index}`} className="settings-tag-pill">
                          {s}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteSection(s)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No sections added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Departments & Authorities */}
            <div className="management-grid" style={{ marginTop: '32px' }}>
              {/* Departments Column */}
              <div className="settings-column">
                <span className="settings-label">Department</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter Department"
                    value={customDepartmentInput}
                    onChange={(e) => setCustomDepartmentInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDepartment(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.departments && <p className="error-text" style={{ marginTop: '4px' }}>{errors.departments}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <span className="settings-label-sub">Departments Configured</span>
                  <div className="settings-tags-list">
                    {selectedDepartments.length > 0 ? (
                      selectedDepartments.map((d, index) => (
                        <span key={`${d}-${index}`} className="settings-tag-pill">
                          {d}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteDepartment(d)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No departments added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Authorities Column */}
              <div className="settings-column">
                <span className="settings-label">Approving Authority</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter Authority Name/Role"
                    value={customAuthorityInput}
                    onChange={(e) => setCustomAuthorityInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAuthority(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddAuthority}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.approvingAuthorities && <p className="error-text" style={{ marginTop: '4px' }}>{errors.approvingAuthorities}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <span className="settings-label-sub">Authorities Configured</span>
                  <div className="settings-tags-list">
                    {selectedAuthorities.length > 0 ? (
                      selectedAuthorities.map((a, index) => (
                        <span key={`${a}-${index}`} className="settings-tag-pill">
                          {a}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteAuthority(a)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No authorities added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reasons' && (
          <div className="settings-card anim-fade-in">
            <h2 className="settings-card__title">Visitor Reasons</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Parent Reasons */}
              <div className="settings-column" style={{ width: '100%' }}>
                <span className="settings-label">Parent Form Reasons</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter visit reason for Parent Form"
                    value={customParentReasonInput}
                    onChange={(e) => setCustomParentReasonInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddParentReason(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddParentReason}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.parentReasons && <p className="error-text" style={{ marginTop: '4px' }}>{errors.parentReasons}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <div className="settings-tags-list">
                    {selectedParentReasons.length > 0 ? (
                      selectedParentReasons.map((r, index) => (
                        <span key={`${r}-${index}`} className="settings-tag-pill">
                          {r}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteParentReason(r)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No parent visit reasons added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Reasons */}
              <div className="settings-column" style={{ width: '100%' }}>
                <span className="settings-label">Vendor Form Reasons</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter visit reason for Vendor Form"
                    value={customVendorReasonInput}
                    onChange={(e) => setCustomVendorReasonInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddVendorReason(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddVendorReason}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.vendorReasons && <p className="error-text" style={{ marginTop: '4px' }}>{errors.vendorReasons}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <div className="settings-tags-list">
                    {selectedVendorReasons.length > 0 ? (
                      selectedVendorReasons.map((r, index) => (
                        <span key={`${r}-${index}`} className="settings-tag-pill">
                          {r}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteVendorReason(r)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No vendor visit reasons added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Other Reasons */}
              <div className="settings-column" style={{ width: '100%' }}>
                <span className="settings-label">Other Form Reasons</span>
                <div className="settings-input-group-inline">
                  <input
                    type="text"
                    placeholder="Enter visit reason for Other Form"
                    value={customOtherReasonInput}
                    onChange={(e) => setCustomOtherReasonInput(e.target.value)}
                    className="settings-input settings-input-stretched"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddOtherReason(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddOtherReason}
                    className="settings-add-item-btn-inline"
                  >
                    Add
                  </button>
                </div>
                {errors.otherReasons && <p className="error-text" style={{ marginTop: '4px' }}>{errors.otherReasons}</p>}

                <div className="settings-list-container" style={{ marginTop: '12px' }}>
                  <div className="settings-tags-list">
                    {selectedOtherReasons.length > 0 ? (
                      selectedOtherReasons.map((r, index) => (
                        <span key={`${r}-${index}`} className="settings-tag-pill">
                          {r}
                          <button
                            type="button"
                            className="settings-tag-delete"
                            onClick={() => handleDeleteOtherReason(r)}
                          >
                            &times;
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="no-tags-placeholder">No other visit reasons added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discard & Save Actions Footer */}
        <div className="settings-actions-footer">
          <button
            type="button"
            className="settings-discard-btn"
            onClick={() => window.location.reload()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Discard
          </button>
          <button
            type="submit"
            className="settings-save-btn"
            disabled={loading}
            style={{ backgroundColor: '#1d4ed8' }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
