import React, { useState, useEffect } from 'react';
import './SupportModal.css';

const SupportModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "f307df04-eb86-48be-8e3b-9e424dc7e7a2",
          from_name: "VMS Support Request",
          subject: `New Support Message: ${formData.subject}`,
          ...formData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsSubmitted(true);
        // Auto-close after showing success message
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 4000);
      } else {
        console.error("Web3Forms Error:", result);
        alert("Failed to send message. Please try again later.");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      alert("An error occurred. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-overlay" onClick={onClose}>
      <div className="support-card" onClick={e => e.stopPropagation()}>
        <div className="support-header">
          <div className="support-title-box">
            <div className="support-icon-bg">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <h3>Support Form</h3>
              <p>How can we help you today?</p>
            </div>
          </div>
          <button className="support-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="support-body">
          {isSubmitted ? (
            <div className="support-success">
              <div className="success-circle">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h4>Message Received!</h4>
              <p>We'll get back to you at {formData.email} as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="support-form-element">
              <div className="support-grid">
                <div className="support-input-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter organization name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="support-input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="support-input-group full">
                  <label>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Briefly describe your issue"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>
                <div className="support-input-group full">
                  <label>Message</label>
                  <textarea
                    name="message"
                    placeholder="Write your message here..."
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
              <div className="support-footer">
                <button type="button" className="support-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="support-btn-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="modal-spinner-small"></div>
                      Sending...
                    </>
                  ) : "Send Message"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
