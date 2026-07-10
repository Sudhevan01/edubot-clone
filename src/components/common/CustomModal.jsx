import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CustomModal.css';

const CustomModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'warning', // 'warning' (danger), 'success', 'info'
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isAlert = false,
  isLoading = false,
  children
}) => {
  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'info':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
      default: // warning/danger
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
    }
  };

  return createPortal(
    <div className="custom-modal-overlay" onClick={isLoading ? null : onClose}>
      {children ? (
        <div className="custom-modal-content-wrapper" onClick={e => e.stopPropagation()}>
          {children}
        </div>
      ) : (
        <div className="custom-modal-container" onClick={e => e.stopPropagation()}>
          <div className={`modal-icon-wrapper ${type}`}>
            {getIcon()}
          </div>
          <h3>{title}</h3>
          <p>{message}</p>
          <div className="modal-actions-v2">
            {!isAlert && (
              <button
                className="modal-btn-v2 cancel"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </button>
            )}
            <button
              className={`modal-btn-v2 confirm ${type === 'warning' ? 'danger' : ''}`}
              onClick={() => {
                if (isAlert) {
                  onClose();
                } else if (onConfirm) {
                  onConfirm();
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? <div className="modal-spinner"></div> : confirmText}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default CustomModal;
