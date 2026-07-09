import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Briefcase, Phone, MapPin, Menu, X, ArrowRight, CheckCircle } from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', reason: 'software-purchase', message: '' });
  const [errors, setErrors] = useState({ name: '', email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // Block non-alphabet characters in the name field
    if (name === 'name') {
      if (!/^[a-zA-Z\s]*$/.test(newValue)) {
        return; // ignore the keystroke if it's not a letter or space
      }
    }

    // Auto-complete email when '@' is typed
    if (name === 'email') {
      // If they just typed an '@' and it wasn't there before
      if (newValue.endsWith('@') && !formData.email.endsWith('@')) {
        newValue = newValue + 'gmail.com';
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = { name: '', email: '' };

    // Validate Name (Alphabets and spaces only)
    if (!/^[A-Za-z\s]+$/.test(formData.name)) {
      newErrors.name = 'Name should only contain alphabets.';
      valid = false;
    }

    // Validate Email (must contain @)
    if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain an "@" symbol.';
      valid = false;
    }

    if (valid) {
      setIsSubmitted(true);

      // Auto-reset the form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ name: '', email: '', reason: 'software-purchase', message: '' });
      }, 5000);

    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="contact-page">
      {/* Navigation */}
      <nav className="contact-nav">
        <div className="nav-container">
          <div className="logo">EduProt</div>

          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/">HOME</Link>
            <Link to="/product">PRODUCT</Link>
            <Link to="/about">ABOUT</Link>
            <Link to="/contact" className="active">CONTACT</Link>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="login-btn">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <h4 className="hero-subtitle">LET'S CONNECT</h4>
          <h1 className="hero-title">GET IN TOUCH</h1>
          <p className="hero-description">
            Let's build something meaningful together — from websites and applications
            to ERP systems and premium branding solutions.
          </p>

          <div className="hero-badges">
            <span className="badge">24h Response</span>
            <span className="badge">Custom Solutions</span>
            <span className="badge">Business Support</span>
            <span className="badge">Bangalore Based</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="contact-main">
        <div className="contact-container">

          {/* Left Column: Form */}
          <div className="contact-form-card">
            <h2>Send Inquiry</h2>

            {isSubmitted ? (
              <div className="success-message" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.5rem', color: '#222', marginBottom: '0.5rem' }}>Successfully sent the message!</h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Thank you for reaching out. We will get back to you shortly.</p>
              </div>
            ) : (
              <form className="inquiry-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.name && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="text"
                      name="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.email && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.email}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Reason for Contact</label>
                  <div className="select-wrapper">
                    <select name="reason" value={formData.reason} onChange={handleInputChange}>
                      <option value="software-purchase">Software Purchase</option>
                      <option value="software-maintenance">Software Maintenance</option>
                      <option value="software-support">Software Support</option>
                      <option value="report-software-issue">Report a Software Issue</option>
                      <option value="bug-report">Bug Report</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="website-development">Website Development</option>
                      <option value="mobile-app-development">Mobile App Development</option>
                      <option value="cloud-hosting-services">Cloud & Hosting Services</option>
                      <option value="software-upgrade">Software Upgrade</option>
                      <option value="integration-services">Integration Services</option>
                      <option value="technical-consultation">Technical Consultation</option>
                      <option value="pricing-quotation">Pricing & Quotation</option>
                      <option value="general-inquiry">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Message</label>
                  <textarea
                    name="message"
                    placeholder="How can we help you?"
                    rows="6"
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{ resize: 'vertical' }}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">Send Inquiry</button>
              </form>
            )}
          </div>

          {/* Right Column: Connectivity */}
          <div className="contact-info">
            <h3 className="info-title">CONNECTIVITY</h3>

            <div className="info-tags">
              <span className="info-tag">FAST RESPONSE</span>
              <span className="info-tag">CUSTOM DEVELOPMENT</span>
              <span className="info-tag">END-TO-END SUPPORT</span>
            </div>

            <div className="info-items">
              <div className="info-item">
                <div className="info-icon"><Mail size={20} /></div>
                <div className="info-text">
                  <p className="info-label">General Inquiries</p>
                  <p className="info-value">
                    <a href="https://www.devcreationsblr.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      info@devcreationsblr.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Briefcase size={20} /></div>
                <div className="info-text">
                  <p className="info-label">Careers & HR</p>
                  <p className="info-value">
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=hr@devcreationsblr.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      hr@devcreationsblr.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><Phone size={20} /></div>
                <div className="info-text">
                  <p className="info-label">Phone Support</p>
                  <p className="info-value">
                    <a href="tel:+917337840612" style={{ color: 'inherit', textDecoration: 'none' }}>
                      +91 73378 40612
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><MapPin size={20} /></div>
                <div className="info-text">
                  <p className="info-label">Our Location</p>
                  <p className="info-value">
                    <a href="https://maps.google.com/?q=88,+KR+Defense+Colony,+Virgonagar,+Chimasandra,+Karnataka+560049" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      88, KR Defense Colony, Virgonagar, Chimasandra,<br />
                      Karnataka 560049
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <a href="#workspace" className="workspace-link">
              Visit Our Workspace <ArrowRight size={16} />
            </a>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="contact-footer">
        <div className="footer-content">
          <div className="footer-copyright">© 2024 EduProt. All rights reserved.</div>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
