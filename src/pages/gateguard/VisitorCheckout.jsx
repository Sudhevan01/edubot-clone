import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './VisitorCheckout.css';
import { checkoutVisit } from '../../services/api';
import { Html5Qrcode } from 'html5-qrcode';

const VisitorCheckout = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [visitorData, setVisitorData] = useState(null);
  const [manualId, setManualId] = useState('');
  const videoRef = useRef(null);
  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("scanner-video-container");
        const config = { fps: 10 }; // Removed qrbox to use custom overlay

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            console.log("QR Decoded:", decodedText);
            setScannedData(decodedText);
            handleCheckout(decodedText);
            // Stop scanning once detected
            html5QrCode.stop().catch(err => console.error(err));
          },
          (errorMessage) => {
            // Silence common scanning errors
          }
        );
      } catch (err) {
        console.error("Scanner error:", err);
        setError("Could not start scanner. Please ensure camera permissions are granted.");
        setIsScanning(false);
      }
    };

    if (isScanning && !checkoutSuccess) {
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error(err));
      }
    };
  }, [isScanning, checkoutSuccess]);

  useEffect(() => {
    if (checkoutSuccess) {
      const timer = setTimeout(() => {
        navigate('/gateguard/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [checkoutSuccess, navigate]);
  
  const handleCheckout = async (visitId) => {
    setError(null);
    try {
      const response = await checkoutVisit(visitId);
      if (response.success && response.data) {
        const data = response.data;
        setVisitorData({
          ...data,
          id: data.displayId || data.id,
          checkoutTime: data.checkoutTime || data.checkOut || data.exitTime || new Date(),
          name: data.name || data.visitorName || data.studentName || data.facultyName || 'Visitor',
          type: data.type || (visitId.startsWith('G-') ? 'GATEPASS' : 'VISITOR')
        });
        setCheckoutSuccess(true);
        setIsScanning(false);
      } else {
        setError(response.message || "Invalid ID or visitor has already checked out.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during checkout.");
    }
  };

  const handleManualCheckout = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      handleCheckout(manualId.trim());
    }
  };

  if (checkoutSuccess && visitorData) {
    return (
      <div className="visitor-checkout-wrapper">
        <div className="checkout-container success">
          <div className="success-icon-wrap">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>{visitorData.returnTime ? 'Return Recorded' : 'Checkout Successful'}</h1>
          <p>Visitor session has been closed successfully.</p>

          <div className="checkout-summary-card">
            <div className="summary-item">
              <span className="summary-label">{visitorData.type === 'VISITOR' ? 'Visitor' : visitorData.type === 'STUDENT_GP' ? 'Student' : 'Faculty'}</span>
              <span className="summary-value">{visitorData.name || 'Visitor'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Checkout Time</span>
              <span className="summary-value">{new Date(visitorData.checkoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Pass ID</span>
              <span className="summary-value mono-text">{visitorData.displayId || visitorData.id}</span>
            </div>
          </div>

          <button className="done-btn" onClick={() => navigate('/gateguard/dashboard')}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-checkout-wrapper">
      <div className="checkout-container">
        <div className="checkout-header">
          <p>Scan the visitor's QR code or digital pass to complete checkout</p>
        </div>


        <div className="scanner-section">
          <div className="scanner-viewport">
            {error ? (
              <div className="scanner-error">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>{error}</p>
                <button className="retry-btn" onClick={() => { setError(null); setIsScanning(true); }}>
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div
                  id="scanner-video-container"
                  className="scanner-video"
                ></div>
                <div className="scanner-overlay">
                  <div className="scanner-frame">
                    <div className="frame-corner top-left"></div>
                    <div className="frame-corner top-right"></div>
                    <div className="frame-corner bottom-left"></div>
                    <div className="frame-corner bottom-right"></div>
                    <div className="scanner-line"></div>
                  </div>
                </div>
                <div className="scanner-hint">
                  Position QR code within the frame
                </div>
              </>
            )}
          </div>
        </div>

        <div className="checkout-actions">
          <div className="divider-text">
            <span>OR ENTER PASS ID</span>
          </div>

          <form className="manual-id-form" onSubmit={handleManualCheckout}>
            <input
              type="text"
              placeholder="Enter ID (e.g. V-XXXXX or G-XXXXX)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="manual-id-input"
            />
            <div className="checkout-btn-group">
              <button type="submit" className="manual-checkout-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                Verify & Checkout
              </button>
              <button type="button" className="cancel-btn" onClick={() => navigate('/gateguard/dashboard')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitorCheckout;
