import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { login, checkEmail } from '../../services/api';
import SupportModal from '../../components/common/SupportModal';
import { isSessionValid } from '../../utils/session';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', organizationCode: '' });
  const [showOrgCode, setShowOrgCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Redirect if already logged in AND session is still valid
  useEffect(() => {
    if (isSessionValid()) {
      const user = JSON.parse(localStorage.getItem('vms_user'));
      const org = JSON.parse(localStorage.getItem('vms_org') || '{}');
      const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        if (!isVmsEnabled) {
          navigate('/admin/accounts/dashboard', { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
      } else if (user.role === 'ACCOUNTANT') {
        navigate('/admin/accounts/fees', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/gateguard/dashboard', { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleEmailBlur = async () => {
    if (!formData.email) return;
    try {
      const res = await checkEmail(formData.email);
      if (res && res.success) {
        setShowOrgCode(res.multipleOrganizations);
      }
    } catch (err) {
      console.error('Error checking email:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    if (showOrgCode && !formData.organizationCode) {
      setError('Organization Code is required.');
      return;
    }
    setLoading(true);

    try {
      let response;
      
      // Mock teacher login for testing
      if (formData.email.trim() === 'teacher@test.com' && formData.password === 'Teacher@12345') {
        response = {
          success: true,
          data: {
            id: 'mock-teacher-1',
            name: 'Sarah Jenkins',
            email: 'teacher@test.com',
            role: 'TEACHER',
            token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.ZHVtbXk',
            organizationId: 'org-1',
            organization: {
              name: 'EduFlow AMS',
              themeColor: '#1a73e8',
              rmsEnabled: true
            }
          }
        };
      } else {
        response = await login(formData.email, formData.password, formData.organizationCode);
      }

      if (response.success) {
        // Prevent global system admin from logging in to client portal
        if (response.data.organizationId === null) {
          setError('Access denied. DCS System Admins must log in through the DCS Admin Portal.');
          setLoading(false);
          return;
        }

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
            modules: response.data.enabledModules || [],
            rmsEnabled: !!response.data.organization.rmsEnabled,
            vmsEnabled: response.data.organization.vmsEnabled !== 0 && response.data.organization.vmsEnabled !== false,
            amsEnabled: !!response.data.organization.amsEnabled,
            organizationCode: response.data.organization.code || ''
          };
          localStorage.setItem('vms_org', JSON.stringify(orgInfo));
        }

        // Navigate to role-based dashboard
        if (response.data.role === 'SUPER_ADMIN' || response.data.role === 'ADMIN') {
          const org = response.data.organization || {};
          const isVmsEnabled = org.vmsEnabled !== 0 && org.vmsEnabled !== false;
          if (!isVmsEnabled) {
            navigate('/admin/accounts/dashboard');
          } else {
            navigate('/admin/dashboard');
          }
        } else if (response.data.role === 'ACCOUNTANT') {
          navigate('/admin/accounts/fees');
        } else if (response.data.role === 'TEACHER') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/gateguard/dashboard');
        }
      } else {
        setError(response.message || 'Invalid email or password. Please try again.');
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

      <div className="login-card-single">
        <div className="login-card__header">
          <h2 className="login-card__app-title">Visitor Management System</h2>
        </div>

        <div className="login-card__content">
          <h2 className="login-card__form-title">Login</h2>
          <p className="login-card__form-subtitle">
            Enter your credentials to access the system
          </p>

          {error && (
            <div className="login-card__error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-card__form" id="login-form">
            {/* Email Field */}
            <div className="login-field">
              <label htmlFor="login-email" className="login-field__label">
                Email Address
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
                  id="login-email"
                  name="email"
                  placeholder="admin@school.edu"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailBlur}
                  autoComplete="email"
                  required
                  className="login-field__input"
                />
              </div>
            </div>

            {/* Organization Code Field */}
            {showOrgCode && (
              <div className="login-field anim-slide-down">
                <label htmlFor="login-org-code" className="login-field__label">
                  Organization Code *
                </label>
                <div className="login-field__input-wrapper">
                  <span className="login-field__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="login-org-code"
                    name="organizationCode"
                    placeholder="Enter Organization Code"
                    value={formData.organizationCode}
                    onChange={handleChange}
                    required
                    className="login-field__input"
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="login-password" className="login-field__label">
                  Password
                </label>
              </div>
              <div className="login-field__input-wrapper">
                <span className="login-field__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  className="login-field__input"
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

            {/* Forgot Password Link */}
            <div className="login-forgot-container">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="login-forgot-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-card__submit"
              id="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-card__spinner"></span>
              ) : (
                <>
                  Login
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="login-card__support" style={{ marginTop: '24px' }}>
            New organization? <button type="button" onClick={() => navigate('/signup')} className="login-card__support-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}>Register here</button>
          </p>

          {/* Support Link */}
          <p className="login-card__support" style={{ marginTop: '12px' }}>
            Need help? <button type="button" onClick={() => setIsSupportModalOpen(true)} className="login-card__support-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Contact Support</button>
          </p>
        </div>
      </div>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />

      {/* Developer Credit */}
      <div className="login-page__footer">
        <p className="login-page__credit">
          Powered by <a href="https://www.devcreationsblr.com" target="_blank" className="login-page__credit-name">Dev Creations & Solutions</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
