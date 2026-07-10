import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../services/api';
import SupportModal from '../../components/common/SupportModal';
import './Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setSubmitted(true);
      } else {
        setError(response.message || 'Email not found.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to process request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openEmailProvider = (provider) => {
    const urls = {
      gmail: 'https://mail.google.com',
      outlook: 'https://outlook.live.com',
      yahoo: 'https://mail.yahoo.com'
    };
    window.open(urls[provider], '_blank');
  };

  return (
    <div className="login-page">
      {/* Decorative background rings */}
      <div className="login-page__bg-ring login-page__bg-ring--1"></div>
      <div className="login-page__bg-ring login-page__bg-ring--2"></div>
      <div className="login-page__bg-ring login-page__bg-ring--3"></div>

      <div className="login-card-single">
        {/* Card Header with Logo */}
        <div className="login-card__header">
          <h2 className="login-card__app-title">Visitor Management System</h2>
        </div>

        <div className="login-card__content">
          {!submitted ? (
            <>
              <h2 className="login-card__form-title">Forgot Password</h2>
              <p className="login-card__form-subtitle">
                Enter your registered email to reset password
              </p>

              {error && (
                <div className="login-card__error" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-card__form">
                <div className="login-field">
                  <label htmlFor="reset-email" className="login-field__label">
                    Registered Email Address
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
                      id="reset-email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="login-field__input"
                    />
                  </div>
                </div>

                <button type="submit" className="login-card__submit" disabled={loading}>
                  {loading ? <span className="login-card__spinner"></span> : (
                    <>
                      Send Reset Link
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#eff6ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: '#2563eb'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17.0022C22 18.1068 21.1046 19.0022 20 19.0022H4C2.89543 19.0022 2 18.1068 2 17.0022V7.00224C2 5.89767 2.89543 5.00224 4 5.00224H20C21.1046 5.00224 22 5.89767 22 7.00224V17.0022Z" />
                  <path d="M2 7L12 14L22 7" />
                </svg>
              </div>
              <h2 className="login-card__form-title">Check Your Email</h2>
              <p className="login-card__form-subtitle">
                We have sent a password reset link to <strong>{email}</strong>.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => openEmailProvider('gmail')}
                  className="login-card__submit"
                  style={{ background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', boxShadow: 'none' }}
                >
                  <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="Gmail" style={{ marginRight: '8px' }} />
                  Open Gmail
                </button>
                <button
                  onClick={() => openEmailProvider('outlook')}
                  className="login-card__submit"
                  style={{ background: '#ffffff', color: '#1f2937', border: '1px solid #e5e7eb', boxShadow: 'none' }}
                >
                  <img src="https://outlook.live.com/favicon.ico" width="16" height="16" alt="Outlook" style={{ marginRight: '8px' }} />
                  Open Outlook
                </button>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '24px' }}>
                Didn't receive the email? <button onClick={() => setSubmitted(false)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', padding: 0 }}>Try again</button>
              </p>
            </div>
          )}

          <p className="login-card__support">
            Remembered your password? <button type="button" onClick={() => navigate('/login')} className="login-card__support-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '700' }}>Back to Login</button>
          </p>
          <p className="login-card__support" style={{ marginTop: '8px' }}>
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

export default ForgotPassword;
