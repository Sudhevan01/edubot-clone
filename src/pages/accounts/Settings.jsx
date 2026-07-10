import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  getAccountsSettings, 
  updateAccountsSetting, 
  uploadAccountsSettingImage,
  getEmailSettings,
  updateEmailSettings,
  sendTestEmail
} from '../../services/api';
import './styling/Accounts.css';

const Settings = () => {
  const user = JSON.parse(localStorage.getItem('vms_user') || '{}');

  // Route protection redirect for manual address bar access
  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin/accounts/dashboard" replace />;
  }

  const [activeTab, setActiveTab] = useState('branding'); // 'branding', 'email', or 'whatsapp'

  const [settings, setSettings] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    website: '',
    alternative_contact_number: '',
    extra_info: '',
    gst_number: '',
    school_logo: null,
    watermark_logo: null,
    background_letterhead: null,
    principal_signature: null,
    accountant_signature: null,
    fee_seal: null,
    salary_seal: null,
    whatsapp_enabled: 0,
    whatsapp_auto_send: 1,
    whatsapp_template_name: '',
    whatsapp_message_template: '',
    whatsapp_max_retries: 3,
    whatsapp_tracking_enabled: 1,
    whatsapp_sender_name: ''
  });

  const [fieldsOrder, setFieldsOrder] = useState([
    'school_name',
    'extra_info',
    'school_address',
    'school_phone',
    'alternative_contact_number',
    'school_email',
    'website'
  ]);

  const [emailSettings, setEmailSettings] = useState({
    auto_send_enabled: 0,
    from_name: '',
    sender_email: '',
    reply_to_email: '',
    subject_template: 'Salary Slip for {{MONTH}}',
    body_template: 'Dear {{EMPLOYEE_NAME}},\n\nPlease find attached your salary slip for {{MONTH}}.\n\nNet Salary: ₹{{NET_SALARY}}\n\nRegards,\nAccounts Department',
    footer_template: ''
  });

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Test Email States
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testError, setTestError] = useState('');
  const [testSuccess, setTestSuccess] = useState('');
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [errors, setErrors] = useState({});



  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAccountsSettings();
      if (res.success && res.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data
        }));
        if (res.data.header_fields_order) {
          try {
            const parsed = JSON.parse(res.data.header_fields_order);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFieldsOrder(parsed);
            }
          } catch (e) {}
        }
      } else {
        setError(res.message || 'Failed to fetch settings.');
      }

      // Fetch Email settings
      const emailRes = await getEmailSettings();
      if (emailRes.success && emailRes.data) {
        setEmailSettings(emailRes.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (testSuccess) {
      const timer = setTimeout(() => {
        setTestSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [testSuccess]);

  useEffect(() => {
    const handleSidebarClick = (e) => {
      if (e.detail && e.detail.path === '/admin/accounts/settings') {
        setActiveTab('branding');
        setError('');
        setSuccessMsg('');
        setTestSuccess('');
        setTestError('');
        setErrors({});
      }
    };
    window.addEventListener('sidebar-click', handleSidebarClick);
    return () => {
      window.removeEventListener('sidebar-click', handleSidebarClick);
    };
  }, []);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const handleEmailInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const handleSaveEmailSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const newErrors = {};
    if (!emailSettings.from_name || !emailSettings.from_name.trim()) {
      newErrors.from_name = "From Name is mandatory";
    }
    if (emailSettings.sender_email && emailSettings.sender_email.trim() && !/\S+@\S+\.\S+/.test(emailSettings.sender_email)) {
      newErrors.sender_email = "Please enter a valid email address";
    }
    if (!emailSettings.smtp_host || !emailSettings.smtp_host.trim()) {
      newErrors.smtp_host = "SMTP Host is mandatory";
    }
    if (!emailSettings.smtp_port) {
      newErrors.smtp_port = "SMTP Port is mandatory";
    }
    if (!emailSettings.smtp_username || !emailSettings.smtp_username.trim()) {
      newErrors.smtp_username = "SMTP Username is mandatory";
    }
    if (!emailSettings.smtp_password || !emailSettings.smtp_password.trim()) {
      newErrors.smtp_password = "SMTP Password is mandatory";
    }
    if (!emailSettings.subject_template || !emailSettings.subject_template.trim()) {
      newErrors.subject_template = "Email Subject Template is mandatory";
    }
    if (!emailSettings.body_template || !emailSettings.body_template.trim()) {
      newErrors.body_template = "Email Body Template is mandatory";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    setSavingEmailSettings(true);
    try {
      const res = await updateEmailSettings(emailSettings);
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setError(res.message || 'Failed to save email settings.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update email settings.');
    } finally {
      setSavingEmailSettings(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    setTestError('');
    setTestSuccess('');

    const newErrors = {};
    if (!testEmail || !testEmail.trim()) {
      newErrors.testEmail = "Test Receiver Email Address is mandatory";
    } else if (!/\S+@\S+\.\S+/.test(testEmail)) {
      newErrors.testEmail = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTestError('Please correct the validation errors.');
      return;
    }

    setTestingEmail(true);
    try {
      const res = await sendTestEmail({
        test_email: testEmail,
        from_name: emailSettings.from_name,
        sender_email: emailSettings.sender_email,
        reply_to_email: emailSettings.reply_to_email,
        smtp_host: emailSettings.smtp_host,
        smtp_port: emailSettings.smtp_port,
        smtp_username: emailSettings.smtp_username,
        smtp_password: emailSettings.smtp_password,
        smtp_encryption: emailSettings.smtp_encryption
      });
      if (res.success) {
        setTestSuccess(res.message);
      } else {
        setTestError(res.message || 'Failed to send test email.');
      }
    } catch (err) {
      console.error(err);
      setTestError(err.message || 'Test email failed.');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveTextSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const newErrors = {};
    if (!settings.school_name || !settings.school_name.trim()) {
      newErrors.school_name = "School Name is mandatory";
    }
    if (!settings.school_address || !settings.school_address.trim()) {
      newErrors.school_address = "School Address is mandatory";
    }
    if (!settings.school_phone || !settings.school_phone.trim()) {
      newErrors.school_phone = "School Phone Number is mandatory";
    } else {
      const cleanPhone = settings.school_phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.school_phone = "Phone number must be exactly 10 digits.";
      }
    }
    if (!settings.school_email || !settings.school_email.trim()) {
      newErrors.school_email = "School Contact Email is mandatory";
    } else if (!/\S+@\S+\.\S+/.test(settings.school_email)) {
      newErrors.school_email = "Please enter a valid email address";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    setSaving(true);
    try {
      const textKeys = [
        'school_name',
        'school_address',
        'school_phone',
        'alternative_contact_number',
        'school_email',
        'website',
        'extra_info',
        'gst_number'
      ];

      for (const key of textKeys) {
        await updateAccountsSetting(key, settings[key] || '');
      }

      await updateAccountsSetting('header_fields_order', JSON.stringify(fieldsOrder));

      setSuccessMsg('Receipt branding settings updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save branding details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsAppSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const newErrors = {};
    if (settings.whatsapp_enabled === 1) {
      if (!settings.whatsapp_sender_name || !settings.whatsapp_sender_name.trim()) {
        newErrors.whatsapp_sender_name = "Sender Display Name is mandatory when WhatsApp is enabled.";
      }
      if (!settings.whatsapp_template_name || !settings.whatsapp_template_name.trim()) {
        newErrors.whatsapp_template_name = "Template Name is mandatory when WhatsApp is enabled.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('Please correct the validation errors below.');
      return;
    }

    setSaving(true);
    try {
      const whatsappKeys = [
        'whatsapp_enabled',
        'whatsapp_auto_send',
        'whatsapp_template_name',
        'whatsapp_message_template',
        'whatsapp_max_retries',
        'whatsapp_tracking_enabled',
        'whatsapp_sender_name'
      ];

      for (const key of whatsappKeys) {
        const value = settings[key];
        await updateAccountsSetting(key, value === null ? '' : value);
      }

      setSuccessMsg('WhatsApp settings updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save WhatsApp details.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError('File size too large. Please upload an image under 2MB.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const res = await uploadAccountsSettingImage(type, file);
      if (res.success) {
        setSettings(prev => ({
          ...prev,
          [type]: res.path
        }));
        setSuccessMsg(`${type.replace('_', ' ').toUpperCase()} updated successfully.`);
      } else {
        setError(res.message || 'Failed to upload image.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection error during upload.');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleRemoveImage = async (type) => {
    if (!window.confirm(`Are you sure you want to remove the ${type.replace('_', ' ')}?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const res = await updateAccountsSetting(type, null);
      if (res.success) {
        setSettings(prev => ({
          ...prev,
          [type]: null
        }));
        setSuccessMsg(`${type.replace('_', ' ').toUpperCase()} removed successfully.`);
      } else {
        setError(res.message || 'Failed to remove image.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection error during removal.');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading accounts settings...</p>
      </div>
    );
  }

  const uploadSections = [
    { key: 'school_logo', label: 'School Logo', desc: 'Appears at the header of fee and salary receipts.' },
    { key: 'watermark_logo', label: 'Watermark Logo', desc: 'Faded background image scaled at the center of the PDF.' },
    { key: 'accountant_signature', label: 'Accountant Signature', desc: 'Authorized signature printed on bottom-center of PDFs.' },
    { key: 'salary_seal', label: 'Salary Slip Stamp Seal', desc: 'Printed on bottom-right of Salary Slip PDF.' }
  ];

  return (
    <div className="accounts-container" style={{ gap: '20px' }}>

      {/* Tabs */}
      <div className="templates-tabs">
        {user.role === 'SUPER_ADMIN' && (
          <>
            <button
              className={`templates-tab-btn ${activeTab === 'branding' ? 'templates-tab-btn--active' : ''}`}
              onClick={() => { setError(''); setSuccessMsg(''); setActiveTab('branding'); }}
            >
              Branding & Seal
            </button>
            <button
              className={`templates-tab-btn ${activeTab === 'email' ? 'templates-tab-btn--active' : ''}`}
              onClick={() => { setError(''); setSuccessMsg(''); setActiveTab('email'); }}
            >
              Salary Email Configuration
            </button>
            <button
              className={`templates-tab-btn ${activeTab === 'whatsapp' ? 'templates-tab-btn--active' : ''}`}
              onClick={() => { setError(''); setSuccessMsg(''); setActiveTab('whatsapp'); }}
            >
              WhatsApp Configuration
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="accounts-alert-toast accounts-alert-toast--error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <div style={{ flexGrow: 1 }}>{error}</div>
          <button type="button" onClick={() => setError('')} className="accounts-alert-toast__close-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}
      {successMsg && (
        <div className="accounts-alert-toast accounts-alert-toast--success" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"></polyline></svg>
          <div style={{ flexGrow: 1 }}>{successMsg}</div>
          <button type="button" onClick={() => setSuccessMsg('')} className="accounts-alert-toast__close-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      )}

      {activeTab === 'branding' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', width: '100%', alignItems: 'flex-start' }}>
          
          {/* Left Column: Branding Texts Form */}
          <form onSubmit={handleSaveTextSettings} className="accounts-form-card" style={{ flex: '1 1 350px', padding: '24px' }} noValidate>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '16px' }}>School Identity Info</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {fieldsOrder.map((key, idx) => {
                const moveField = (direction) => {
                  if (direction === 'up' && idx === 0) return;
                  if (direction === 'down' && idx === fieldsOrder.length - 1) return;
                  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                  const updated = [...fieldsOrder];
                  const temp = updated[idx];
                  updated[idx] = updated[targetIdx];
                  updated[targetIdx] = temp;
                  setFieldsOrder(updated);
                };

                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                    {isSuperAdmin && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignSelf: 'center', minWidth: '24px' }}>
                        <button 
                          type="button" 
                          onClick={() => moveField('up')} 
                          style={{ border: '1px solid var(--neutral-300)', borderRadius: '4px', background: 'white', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', color: 'var(--text-muted)' }} 
                          disabled={idx === 0}
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveField('down')} 
                          style={{ border: '1px solid var(--neutral-300)', borderRadius: '4px', background: 'white', cursor: 'pointer', padding: '4px 6px', fontSize: '10px', color: 'var(--text-muted)' }} 
                          disabled={idx === fieldsOrder.length - 1}
                        >
                          ▼
                        </button>
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      {key === 'school_name' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">School Name *</label>
                          <input
                            type="text"
                            name="school_name"
                            value={settings.school_name || ''}
                            onChange={handleInputChange}
                            className={`accounts-form-input ${errors.school_name ? 'border-error' : ''}`}
                            disabled={!isSuperAdmin}
                          />
                          {errors.school_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.school_name}</p>}
                        </div>
                      )}
                      {key === 'school_address' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">School Address *</label>
                          <textarea
                            name="school_address"
                            value={settings.school_address || ''}
                            onChange={handleInputChange}
                            className={`accounts-form-textarea ${errors.school_address ? 'border-error' : ''}`}
                            rows="3"
                            style={{ resize: 'none' }}
                            disabled={!isSuperAdmin}
                          />
                          {errors.school_address && <p className="error-text" style={{ marginTop: '4px' }}>{errors.school_address}</p>}
                        </div>
                      )}
                      {key === 'school_phone' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">School Phone Number *</label>
                          <input
                            type="text"
                            name="school_phone"
                            value={settings.school_phone || ''}
                            onChange={handleInputChange}
                            className={`accounts-form-input ${errors.school_phone ? 'border-error' : ''}`}
                            disabled={!isSuperAdmin}
                          />
                          {errors.school_phone && <p className="error-text" style={{ marginTop: '4px' }}>{errors.school_phone}</p>}
                        </div>
                      )}
                      {key === 'alternative_contact_number' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">Alternative Contact Number</label>
                          <input
                            type="text"
                            name="alternative_contact_number"
                            value={settings.alternative_contact_number || ''}
                            onChange={handleInputChange}
                            className="accounts-form-input"
                            disabled={!isSuperAdmin}
                          />
                        </div>
                      )}
                      {key === 'school_email' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">School Contact Email *</label>
                          <input
                            type="email"
                            name="school_email"
                            value={settings.school_email || ''}
                            onChange={handleInputChange}
                            className={`accounts-form-input ${errors.school_email ? 'border-error' : ''}`}
                            disabled={!isSuperAdmin}
                          />
                          {errors.school_email && <p className="error-text" style={{ marginTop: '4px' }}>{errors.school_email}</p>}
                        </div>
                      )}
                      {key === 'website' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">School Website</label>
                          <input
                            type="text"
                            name="website"
                            value={settings.website || ''}
                            onChange={handleInputChange}
                            className="accounts-form-input"
                            placeholder="e.g. www.schoolname.com"
                            disabled={!isSuperAdmin}
                          />
                        </div>
                      )}
                      {key === 'extra_info' && (
                        <div className="accounts-form-group" style={{ marginBottom: 0 }}>
                          <label className="accounts-form-label">Extra Header Info (Optional)</label>
                          <textarea
                            name="extra_info"
                            placeholder="e.g. Affiliated to CBSE. Affiliation No. : 1234567, or any custom tagline"
                            value={settings.extra_info || ''}
                            onChange={handleInputChange}
                            className="accounts-form-textarea"
                            rows="2"
                            style={{ resize: 'none' }}
                            disabled={!isSuperAdmin}
                          />
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>This text appears below the school name in the receipt header. Leave blank to hide.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSuperAdmin && (
                <button type="submit" disabled={saving} className="accounts-btn accounts-btn--primary" style={{ marginTop: '12px', width: '100%' }}>
                  {saving ? 'Saving details...' : 'Save Branding Information'}
                </button>
              )}
            </div>
          </form>

          {/* Right Column: Upload Options with Previews */}
          <div style={{ flex: '1.2 1 450px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {uploadSections.map((sec) => (
              <div key={sec.key} className="accounts-form-card" style={{ padding: '16px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 2px' }}>{sec.label}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>{sec.desc}</p>
                </div>

                <div className={`settings-upload-box ${settings[sec.key] ? 'settings-upload-box--active' : ''}`} style={{ minHeight: '120px', padding: '12px' }}>
                  {settings[sec.key] ? (
                    <div style={{ textAlign: 'center' }}>
                      <img src={settings[sec.key]} alt="Uploaded Asset" className="settings-preview-img" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
                      {isSuperAdmin && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <label className="accounts-btn accounts-btn--secondary" style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', margin: 0 }}>
                            Replace
                            <input 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={(e) => handleFileUpload(e, sec.key)} 
                              disabled={uploading[sec.key]}
                            />
                          </label>
                          <button
                            type="button"
                            className="accounts-btn accounts-btn--secondary"
                            style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '11px', color: 'var(--danger-600)', borderColor: 'var(--danger-200)' }}
                            onClick={() => handleRemoveImage(sec.key)}
                            disabled={uploading[sec.key]}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                        {!isSuperAdmin ? 'No image uploaded' : 'Click to upload'}
                      </p>
                      {isSuperAdmin && (
                        <label className="accounts-btn accounts-btn--primary" style={{ display: 'inline-flex', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}>
                          Select File
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={(e) => handleFileUpload(e, sec.key)} 
                            disabled={uploading[sec.key]}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {uploading[sec.key] && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '16px' }}>
                      <div className="login-card__spinner" style={{ width: '20px', height: '20px', borderLeftColor: 'var(--primary-500)' }}></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', width: '100%', alignItems: 'flex-start' }}>
          
          {/* Left Column: Email Configuration */}
          <form onSubmit={handleSaveEmailSettings} className="accounts-form-card" style={{ flex: '1.2 1 450px', padding: '24px' }} noValidate>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '16px' }}>Email Settings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="accounts-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="auto_send_enabled"
                  name="auto_send_enabled"
                  checked={emailSettings.auto_send_enabled === 1}
                  onChange={handleEmailInputChange}
                  disabled={isSuperAdmin}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="auto_send_enabled" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Enable Automatic Salary Emails on Generation
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">From Name (School Display Name) *</label>
                  <input
                    type="text"
                    name="from_name"
                    value={emailSettings.from_name || ''}
                    onChange={handleEmailInputChange}
                    className={`accounts-form-input ${errors.from_name ? 'border-error' : ''}`}
                    placeholder="e.g. Accounts Department"
                    disabled={!isSuperAdmin}
                  />
                  {errors.from_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.from_name}</p>}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--neutral-200)', pt: '16px', margin: '6x 0 0px 0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary-700)', margin: '6px 0 0px 0' }}>SMTP Server Credentials</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '14px' }}>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">SMTP Host *</label>
                  <input
                    type="text"
                    name="smtp_host"
                    value={emailSettings.smtp_host || ''}
                    onChange={handleEmailInputChange}
                    className={`accounts-form-input ${errors.smtp_host ? 'border-error' : ''}`}
                    placeholder="e.g. smtp.gmail.com"
                    disabled={!isSuperAdmin}
                  />
                  {errors.smtp_host && <p className="error-text" style={{ marginTop: '4px' }}>{errors.smtp_host}</p>}
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">SMTP Port *</label>
                  <input
                    type="number"
                    name="smtp_port"
                    value={emailSettings.smtp_port || ''}
                    onChange={handleEmailInputChange}
                    className={`accounts-form-input ${errors.smtp_port ? 'border-error' : ''}`}
                    placeholder="e.g. 587"
                    disabled={!isSuperAdmin}
                  />
                  {errors.smtp_port && <p className="error-text" style={{ marginTop: '4px' }}>{errors.smtp_port}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">SMTP Username *</label>
                  <input
                    type="text"
                    name="smtp_username"
                    value={emailSettings.smtp_username || ''}
                    onChange={handleEmailInputChange}
                    className={`accounts-form-input ${errors.smtp_username ? 'border-error' : ''}`}
                    placeholder="e.g. accounts@school.com"
                    disabled={!isSuperAdmin}
                  />
                  {errors.smtp_username && <p className="error-text" style={{ marginTop: '4px' }}>{errors.smtp_username}</p>}
                </div>

                <div className="accounts-form-group">
                  <label className="accounts-form-label">SMTP Password / App Password *</label>
                  <input
                    type="password"
                    name="smtp_password"
                    value={emailSettings.smtp_password || ''}
                    onChange={handleEmailInputChange}
                    className={`accounts-form-input ${errors.smtp_password ? 'border-error' : ''}`}
                    placeholder={emailSettings.has_smtp_password ? '••••••••' : 'Enter SMTP password'}
                    disabled={!isSuperAdmin}
                  />
                  {errors.smtp_password && <p className="error-text" style={{ marginTop: '4px' }}>{errors.smtp_password}</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="accounts-form-group">
                  <label className="accounts-form-label">Encryption Type *</label>
                  <select
                    name="smtp_encryption"
                    value={emailSettings.smtp_encryption || 'TLS'}
                    onChange={handleEmailInputChange}
                    className="accounts-form-select"
                    disabled={!isSuperAdmin}
                  >
                    <option value="TLS">TLS (STARTTLS - e.g. Port 587)</option>
                    <option value="SSL">SSL (e.g. Port 465)</option>
                    <option value="NONE">None (Plain SMTP - e.g. Port 25)</option>
                  </select>
                </div>
              </div>

              {isSuperAdmin && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="submit" disabled={savingEmailSettings} className="accounts-btn accounts-btn--primary">
                    {savingEmailSettings ? 'Saving Settings...' : 'Save Email Settings'}
                  </button>
                </div>
              )}

            </div>
          </form>

          {/* Right Column: Salary Slip Template */}
          <div className="accounts-form-card" style={{ flex: '1 1 320px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '16px' }}>Salary Slip Template</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Email Subject Template *</label>
                <input
                  type="text"
                  name="subject_template"
                  value={emailSettings.subject_template || ''}
                  onChange={handleEmailInputChange}
                  className={`accounts-form-input ${errors.subject_template ? 'border-error' : ''}`}
                  disabled={!isSuperAdmin}
                />
                {errors.subject_template && <p className="error-text" style={{ marginTop: '4px' }}>{errors.subject_template}</p>}
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">
                  Email Body Template (Supports newlines) *
                </label>
                <textarea
                  name="body_template"
                  value={emailSettings.body_template || ''}
                  onChange={handleEmailInputChange}
                  className={`accounts-form-textarea ${errors.body_template ? 'border-error' : ''}`}
                  rows="8"
                  disabled={!isSuperAdmin}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
                {errors.body_template && <p className="error-text" style={{ marginTop: '4px' }}>{errors.body_template}</p>}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Placeholders: <code>{"{{EMPLOYEE_NAME}}"}</code>, <code>{"{{EMPLOYEE_ID}}"}</code>, <code>{"{{MONTH}}"}</code>, <code>{"{{NET_SALARY}}"}</code>, <code>{"{{SCHOOL_NAME}}"}</code>, <code>{"{{CURRENT_DATE}}"}</code>, <code>{"{{ORGANIZATION_NAME}}"}</code>
                </span>
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Email Footer Notes (Optional)</label>
                <textarea
                  name="footer_template"
                  value={emailSettings.footer_template || ''}
                  onChange={handleEmailInputChange}
                  className="accounts-form-textarea"
                  rows="2"
                  disabled={!isSuperAdmin}
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPreviewModal(true)} 
                  className="accounts-btn accounts-btn--secondary"
                  style={{ borderColor: 'var(--primary-300)', color: 'var(--primary-700)' }}
                >
                  Preview Email
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWhatsAppSettings} className="accounts-form-card" style={{ maxWidth: '650px', padding: '24px' }} noValidate>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '16px' }}>WhatsApp Cloud API Integration</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="accounts-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="whatsapp_enabled"
                  name="whatsapp_enabled"
                  checked={settings.whatsapp_enabled === 1}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_enabled: e.target.checked ? 1 : 0 }))}
                  disabled={!isSuperAdmin}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="whatsapp_enabled" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Enable WhatsApp Messaging
                </label>
              </div>

              <div className="accounts-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="whatsapp_auto_send"
                  name="whatsapp_auto_send"
                  checked={settings.whatsapp_auto_send === 1}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_auto_send: e.target.checked ? 1 : 0 }))}
                  disabled={!isSuperAdmin}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="whatsapp_auto_send" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Auto-Send on Receipt Creation
                </label>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">WhatsApp Sender Name Display *</label>
                <input
                  type="text"
                  name="whatsapp_sender_name"
                  value={settings.whatsapp_sender_name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. DCS International School"
                  className={`accounts-form-input ${errors.whatsapp_sender_name ? 'border-error' : ''}`}
                  disabled={!isSuperAdmin}
                />
                {errors.whatsapp_sender_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.whatsapp_sender_name}</p>}
              </div>

              <div className="accounts-form-group">
                <label className="accounts-form-label">Meta Cloud Template Name *</label>
                <input
                  type="text"
                  name="whatsapp_template_name"
                  value={settings.whatsapp_template_name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. fee_receipt_template"
                  className={`accounts-form-input ${errors.whatsapp_template_name ? 'border-error' : ''}`}
                  disabled={!isSuperAdmin}
                />
                {errors.whatsapp_template_name && <p className="error-text" style={{ marginTop: '4px' }}>{errors.whatsapp_template_name}</p>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="accounts-form-group">
                <label className="accounts-form-label">Max Delivery Retry Attempts</label>
                <input
                  type="number"
                  name="whatsapp_max_retries"
                  value={settings.whatsapp_max_retries !== null ? settings.whatsapp_max_retries : 3}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_max_retries: Math.max(1, Number(e.target.value)) }))}
                  className="accounts-form-input"
                  min="1"
                  max="10"
                  disabled={!isSuperAdmin}
                />
              </div>

              <div className="accounts-form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: 'auto', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="whatsapp_tracking_enabled"
                  name="whatsapp_tracking_enabled"
                  checked={settings.whatsapp_tracking_enabled === 1}
                  onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_tracking_enabled: e.target.checked ? 1 : 0 }))}
                  disabled={!isSuperAdmin}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="whatsapp_tracking_enabled" style={{ fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}>
                  Enable Delivery Status Tracking
                </label>
              </div>
            </div>

            <div className="accounts-form-group">
              <label className="accounts-form-label">WhatsApp Body Message Template Preview / Verification Text</label>
              <textarea
                name="whatsapp_message_template"
                value={settings.whatsapp_message_template || ''}
                onChange={handleInputChange}
                placeholder={`e.g. Dear Parent, please find attached the fee receipt of {{STUDENT_NAME}} for academic year {{ACADEMIC_YEAR}}. Download here: {{DOWNLOAD_URL}}`}
                className="accounts-form-textarea"
                rows="4"
                disabled={!isSuperAdmin}
                style={{ fontFamily: 'monospace', fontSize: '13px', resize: 'none' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Define variables using <code>{"{{VARIABLE}}"}</code> placeholders (e.g. <code>{"{{STUDENT_NAME}}"}</code>, <code>{"{{AMOUNT}}"}</code>, <code>{"{{RECEIPT_NO}}"}</code>, <code>{"{{DATE}}"}</code>, <code>{"{{DOWNLOAD_URL}}"}</code>). They must match variables expected by your registered Meta WhatsApp Cloud Template.
              </span>
            </div>

            {isSuperAdmin && (
              <button type="submit" disabled={saving} className="accounts-btn accounts-btn--primary" style={{ marginTop: '12px', width: '200px' }}>
                {saving ? 'Saving configuration...' : 'Save Configuration'}
              </button>
            )}

          </div>
        </form>
      )}

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '650px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Salary Email Live Preview
              </h3>
              <button 
                onClick={() => setShowPreviewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  fontSize: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Envelope details card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '13px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#475569', width: '80px', display: 'inline-block' }}>From:</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>
                    {emailSettings.from_name || '[From Name]'} <code style={{ backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>&lt;noreply@devcreationsblr.com&gt;</code>
                  </span>
                </div>
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#475569', width: '80px', display: 'inline-block' }}>Subject:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {(() => {
                      const mockVars = {
                        EMPLOYEE_NAME: 'Ravi Kumar',
                        EMPLOYEE_ID: 'EMP1024',
                        MONTH: 'October 2026',
                        NET_SALARY: '45,000',
                        SCHOOL_NAME: settings.school_name || 'VMS Partner School',
                        CURRENT_DATE: 'October 31, 2026',
                        ORGANIZATION_NAME: settings.school_name || 'VMS Partner School'
                      };
                      let subject = emailSettings.subject_template || '';
                      Object.keys(mockVars).forEach(key => {
                        subject = subject.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), mockVars[key]);
                      });
                      return subject;
                    })()}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: '#475569', width: '80px', display: 'inline-block' }}>Attachment:</span>
                  <span style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    SalarySlip_EMP1024_October_2026.pdf
                  </span>
                </div>
              </div>

              {/* Styled Template Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>Email Content Preview:</span>
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '24px',
                  fontFamily: "'Inter', Arial, sans-serif",
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#334155',
                  backgroundColor: '#ffffff',
                  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
                }}>
                  {/* Outer Frame Simulating Recipient Mailbox */}
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {(() => {
                      const mockVars = {
                        EMPLOYEE_NAME: 'Ravi Kumar',
                        EMPLOYEE_ID: 'EMP1024',
                        MONTH: 'October 2026',
                        NET_SALARY: '45,000',
                        SCHOOL_NAME: settings.school_name || 'VMS Partner School',
                        CURRENT_DATE: 'October 31, 2026',
                        ORGANIZATION_NAME: settings.school_name || 'VMS Partner School'
                      };
                      let body = emailSettings.body_template || '';
                      Object.keys(mockVars).forEach(key => {
                        body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), mockVars[key]);
                      });
                      return body;
                    })()}
                  </div>

                  {emailSettings.footer_template && (
                    <div style={{
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '12px',
                      color: '#64748b',
                      fontStyle: 'italic',
                      whiteSpace: 'pre-line'
                    }}>
                      {(() => {
                        const mockVars = {
                          EMPLOYEE_NAME: 'Ravi Kumar',
                          EMPLOYEE_ID: 'EMP1024',
                          MONTH: 'October 2026',
                          NET_SALARY: '45,000',
                          SCHOOL_NAME: settings.school_name || 'VMS Partner School',
                          CURRENT_DATE: 'October 31, 2026',
                          ORGANIZATION_NAME: settings.school_name || 'VMS Partner School'
                        };
                        let footer = emailSettings.footer_template || '';
                        Object.keys(mockVars).forEach(key => {
                          footer = footer.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), mockVars[key]);
                        });
                        return footer;
                      })()}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="accounts-btn accounts-btn--primary"
                style={{ minWidth: '100px' }}
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
