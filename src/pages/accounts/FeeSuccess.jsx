import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getFeeReceiptById, retryFeeWhatsApp, getBaseUrl, downloadAccountsPdf } from '../../services/api';
import dayjs from 'dayjs';

export default function FeeSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('PENDING');
  const [whatsappError, setWhatsappError] = useState('');
  const [showResendConfirm, setShowResendConfirm] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const pollIntervalRef = useRef(null);

  // Fetch receipt details
  const fetchReceiptDetails = async (isPoll = false) => {
    try {
      const res = await getFeeReceiptById(id);
      if (res.success && res.data) {
        setReceipt(res.data);
        setWhatsappStatus(res.data.whatsapp_status || 'PENDING');
        setWhatsappError(res.data.whatsapp_error || '');
        
        // Stop polling if SENT or FAILED
        if (res.data.whatsapp_status === 'SENT' || res.data.whatsapp_status === 'FAILED') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } else {
        if (!isPoll) setError('Failed to retrieve receipt details.');
      }
    } catch (err) {
      console.error('Error fetching receipt details:', err);
      if (!isPoll) setError(err.message || 'Error fetching receipt details.');
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  // Initial fetch and start polling
  useEffect(() => {
    fetchReceiptDetails();

    // Start polling every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchReceiptDetails(true);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  // View PDF
  const handleViewPdf = () => {
    if (!receipt) return;
    const token = localStorage.getItem('vms_user') 
      ? JSON.parse(localStorage.getItem('vms_user')).token 
      : null;
    
    let url = `${getBaseUrl()}/api/accounts/fees/${receipt.id}/pdf${token ? `?token=${token}` : ''}`;
    url = url.replace(/([^:]\/)\/+/g, '$1');
    window.open(url, '_blank');
  };

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!receipt) return;
    try {
      await downloadAccountsPdf(`/accounts/fees/${receipt.id}/pdf`, `${receipt.receipt_no}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed to download receipt PDF.');
    }
  };

  // Print PDF
  const handlePrintPdf = () => {
    if (!receipt) return;
    setPrintLoading(true);
    const userStr = localStorage.getItem('vms_user');
    const token = userStr ? JSON.parse(userStr).token : null;
    let url = `${getBaseUrl()}/api/accounts/fees/${receipt.id}/pdf${token ? `?token=${token}` : ''}`;
    url = url.replace(/([^:]\/)\/+/g, '$1');

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch PDF for print');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setPrintLoading(false);
          // Clean up after print dialog opens
          setTimeout(() => {
            document.body.removeChild(iframe);
            window.URL.revokeObjectURL(url);
          }, 1000);
        };
      })
      .catch(err => {
        console.error(err);
        setPrintLoading(false);
        alert('Failed to print receipt.');
      });
  };

  // Copy Receipt Link
  const handleCopyLink = () => {
    if (!receipt || !receipt.signed_download_url) return;
    navigator.clipboard.writeText(receipt.signed_download_url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Trigger WhatsApp Retry/Resend
  const handleRetryWhatsApp = async () => {
    setRetryLoading(true);
    setError('');
    setShowResendConfirm(false);
    try {
      const res = await retryFeeWhatsApp(receipt.id);
      if (res.success) {
        setWhatsappStatus('QUEUED');
        // Restart polling
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(() => {
            fetchReceiptDetails(true);
          }, 3000);
        }
      } else {
        setError(res.message || 'Failed to trigger WhatsApp resend.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error triggering WhatsApp resend.');
    } finally {
      setRetryLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'SENT':
        return 'whatsapp-badge--sent';
      case 'FAILED':
        return 'whatsapp-badge--failed';
      case 'PROCESSING':
        return 'whatsapp-badge--processing';
      case 'QUEUED':
        return 'whatsapp-badge--queued';
      case 'RETRYING':
        return 'whatsapp-badge--retrying';
      case 'PENDING':
      default:
        return 'whatsapp-badge--pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'SENT': return 'Sent';
      case 'FAILED': return 'Failed';
      case 'PROCESSING': return 'Processing';
      case 'QUEUED': return 'Queued';
      case 'RETRYING': return 'Retrying';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="accounts-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="login-card__spinner" style={{ width: '40px', height: '40px', borderLeftColor: 'var(--primary-500)' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading receipt confirmation...</p>
      </div>
    );
  }

  return (
    <div className="accounts-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px' }}>
      
      {/* Success Banner */}
      <div style={{
        textAlign: 'center',
        padding: '32px 24px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: '#16a34a'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#14532d', marginBottom: '8px' }}>
          Fee Receipt Generated Successfully
        </h1>
        <p style={{ color: '#166534', fontSize: '15px' }}>
          The receipt has been compiled and the transaction is recorded securely in the system.
        </p>
      </div>

      {error && (
        <div className="login-card__error" style={{ marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </div>
      )}

      {/* Grid Layout for Summary & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
        
        {/* Receipt Summary Card */}
        <div className="accounts-form-card" style={{ padding: '24px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Receipt Summary</h3>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)', padding: '4px 12px', borderRadius: '20px' }}>
              {receipt?.receipt_no}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Student Name</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{receipt?.student_name}</span>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Class / Section</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{receipt?.class}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Amount Paid</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-700)' }}>₹{Number(receipt?.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Payment Mode</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{receipt?.payment_mode}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Generated By</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{receipt?.createdByEmail || 'Accountant'}</span>
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Generated Time</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                {receipt?.created_at ? dayjs(receipt.created_at).format('DD MMM YYYY, hh:mm A') : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Delivery Status Card */}
        <div className="accounts-form-card" style={{ padding: '24px', margin: 0 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px', margin: 0 }}>
            WhatsApp Notification Status
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div className={`whatsapp-status-badge ${getStatusBadgeClass(whatsappStatus)}`}>
              {getStatusLabel(whatsappStatus)}
            </div>
            
            {/* Live Message Descriptions */}
            <div style={{ flex: 1 }}>
              {whatsappStatus === 'SENT' && (
                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ✓ Receipt Delivered Successfully
                </span>
              )}
              {whatsappStatus === 'FAILED' && (
                <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚠ Receipt Generated But WhatsApp Failed
                </span>
              )}
              {['QUEUED', 'PROCESSING', 'RETRYING'].includes(whatsappStatus) && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="login-card__spinner" style={{ width: '16px', height: '16px', margin: 0, borderWidth: '2px', borderLeftColor: 'var(--primary-500)' }}></div>
                  Sending receipt via WhatsApp to parent ({receipt?.parent_phone})...
                </span>
              )}
              {whatsappStatus === 'PENDING' && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  WhatsApp notification is pending queue assignment.
                </span>
              )}
            </div>
          </div>

          {whatsappError && whatsappStatus === 'FAILED' && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px',
              color: '#991b1b',
              fontSize: '13px',
              fontFamily: 'monospace',
              marginBottom: '20px'
            }}>
              <strong>Error:</strong> {whatsappError}
            </div>
          )}

          {/* Action buttons inside status card based on status */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {whatsappStatus === 'FAILED' && (
              <button
                onClick={handleRetryWhatsApp}
                disabled={retryLoading}
                className="btn btn--primary"
                style={{ fontSize: '14px', padding: '8px 16px', height: 'auto' }}
              >
                {retryLoading ? 'Retrying...' : 'Retry WhatsApp'}
              </button>
            )}
            
            {whatsappStatus === 'SENT' && (
              <>
                <button
                  onClick={() => setShowResendConfirm(true)}
                  disabled={retryLoading}
                  className="btn btn--secondary"
                  style={{ fontSize: '14px', padding: '8px 16px', height: 'auto', color: 'var(--primary-600)', borderColor: 'var(--primary-600)' }}
                >
                  Send Again
                </button>

                {showResendConfirm && (
                  <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      backgroundColor: '#fff',
                      padding: '24px',
                      borderRadius: '12px',
                      maxWidth: '400px',
                      width: '90%',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700 }}>Resend Receipt?</h4>
                      <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Resend receipt to: <strong style={{ color: 'var(--text-primary)' }}>{receipt?.parent_phone}</strong>?
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          className="btn btn--secondary"
                          style={{ height: 'auto', padding: '8px 16px' }}
                          onClick={() => setShowResendConfirm(false)}
                        >
                          NO
                        </button>
                        <button
                          className="btn btn--primary"
                          style={{ height: 'auto', padding: '8px 16px' }}
                          onClick={handleRetryWhatsApp}
                        >
                          YES
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* PDF Action Buttons */}
      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          {/* Download PDF */}
          <button 
            onClick={handleDownloadPdf}
            style={{
              flex: '1 1 180px',
              maxWidth: '240px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '12px',
              color: '#1d4ed8',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </button>

          {/* Print PDF */}
          <button 
            onClick={handlePrintPdf}
            disabled={printLoading}
            style={{
              flex: '1 1 180px',
              maxWidth: '240px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '12px',
              color: '#15803d',
              fontSize: '15px',
              fontWeight: 700,
              cursor: printLoading ? 'not-allowed' : 'pointer',
              opacity: printLoading ? 0.6 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { if (!printLoading) { e.currentTarget.style.backgroundColor = '#dcfce7'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseOut={(e) => { if (!printLoading) { e.currentTarget.style.backgroundColor = '#f0fdf4'; e.currentTarget.style.transform = 'none'; } }}
          >
            {printLoading ? (
              <div className="login-card__spinner" style={{ width: '16px', height: '16px', margin: 0, borderWidth: '2px', borderLeftColor: '#15803d' }}></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            )}
            {printLoading ? 'Preparing Print...' : 'Print PDF'}
          </button>

          {/* Create New */}
          <button 
            onClick={() => navigate('/admin/accounts/fees/new')}
            style={{
              flex: '1 1 180px',
              maxWidth: '240px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              backgroundColor: '#faf5ff',
              border: '1.5px solid #e9d5ff',
              borderRadius: '12px',
              color: '#6d28d9',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3e8ff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#faf5ff'; e.currentTarget.style.transform = 'none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Create New
          </button>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '16px 0 0 0' }}>
          You can download or print the fee receipt PDF. Create a new fee receipt when needed.
        </p>
      </div>

      {/* Add localized styles to avoid stylesheet complexity */}
      <style>{`
        .whatsapp-status-badge {
          display: inline-flex;
          align-items: center;
          font-weight: 800;
          font-size: 13px;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .whatsapp-badge--pending {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }
        .whatsapp-badge--queued {
          background-color: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }
        .whatsapp-badge--processing {
          background-color: #fff7ed;
          color: #ea580c;
          border: 1px solid #ffedd5;
        }
        .whatsapp-badge--sent {
          background-color: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .whatsapp-badge--failed {
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
        .whatsapp-badge--retrying {
          background-color: #faf5ff;
          color: #7c3aed;
          border: 1px solid #f3e8ff;
        }
      `}</style>

    </div>
  );
}
