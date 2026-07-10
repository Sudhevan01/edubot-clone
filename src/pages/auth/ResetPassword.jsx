import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/api';
import SupportModal from '../../components/common/SupportModal';
import './Login.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(true);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useEffect(() => {
    // Extract email from URL
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get('email');
    const tokenParam = queryParams.get('token');

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
      setVerifying(false);
    } else {
      setError('No valid reset information found in the link.');
      setVerifying(false);
    }

  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await resetPassword(token, email, password);

      if (response.success) {
        setMessage('Password has been reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="login-page">
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderTopColor: '#2563eb' }}></div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-page__bg-ring login-page__bg-ring--1"></div>
      <div className="login-page__bg-ring login-page__bg-ring--2"></div>
      <div className="login-page__bg-ring login-page__bg-ring--3"></div>

      <div className="login-card-single">
        <div className="login-card__header">
          <h2 className="login-card__app-title">Visitor Management System</h2>
        </div>

        <div className="login-card__content">
          <h2 className="login-card__form-title">Set New Password</h2>
          <p className="login-card__form-subtitle">
            Create a strong password for your account
          </p>

          {error && (
            <div className="login-card__error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {message && (
            <div className="login-card__success" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: '#ecfdf5',
              border: '1px solid #d1fae5',
              borderRadius: '12px',
              color: '#059669',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '24px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {message}
            </div>
          )}

          {!message && !error.includes('expired') && (
            <form onSubmit={handleSubmit} className="login-card__form">
              <div className="login-field">
                <label className="login-field__label">New Password</label>
                <div className="login-field__input-wrapper">
                  <span className="login-field__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="login-field__input"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-field__label">Confirm New Password</label>
                <div className="login-field__input-wrapper">
                  <span className="login-field__icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="login-field__input"
                  />
                </div>
              </div>

              <button type="submit" className="login-card__submit" disabled={loading}>
                {loading ? <span className="login-card__spinner"></span> : 'Update Password'}
              </button>
            </form>
          )}

          {error.includes('expired') && (
            <button
              onClick={() => navigate('/forgot-password')}
              className="login-card__submit"
            >
              Request New Link
            </button>
          )}
          <p className="login-card__support" style={{ marginTop: '24px' }}>
            Need help? <button type="button" onClick={() => setIsSupportModalOpen(true)} className="login-card__support-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Contact Support</button>
          </p>
        </div>
      </div>

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};

export default ResetPassword;
