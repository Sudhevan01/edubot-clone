import React, { useState, useEffect } from 'react';

const PWAHandler = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed recently (24 hours)
    const lastDismissed = localStorage.getItem('vms_pwa_dismissed');
    const now = Date.now();
    if (lastDismissed && now - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      return;
    }

    // Check if desktop (hide on desktop)
    const isMobileOrTablet = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobileOrTablet) {
      return;
    }

    // Check if it is iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);


    const handler = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBtn(true);

      // Show with a slight delay for better UX
      setTimeout(() => setIsVisible(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (isStandalone) {
      setShowInstallBtn(false);
    } else if (ios) {
      // For iOS, show the message after a delay
      const timer = setTimeout(() => {
        setShowInstallBtn(true);
        setTimeout(() => setIsVisible(true), 1000);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('To install VMS: tap the Share button (square with arrow) and then "Add to Home Screen".');
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
    setTimeout(() => setShowInstallBtn(false), 500);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('vms_pwa_dismissed', Date.now().toString());
    setTimeout(() => setShowInstallBtn(false), 500);
  };

  if (!showInstallBtn) return null;

  return (
    <div className={`pwa-install-banner ${isVisible ? 'visible' : ''}`}>
      <div className="pwa-card">
        <div className="pwa-icon-box">
          <img src="/assets/icons/icon-192x192.png" alt="VMS Icon" />
        </div>
        <div className="pwa-content">
          <div className="pwa-text">
            <strong>Install VMS App</strong>
            <p>{isIOS ? 'Tap Share > Add to Home Screen' : 'Experience a smoother native app experience'}</p>
          </div>
          <div className="pwa-actions">
            <button onClick={handleDismiss} className="pwa-btn pwa-btn-secondary">
              Later
            </button>
            <button onClick={handleInstallClick} className="pwa-btn pwa-btn-primary">
              {isIOS ? 'How to Install' : 'Install'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        .pwa-install-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          z-index: 10000;
          transform: translateY(100%);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        .pwa-install-banner.visible {
          transform: translateY(0);
          pointer-events: auto;
        }
        .pwa-card {
          background: white;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.12), 0 10px 20px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 500px;
          margin: 0 auto;
          border: 1px solid rgba(226, 232, 240, 0.8);
          backdrop-filter: blur(10px);
        }
        .pwa-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
          border: 1px solid #f1f5f9;
        }
        .pwa-icon-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pwa-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pwa-text strong {
          display: block;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .pwa-text p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }
        .pwa-actions {
          display: flex;
          gap: 10px;
        }
        .pwa-btn {
          padding: 10px 16px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          flex: 1;
          text-align: center;
        }
        .pwa-btn-primary {
          background: #2563eb;
          color: white;
        }
        .pwa-btn-primary:active {
          transform: scale(0.96);
          background: #1d4ed8;
        }
        .pwa-btn-secondary {
          background: #f1f5f9;
          color: #64748b;
        }
        .pwa-btn-secondary:active {
          background: #e2e8f0;
        }
        @media (max-width: 480px) {
          .pwa-card {
            padding: 16px;
            gap: 12px;
          }
          .pwa-icon-box {
            width: 48px;
            height: 48px;
          }
          .pwa-text strong {
            font-size: 15px;
          }
          .pwa-btn {
            padding: 8px 12px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default PWAHandler;
