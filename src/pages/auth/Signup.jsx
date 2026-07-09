import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'; // Reuse login styles
import { signup, checkExists } from '../../services/api';
import { isSessionValid } from '../../utils/session';

const Signup = () => {
  const navigate = useNavigate();
  
  // Multi-step signup form state
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    orgName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    keyId: '',
    secretKey: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  // Store per‑field validation messages
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect if already logged in AND session is still valid
  useEffect(() => {
    if (isSessionValid()) {
      const user = JSON.parse(localStorage.getItem('vms_user'));
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/gateguard/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Directly update form data for generic fields
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    // Real‑time validation for specific fields
    let msg = '';
    if (name === 'contactPerson') {
      const nameRegex = /^[A-Za-z ]+$/;
      if (!nameRegex.test(value)) msg = 'Only letters and spaces allowed.';
    } else if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 10) msg = 'Maximum 10 digits allowed.';
    } else if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) msg = 'Invalid email format.';
    } else if (name === 'keyId') {
      // ERP key format: VMS-XXXXXXXXXXXXXXXX (prefix + 16 uppercase hex chars)
      const keyRegex = /^[A-Z]{2,3}-[A-F0-9]{16}$/;
      if (value && !keyRegex.test(value.trim().toUpperCase())) {
        msg = 'Format: VMS-XXXXXXXXXXXXXXXX (e.g. VMS-A1B2C3D4E5F6G7H8)';
      }
    }
    setFieldErrors((prev) => ({ ...prev, [name]: msg }));
  };

  // Handle Contact Person input: allow only letters and spaces, show error when invalid chars typed
  const handleContactChange = (value) => {
    // If the input matches the correct regex, update state and clear error
    if (/^[A-Za-z\s]*$/.test(value)) {
      setFormData((prev) => ({ ...prev, contactPerson: value }));
      setFieldErrors((prev) => ({ ...prev, contactPerson: '' }));
    } else {
      // Show error but do not update value (blocking typing of invalid characters)
      setFieldErrors((prev) => ({ ...prev, contactPerson: 'Only letters are allowed' }));
    }
  };

  const handleContactBlur = (e) => {
    const value = e.target.value;
    if (!value) {
      setFieldErrors((prev) => ({ ...prev, contactPerson: '' }));
    } else if (!/^[A-Za-z\s]+$/.test(value)) {
      setFieldErrors((prev) => ({ ...prev, contactPerson: 'Only letters are allowed' }));
    }
  };

  // Handle Phone input: allow only numeric values, limit to 10 digits
  const handlePhoneChange = (value) => {
    // If user typed a non‑numeric character, show error and do not update
    if (/^[0-9]*$/.test(value)) {
      const digits = value.replace(/\D/g, "");
      const limited = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: limited }));
      
      if (limited.length > 0 && limited.length < 10) {
        setFieldErrors((prev) => ({ ...prev, phone: 'Enter valid 10 digit number' }));
      } else {
        setFieldErrors((prev) => ({ ...prev, phone: '' }));
      }
    } else {
      setFieldErrors((prev) => ({ ...prev, phone: 'Only numbers are allowed' }));
    }
  };

  const handlePhoneBlur = (e) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setFieldErrors((prev) => ({ ...prev, phone: '' }));
    } else if (digits.length < 10) {
      setFieldErrors((prev) => ({ ...prev, phone: 'Enter valid 10 digit number' }));
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    // Validate Step 1 fields
    if (
      !formData.orgName ||
      !formData.contactPerson ||
      !formData.email ||
      !formData.phone ||
      !formData.address ||
      !formData.password
    ) {
      setError('Please fill in all the details.');
      return;
    }
    // Contact Person name validation: letters and spaces only
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(formData.contactPerson)) {
      setError('Contact Person name must contain only letters and spaces.');
      return;
    }
    // Phone number validation: exactly 10 digits after removing non‑digits
    const cleanedPhone = formData.phone.replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      setError('Phone number must contain exactly 10 digits.');
      return;
    }
    // Email format validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Password length validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const response = await checkExists(formData.email, formData.phone);
      if (response.success && response.data && response.data.exists) {
        setError(response.data.message);
        setLoading(false);
        return;
      }
      setError('');
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Validation check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.keyId || !formData.secretKey) {
      setError('Please fill in key credentials generated in DCS ERP.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await signup(formData);

      if (response.success) {
        setSuccess('Registration successful! Redirecting...');
        // Store user in localStorage for session persistence
        localStorage.setItem('vms_user', JSON.stringify(response.data));
        
        // Store tenant organization context
        if (response.data.organization) {
          const orgInfo = {
            name: response.data.organization.name,
            logo: response.data.organization.logo,
            themeColor: response.data.organization.themeColor,
            grades: response.data.organization.grades || '',
            sections: response.data.organization.sections || '',
            modules: response.data.enabledModules || []
          };
          localStorage.setItem('vms_org', JSON.stringify(orgInfo));
        }

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        setError(response.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Connection error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Decorative background rings */}
      <div className="login-page__bg-ring login-page__bg-ring--1"></div>
      <div className="login-page__bg-ring login-page__bg-ring--2"></div>
      <div className="login-page__bg-ring login-page__bg-ring--3"></div>

      <div className={`login-card-single ${step === 1 ? 'signup-card--wide' : ''}`}>
        <div className="login-card__header">
          <h2 className="login-card__app-title">Visitor Management System</h2>
        </div>

        <div className="login-card__content">
          <h2 className="login-card__form-title" style={{ fontSize: '28px' }}>Register Organization</h2>
          <p className="login-card__form-subtitle">
            {step === 1 ? 'Step 1: Contact & Profile Details' : 'Step 2: ERP License Key Verification'}
          </p>

          {error && (
            <div className="login-card__error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="login-card__error" role="alert" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="login-card__form" id="signup-form-step1" style={{ gap: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px 16px'
              }}>
                {/* Organization Name Field */}
                <div className="login-field">
                  <label htmlFor="signup-orgname" className="login-field__label">
                    Organization Name
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="signup-orgname"
                      name="orgName"
                      placeholder="My School / Company"
                      value={formData.orgName}
                      onChange={handleChange}
                      required
                      className="login-field__input"
                    />
                  </div>
                </div>

                {/* Contact Person Field */}
                <div className="login-field">
                  <label htmlFor="signup-contact" className="login-field__label">
                    Contact Person
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      id="signup-contact"
                      name="contactPerson"
                      placeholder="Full Name"
                      value={formData.contactPerson}
                      onChange={(e) => handleContactChange(e.target.value)}
                      onBlur={handleContactBlur}
                      required
                      className="login-field__input"
                      style={fieldErrors.contactPerson ? { borderColor: '#ef4444' } : {}}
                    />
                  </div>
                  {fieldErrors.contactPerson && (
                    <div className="field-error" style={{ color: '#ef4444', marginTop: '4px', fontSize: '11px', fontWeight: '600' }}>{fieldErrors.contactPerson}</div>
                  )}
                </div>

                {/* Email Field */}
                <div className="login-field">
                  <label htmlFor="signup-email" className="login-field__label">
                    Admin Email Address
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-10 6L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      id="signup-email"
                      name="email"
                      placeholder="admin@myorg.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      className="login-field__input"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="login-field">
                  <label htmlFor="signup-phone" className="login-field__label">
                    Phone Number
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      id="signup-phone"
                      name="phone"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      required
                      maxLength={10}
                      className="login-field__input"
                      style={fieldErrors.phone ? { borderColor: '#ef4444' } : {}}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <div className="field-error" style={{ color: '#ef4444', marginTop: '4px', fontSize: '11px', fontWeight: '600' }}>{fieldErrors.phone}</div>
                  )}
                </div>

                {/* Address Field */}
                <div className="login-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="signup-address" className="login-field__label">
                    Address
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon" style={{ top: '12px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <textarea
                      id="signup-address"
                      name="address"
                      placeholder="Organization HQ Address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="login-field__input"
                      style={{ minHeight: '60px', paddingLeft: '42px', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="login-field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="signup-password" className="login-field__label">
                    Password
                  </label>
                  <div className="login-field__input-wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signup-password"
                      name="password"
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      className="login-field__input"
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="login-field__toggle"
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

              {/* Next Button */}
              <button
                type="submit"
                className="login-card__submit"
                id="signup-next"
              >
                Next Step
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="login-card__form" id="signup-form-step2">

              {/* ERP Key Info Banner */}
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <svg style={{ flexShrink: 0, marginTop: '1px', color: '#2563eb' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: '1.5' }}>
                  <strong>License keys are issued by DCS ERP.</strong><br />
                  Your Key ID looks like <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>VMS-A1B2C3D4E5F6G7H8</code> and the Secret Key is sent once via the ERP dashboard.
                </div>
              </div>

              {/* Key ID Field */}
              <div className="login-field">
                <label htmlFor="signup-keyid" className="login-field__label">
                  License Key ID
                </label>
                <div className="login-field__input-wrapper">
                  <span className="login-field__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="signup-keyid"
                    name="keyId"
                    placeholder="VMS-A1B2C3D4E5F6G7H8"
                    value={formData.keyId}
                    onChange={(e) => {
                      // Auto-uppercase for easier entry
                      const upper = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, keyId: upper }));
                      if (error) setError('');
                      const keyRegex = /^[A-Z]{2,3}-[A-F0-9]{16}$/;
                      const msg = upper && !keyRegex.test(upper.trim())
                        ? 'Format: VMS-XXXXXXXXXXXXXXXX (16 hex chars)'
                        : '';
                      setFieldErrors(prev => ({ ...prev, keyId: msg }));
                    }}
                    required
                    className="login-field__input"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.5px', ...(fieldErrors.keyId ? { borderColor: '#ef4444' } : {}) }}
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                </div>
                {fieldErrors.keyId && (
                  <div style={{ color: '#ef4444', marginTop: '4px', fontSize: '11px', fontWeight: '600' }}>
                    {fieldErrors.keyId}
                  </div>
                )}
              </div>

              {/* Secret Key Field */}
              <div className="login-field">
                <label htmlFor="signup-secretkey" className="login-field__label">
                  License Secret Key
                  <span style={{ fontSize: '10px', fontWeight: '500', color: '#94a3b8', marginLeft: '6px' }}>(shown once by ERP)</span>
                </label>
                <div className="login-field__input-wrapper">
                  <span className="login-field__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    id="signup-secretkey"
                    name="secretKey"
                    placeholder="Paste secret key from ERP dashboard"
                    value={formData.secretKey}
                    onChange={handleChange}
                    required
                    className="login-field__input"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="login-card__submit"
                  style={{ background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', boxShadow: 'none' }}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="login-card__submit"
                  id="signup-submit"
                  disabled={loading || !!fieldErrors.keyId}
                >
                  {loading ? (
                    <span className="login-card__spinner"></span>
                  ) : (
                    <>
                      Register
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login Link */}
          <p className="login-card__support" style={{ marginTop: '24px' }}>
            Already have an account?{' '}
            <Link to="/login" className="login-card__support-link" style={{ fontWeight: '700' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Developer Credit */}
      <div className="login-page__footer">
        <p className="login-page__credit">
          Powered by{' '}
          <a href="https://www.devcreationsblr.com" target="_blank" className="login-page__credit-name">
            Dev Creations & Solutions
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
