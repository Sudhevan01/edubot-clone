import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Check, Network, Sparkles, Database, Cpu, Smartphone, Cloud, ArrowUpRight, Menu, X, Receipt, Building, Calendar, GraduationCap, ClipboardList, Award, TrendingUp, CalendarCheck, CalendarX, Bell } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import './Product.css';

const Product = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('product');

  useEffect(() => {
    // Enable standard page scrolling for the landing page
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      // Restore dashboard viewport overflow on unmount
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-left, .reveal-right');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => {
        try {
          observer.unobserve(el);
        } catch (e) {}
      });
    };
  }, []);

  const handleLoginClick = onLoginClick;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="product-page">
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
            className="nav-link active"
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
            className="nav-link"
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
            className="nav-link active"
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
            className="nav-link"
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

      {/* Product Hero Section */}
      <section className="product-hero">
        <div className="product-hero-container">
          <div className="product-hero-left">
            <span className="badge-tag">ENTERPRISE ACADEMIC SUITE</span>
            <h1 className="product-hero-title">
              Precision Infrastructure for Modern Institutions.
            </h1>
            <p className="product-hero-subtitle">
              Streamline your academic ecosystem with our integrated systems designed for security, performance, and data integrity.
            </p>
            <div className="product-hero-actions">
              <a
                href="/contact"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/contact');
                }}
              >
                Request Demo
              </a>
              <a href="#systems" className="btn-secondary">
                View Systems
              </a>
            </div>
          </div>
          <div className="product-hero-right">
            <div className="monitor-mockup">
              <img
                src="/assets/images/product_hero.png"
                alt="Educrop System Preview"
                className="monitor-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Product Main Systems Section */}
      <section className="product-systems" id="systems">
        
        {/* VMS: Visitor Management System */}
        <div className="system-row" id="vms">
          <div className="system-row-container">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box vms-blue-box">
                <Shield size={24} />
              </div>
              <h2 className="system-title">VMS: Visitor Management System</h2>
              <p className="system-subtitle">
                Secure and efficient tracking of campus visitors. Ensure the safety of your faculty and students with real-time logging, background checks, and automated badge printing.
              </p>
              <div className="system-features-grid">
                <div className="sys-feature">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Instant ID Scanning</h4>
                    <p>Rapid check-in via government ID recognition.</p>
                  </div>
                </div>
                <div className="sys-feature">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Digital Watchlist</h4>
                    <p>Automated alerts for restricted access individuals.</p>
                  </div>
                </div>
                <div className="sys-feature">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>QR Code Access</h4>
                    <p>Contactless entry for pre-invited VIP guests.</p>
                  </div>
                </div>
                <div className="sys-feature">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Audit Trails</h4>
                    <p>Comprehensive logs for compliance and safety.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="system-image-col reveal-on-scroll">
              <div className="product-image-box">
                <img
                  src="/assets/images/vms_kiosk.png"
                  alt="VMS Visitor Tablet Kiosk"
                  className="product-system-img"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RMS: Receipt Management System */}
        <div className="system-row light-bg" id="rms">
          <div className="system-row-container reverse-row">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box rms-green-box">
                <Receipt size={24} />
              </div>
              <h2 className="system-title">RMS: Receipt Management System</h2>
              <p className="system-subtitle">
                A specialized system for financial documentation and management, streamlining the generation and tracking of fee receipts and salary slips for the entire institution.
              </p>
              
              <div className="receipt-features-stack">
                <div className="receipt-card-item">
                  <div className="receipt-icon"><Sparkles size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Fee Management</h4>
                    <p>Automated generation of student fee receipts and payment tracking.</p>
                  </div>
                </div>
                <div className="receipt-card-item">
                  <div className="receipt-icon"><Sparkles size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Payroll Processing</h4>
                    <p>Seamless generation of staff salary slips and compensation records.</p>
                  </div>
                </div>
                <div className="receipt-card-item">
                  <div className="receipt-icon"><Sparkles size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Financial Reporting</h4>
                    <p>Comprehensive audit logs and transaction history for all financial documents.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="system-image-col reveal-on-scroll">
              <div className="product-image-box rms-image-box">
                <img
                  src="/assets/images/rms_dashboard.png"
                  alt="RMS Receipt Management System Dashboard Analytics"
                  className="product-system-img"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AMS: Academic Management System */}
        <div className="system-row" id="ams">
          <div className="system-row-container flex-col-container">
            <div className="uims-header-centered reveal-on-scroll">
              <div className="system-icon-box uims-purple-box margin-auto">
                <Sparkles size={24} />
              </div>
              <h2 className="system-title">AMS: Academic Management System</h2>
              <p className="system-subtitle max-w-720">
                A comprehensive solution for managing attendance, academic results, assignments, and student leave requests, providing a holistic view of student engagement and performance.
              </p>
            </div>

            {/* Split row (70%/30% width ratio) */}
            <div className="support-grid-new mt-48">
              {/* Card 1: Attendance & Leave Tracking */}
              <div className="support-card-new card-white-new reveal-left">
                <div className="card-white-bordered-wrapper">
                  <div className="card-white-split">
                    <div>
                      <h3 className="card-heading mt-12">Attendance & Leave Tracking</h3>
                      <p className="card-desc">
                        Streamline student presence monitoring and digital leave request processing.
                      </p>
                      <div className="card-bullets flex-row-bullets mt-24">
                        <button className="sub-btn-pill flex-row-btn">
                          <CalendarCheck size={16} className="mr-8" />
                          <span>Attendance</span>
                        </button>
                        <button className="sub-btn-pill flex-row-btn">
                          <CalendarX size={16} className="mr-8" />
                          <span>Leave Requests</span>
                        </button>
                        <button className="sub-btn-pill flex-row-btn">
                          <Award size={16} className="mr-8" />
                          <span>Result</span>
                        </button>
                        <button className="sub-btn-pill flex-row-btn">
                          <Bell size={16} className="mr-8" />
                          <span>Announcement</span>
                        </button>
                        <button className="sub-btn-pill flex-row-btn">
                          <ClipboardList size={16} className="mr-8" />
                          <span>Assignment work</span>
                        </button>
                      </div>
                    </div>
                    <div className="card-calendar-watermark-box">
                      <Calendar size={130} strokeWidth={0.8} className="calendar-watermark-icon" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Results & Performance Analytics */}
              <div className="support-card-new card-blue-new reveal-right">
                <div>
                  <div className="support-icon-dashboard">
                    <TrendingUp size={36} />
                  </div>
                  <h3 className="card-heading text-white">Results & Performance Analytics</h3>
                  <p className="card-desc text-white">
                    Leverage automated grading and deep insights to drive academic excellence.
                  </p>
                </div>
                <a href="#analytics" className="card-link" onClick={(e) => e.preventDefault()}>
                  View Analytics Dashboard <ArrowRight size={18} />
                </a>
              </div>
            </div>

            {/* Subgrid row (3 equal columns) */}
            <div className="support-subgrid mt-32">
              <div className="subcard reveal-on-scroll stagger-1">
                <div className="subcard-icon-box purple-box">
                  <ClipboardList size={20} />
                </div>
                <h4 className="subcard-title">ASSIGNMENT & CURRICULUM MANAGEMENT</h4>
                <p className="subcard-text">
                  Efficiently track coursework, student submissions, and curriculum alignment.
                </p>
              </div>

              <div className="subcard reveal-on-scroll stagger-2">
                <div className="subcard-icon-box purple-box">
                  <GraduationCap size={20} />
                </div>
                <h4 className="subcard-title">STUDENT & FACULTY PORTAL</h4>
                <p className="subcard-text">
                  Centralized access for academic resources and communication.
                </p>
              </div>

              <div className="subcard reveal-on-scroll stagger-3">
                <div className="subcard-icon-box purple-box">
                  <Award size={20} />
                </div>
                <h4 className="subcard-title">EXAMINATIONS & GRADING</h4>
                <p className="subcard-text">
                  Automate exam scheduling, gradebook computation, and report card generation.
                </p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* CTA Section */}
      <section className="product-cta">
        <div className="cta-content">
          <h2>Ready to Modernize Your Campus?</h2>
          <p>Join over 150+ institutions globally using Educrop to power their academic infrastructure.</p>
          <div className="cta-actions">
            <button className="btn-cta-primary" onClick={() => navigate('/')}>
              Get Started Today
            </button>
            <button className="btn-cta-secondary" onClick={() => navigate('/contact')}>
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Product;
