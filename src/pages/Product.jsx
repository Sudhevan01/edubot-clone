import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Check, Network, Database, Cpu, Smartphone, Cloud, ArrowUpRight, Menu, X, Receipt, Building, Calendar, GraduationCap, ClipboardList, Award, TrendingUp, CalendarCheck, CalendarX, Bell, Users, BookOpen, Bus, MapPin, Route, UserCheck, CreditCard, Wallet, FileText } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import './Product.css';

const Product = ({ onLoginClick }) => {
  const navigate = useNavigate();


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
        } catch (e) { }
      });
    };
  }, []);



  return (
    <div className="product-page">
      <Header onLoginClick={onLoginClick} />

      {/* Product Hero Section */}
      <section className="product-hero-new">
        <div className="product-hero-card">
          <div className="product-hero-bg-container">
            <div className="product-hero-bg"></div>
            <div className="product-hero-curve-overlay"></div>
          </div>
          <div className="product-hero-content-wrapper">
            <div className="product-hero-left-content">
              <span className="badge-tag-new">ENTERPRISE ACADEMIC SUITE</span>
              <h1 className="product-hero-title-new">
                Precision Infrastructure <br className="hidden-mobile" />
                for <span className="text-blue">Modern Institutions</span>
              </h1>
              <p className="product-hero-subtitle-new">
                Streamline your academic ecosystem with our<br />
                integrated systems designed for security,<br />
                performance, and data integrity.
              </p>
              <div className="product-hero-actions-new">
                <a
                  href="/contact"
                  className="btn-primary-new"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                >
                  Request Demo
                </a>
                <a href="#systems" className="btn-secondary-new">
                  View Systems
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Main Systems Section */}
      <section className="product-systems" id="systems">

        {/* AMS: Academic Management System */}
        <div className="system-row" id="ams">
          <div className="system-row-container reverse-row">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box uims-purple-box">
                <GraduationCap size={24} />
              </div>
              <h2 className="system-title">AMS: Academic Management System</h2>
              <p className="system-subtitle">
                A comprehensive solution for managing attendance, academic results, assignments, and student leave requests, providing a holistic view of student engagement and performance.
              </p>

              <div className="ams-features-stack">
                <div className="ams-card-item reveal-on-scroll stagger-1">
                  <div className="ams-icon">
                    <CalendarCheck size={18} />
                  </div>
                  <div className="ams-desc">
                    <h4>Attendance & Leave Tracking</h4>
                    <p>Streamline student presence monitoring and digital leave request processing.</p>
                  </div>
                </div>
                <div className="ams-card-item reveal-on-scroll stagger-2">
                  <div className="ams-icon">
                    <TrendingUp size={18} />
                  </div>
                  <div className="ams-desc">
                    <h4>Results & Performance Analytics</h4>
                    <p>Leverage automated grading and deep analytics to drive academic excellence.</p>
                  </div>
                </div>
                <div className="ams-card-item reveal-on-scroll stagger-3">
                  <div className="ams-icon">
                    <ClipboardList size={18} />
                  </div>
                  <div className="ams-desc">
                    <h4>Curriculum & Examinations</h4>
                    <p>Automate exam scheduling, gradebook computation, and coursework tracking.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="system-image-col reveal-on-scroll">
              <div className="product-image-box">
                <img
                  src="/assets/image.png"
                  alt="AMS Academic Management System Dashboard"
                  className="product-system-img"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RMS: Receipt Management System */}
        <div className="system-row light-bg" id="rms">
          <div className="system-row-container">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box rms-green-box">
                <Receipt size={24} />
              </div>
              <h2 className="system-title">RMS: Receipt Management System</h2>
              <p className="system-subtitle">
                A specialized system for financial documentation and management, streamlining the generation and tracking of fee receipts and salary slips for the entire institution.
              </p>

              <div className="receipt-features-stack">
                <div className="receipt-card-item reveal-on-scroll stagger-1">
                  <div className="receipt-icon"><CreditCard size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Fee Management</h4>
                    <p>Automated generation of student fee receipts and payment tracking.</p>
                  </div>
                </div>
                <div className="receipt-card-item reveal-on-scroll stagger-2">
                  <div className="receipt-icon"><Wallet size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Payroll Processing</h4>
                    <p>Seamless generation of staff salary slips and compensation records.</p>
                  </div>
                </div>
                <div className="receipt-card-item reveal-on-scroll stagger-3">
                  <div className="receipt-icon"><FileText size={18} /></div>
                  <div className="receipt-desc">
                    <h4>Financial Reporting</h4>
                    <p>Comprehensive audit logs and transaction history for all financial documents.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="system-image-col reveal-on-scroll">
              <div className="product-image-box">
                <img
                  src="/assets/images/rms_dashboard.png"
                  alt="RMS Receipt Management System Dashboard Analytics"
                  className="product-system-img"
                />
              </div>
            </div>
          </div>
        </div>

        {/* VMS: Visitor Management System */}
        <div className="system-row" id="vms">
          <div className="system-row-container reverse-row">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box vms-blue-box">
                <Shield size={24} />
              </div>
              <h2 className="system-title">VMS: Visitor Management System</h2>
              <p className="system-subtitle">
                Secure and efficient tracking of campus visitors. Ensure the safety of your faculty and students with real-time logging, background checks, and automated badge printing.
              </p>
              <div className="system-features-grid">
                <div className="sys-feature reveal-on-scroll stagger-1">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Instant ID Scanning</h4>
                    <p>Rapid check-in via government ID recognition.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-2">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Digital Watchlist</h4>
                    <p>Automated alerts for restricted access individuals.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-3">
                  <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>QR Code Access</h4>
                    <p>Contactless entry for pre-invited VIP guests.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-4">
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

        {/* TMS: Transport Management System */}
        <div className="system-row light-bg" id="tms">
          <div className="system-row-container">
            <div className="system-text-col reveal-on-scroll">
              <div className="system-icon-box rms-green-box">
                <Bus size={24} />
              </div>
              <h2 className="system-title">TMS: Transport Management System</h2>
              <p className="system-subtitle">
                Simplify transport operations with live tracking, route planning, and fleet monitoring for safer and more efficient journeys.
              </p>
              <div className="system-features-grid">
                <div className="sys-feature reveal-on-scroll stagger-1">
                  <span className="bullet-icon"><MapPin size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Real-Time Tracking</h4>
                    <p>Track vehicles live with location, status, and ETA updates.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-2">
                  <span className="bullet-icon"><Route size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Route Optimization</h4>
                    <p>Plan efficient routes to reduce delays and travel time.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-3">
                  <span className="bullet-icon"><Users size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Transport Attendance</h4>
                    <p>Record passenger check-ins and trip attendance seamlessly.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-4">
                  <span className="bullet-icon"><Bell size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Instant Notifications</h4>
                    <p>Send alerts for arrivals, delays, and route changes.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-5">
                  <span className="bullet-icon"><UserCheck size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Driver Management</h4>
                    <p>Manage drivers, licenses, and transport assignments.</p>
                  </div>
                </div>
                <div className="sys-feature reveal-on-scroll stagger-6">
                  <span className="bullet-icon"><TrendingUp size={16} strokeWidth={3} /></span>
                  <div>
                    <h4>Reports & Analytics</h4>
                    <p>Monitor performance with transport insights and reports.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="system-image-col reveal-on-scroll">
              <div className="product-image-box">
                <img
                  src="/assets/images/image.png"
                  alt="TMS Transport Management System Dashboard"
                  className="product-system-img"
                />
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
