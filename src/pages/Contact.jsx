import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { FaWhatsapp, FaYoutube } from 'react-icons/fa';
import './Contact.css';
import { useScrollReveal } from '../hooks/useScrollReveal';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';

const Contact = ({ onLoginClick }) => {
  const navigate = useNavigate();

  useScrollReveal();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const [formData, setFormData] = useState({ organizationName: '', mailId: '', contactPerson: '', contactNo: '', studentCount: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // Block non-alphabet characters in the contactPerson field
    if (name === 'contactPerson') {
      if (!/^[a-zA-Z\s]*$/.test(newValue)) {
        return; 
      }
    }

    // Block non-numeric characters for contactNo and studentCount
    if (name === 'contactNo' || name === 'studentCount') {
      if (!/^\d*$/.test(newValue)) {
        return;
      }
    }

    // Auto-complete email when '@' is typed
    if (name === 'mailId') {
      if (newValue.endsWith('@') && !formData.mailId.endsWith('@')) {
        newValue = newValue + 'gmail.com';
      }
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;
    let newErrors = {};

    // Validate Email (must contain @)
    if (!formData.mailId.includes('@')) {
      newErrors.mailId = 'Email must contain an "@" symbol.';
      valid = false;
    }

    if (valid) {
      const data = new FormData();
      data.append("access_key", "3349808f-3514-47c2-bf3e-a76869d002a2");
      data.append("Organization Name", formData.organizationName);
      data.append("Mail ID", formData.mailId);
      data.append("Contact Person", formData.contactPerson);
      data.append("Contact No", formData.contactNo);
      data.append("Student Count", formData.studentCount);
      data.append("Message", formData.message);

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
              setFormData({ organizationName: '', mailId: '', contactPerson: '', contactNo: '', studentCount: '', message: '' });
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
      <Header onLoginClick={onLoginClick} />

      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-content reveal-on-scroll">
          <h4 className="hero-subtitle">LET'S CONNECT</h4>
          <h1 className="hero-title">GET IN TOUCH</h1>
          <p className="hero-description">
            Let's build something meaningful together from websites and applications
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
            <h2><Send size={24} /> Send Inquiry</h2>

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
                    <label>Organization Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="organizationName"
                      placeholder="School/College Name"
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mail ID <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="mailId"
                      placeholder="school@example.com"
                      value={formData.mailId}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.mailId && <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.mailId}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Contact Person <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      name="contactPerson"
                      placeholder="John Doe"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact No <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      name="contactNo"
                      placeholder="9876543210"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>How many students are there? <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="studentCount"
                    placeholder="e.g. 500"
                    value={formData.studentCount}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Your Message</label>
                  <textarea
                    name="message"
                    placeholder="How can we help you?"
                    rows="4"
                    value={formData.message}
                    onChange={handleInputChange}
                    style={{ resize: 'vertical' }}
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn"><Send size={18} /> Send Inquiry</button>
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
                    <a href="mailto:Educropblr@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>
                      Educropblr@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><FaWhatsapp size={20} /></div>
                <div className="info-text">
                  <p className="info-label">WhatsApp Support</p>
                  <p className="info-value">
                    <a href="https://wa.me/917337840612" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      +91 73378 40612
                    </a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon"><FaYoutube size={20} /></div>
                <div className="info-text">
                  <p className="info-label">YouTube Channel</p>
                  <p className="info-value">
                    <a href="https://youtube.com/@educropblr?si=UbiaZohs1gdn3jsl" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      @educropblr
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
