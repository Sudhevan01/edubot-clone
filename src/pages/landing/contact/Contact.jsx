import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Menu, X, ArrowRight, CheckCircle } from 'lucide-react';
import './Contact.css';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import LandingFooter from '../../../components/layout/LandingFooter';

const Contact = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useScrollReveal();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const [formData, setFormData] = useState({ name: '', email: '', reason: 'software-purchase', message: '' });
  const [errors, setErrors] = useState({ name: '', email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
      const data = new FormData();
      data.append("access_key", "3349808f-3514-47c2-bf3e-a76869d002a2");
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("reason", formData.reason);
      data.append("message", formData.message);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data
      })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setIsSubmitted(true);
          setTimeout(() => {
            setIsSubmitted(false);
            setFormData({ name: '', email: '', reason: 'software-purchase', message: '' });
          }, 5000);
        } else {
          console.error("Submission failed:", resData);
        }
      })
      .catch(err => {
        console.error("Form submission error:", err);
      });

    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate('/')}>
          <img src="/assets/images/educroplogo.png" alt="EduCrop" className="landing-logo-img" />
        </div>

        <nav className="landing-nav">
          <a
            href="/"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Home
          </a>
          <a
            href="/product"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/product');
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/about');
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className="nav-link active"
            onClick={(e) => {
              e.preventDefault();
              navigate('/contact');
            }}
          >
            Contact
          </a>
        </nav>

        <div className="landing-auth">
          <button className="btn-login" onClick={handleLoginClick}>
            Login
          </button>
        </div>

        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
          <a
            href="/"
            className="nav-link"
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
          >
            Home
          </a>
          <a
            href="/product"
            className="nav-link"
            onClick={() => {
              navigate('/product');
              setMobileMenuOpen(false);
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className="nav-link"
            onClick={() => {
              navigate('/about');
              setMobileMenuOpen(false);
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className="nav-link active"
            onClick={() => {
              navigate('/contact');
              setMobileMenuOpen(false);
            }}
          >
            Contact
          </a>
          <button className="btn-login w-full mt-4" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content reveal-on-scroll">
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
          <div className="contact-form-card reveal-on-scroll">
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
                    <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
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
                    <label>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
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
                  <label>Reason for Contact <span style={{ color: '#ef4444' }}>*</span></label>
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
          <div className="contact-info reveal-on-scroll">
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
                  <p className="info-label">Email Address</p>
                  <p className="info-value">
                    <a href="https://www.devcreationsblr.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      info@devcreationsblr.com
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

          </div>

        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Contact;
