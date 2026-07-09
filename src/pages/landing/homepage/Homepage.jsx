import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Menu, X, Shield, Check, Network, Sparkles, Users, Globe } from 'lucide-react';
import './Homepage.css';

const Homepage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const reachRef = useRef(null);
  const [reachInView, setReachInView] = useState(false);
  const [partnerCount, setPartnerCount] = useState(0);
  const [userCount, setUserCount] = useState("0.0");
  const [centerCount, setCenterCount] = useState(0);

  useEffect(() => {
    // Enable standard page scrolling for the landing page
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setReachInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (reachRef.current) {
      observer.observe(reachRef.current);
    }

    return () => {
      // Restore the dashboard's viewport layout styling when leaving
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (reachRef.current) {
        observer.unobserve(reachRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!reachInView) return;

    let startTime = null;
    const duration = 2000; // 2 seconds

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = progress * (2 - progress); // Ease out quad

      setPartnerCount(Math.floor(easeProgress * 120));
      setUserCount((easeProgress * 2.4).toFixed(1));
      setCenterCount(Math.floor(easeProgress * 15));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPartnerCount(120);
        setUserCount("2.4");
        setCenterCount(15);
      }
    };

    requestAnimationFrame(animate);
  }, [reachInView]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo">
          <img src="/assets/images/educroplogo.png" alt="EduCrop" className="landing-logo-img" />
        </div>

        <nav className="landing-nav">
          <a
            href="#home"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </a>
          <a
            href="/product"
            className={`nav-link ${activeTab === 'product' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/product');
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/about');
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
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
            href="#home"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
          >
            Home
          </a>
          <a
            href="/product"
            className={`nav-link ${activeTab === 'product' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/product');
              setMobileMenuOpen(false);
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/about');
              setMobileMenuOpen(false);
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/contact');
              setMobileMenuOpen(false);
            }}
          >
            Contact
          </a>
        </div>
      )}

      {/* Hero Section */}
      <main className="landing-hero" id="home">
        <div className="hero-left">
          <div className="hero-badge">
            The Future of Learning Infrastructure
          </div>
          <h1 className="hero-title">
            Empowering Academic Excellence
          </h1>
          <p className="hero-desc">
            EduProt provides the robust structural foundation and digital orchestration required for modern educational institutions to thrive in an era of rapid digital transformation.
          </p>
          <div className="hero-actions">
            <button className="btn-explore" onClick={handleLoginClick}>
              Explore Platform <ArrowRight size={18} />
            </button>
            <button className="btn-demo" onClick={handleLoginClick}>
              Schedule Demo
            </button>
          </div>
        </div>

        <div className="hero-right">

          {/* Floating Data Insight Card */}
          <div className="floating-card card-data-insight">
            <div className="card-data-insight-header">
              <div className="insight-icon-box">
                <BarChart3 size={14} />
              </div>
              <span className="insight-label">Data Insight</span>
            </div>
            <div className="insight-progress-bar">
              <div className="insight-progress-fill"></div>
            </div>
          </div>

          {/* Floating Stats Card */}
          <div className="floating-card card-stats">
            <div className="stat-item">
              <span className="stat-val">99.9%</span>
              <span className="stat-lbl">Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-val">50k+</span>
              <span className="stat-lbl">Students</span>
            </div>
          </div>
        </div>
      </main>

      {/* Section 2: Unmatched Institutional Support */}
      <section className="support-section" id="product">
        <h2 className="support-title">Unmatched Institutional Support</h2>
        <p className="support-subtitle">
          Our platform is built to handle the most demanding administrative and pedagogical needs of modern global education.
        </p>

        <div className="support-grid-new">
          {/* Card 1: Secure Data Infrastructure */}
          <div className="support-card-new card-white-new">
            <div className="card-white-bordered-wrapper">
              <div className="card-white-split">
                <div>
                  <div className="support-icon-box support-icon-shield">
                    <Shield size={24} />
                  </div>
                  <h3 className="card-heading">Secure Data Infrastructure</h3>
                  <p className="card-desc">
                    Enterprise-grade security protocols ensuring that student privacy and institutional data remain protected under global compliance standards.
                  </p>
                  <div className="card-bullets">
                    <div className="bullet-item">
                      <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                      <span>End-to-end encryption for all records</span>
                    </div>
                    <div className="bullet-item">
                      <span className="bullet-icon"><Check size={16} strokeWidth={3} /></span>
                      <span>Automated disaster recovery systems</span>
                    </div>
                  </div>
                </div>
                <div className="card-image-box">
                  <img
                    src="/assets/images/data_infrastructure.png"
                    alt="Secure Network Infrastructure visualization"
                    className="card-image"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Unified Dashboard */}
          <div className="support-card-new card-blue-new">
            <div>
              <div className="support-icon-dashboard">
                <Network size={36} />
              </div>
              <h3 className="card-heading text-white">Unified Dashboard</h3>
              <p className="card-desc text-white">
                Orchestrate entire campuses from a single pane of glass. Real-time monitoring of facilities, student performance, and administrative efficiency.
              </p>
            </div>
            <a href="#login" className="card-link" onClick={handleLoginClick}>
              View Console <ArrowRight size={18} />
            </a>
          </div>
        </div>

        {/* Second Row: 3-column subgrid */}
        <div className="support-subgrid">
          {/* Card 1: AI-Driven Insights */}
          <div className="support-card subcard card-white-center">
            <div className="subcard-icon-box purple-box">
              <Sparkles size={20} />
            </div>
            <h3 className="subcard-title">AI-Driven Insights</h3>
            <p className="subcard-desc">
              Predictive analytics to identify students at risk and optimize resource allocation across departments.
            </p>
          </div>

          {/* Card 2: Collaborative Tools */}
          <div className="support-card subcard card-white-left">
            <div className="subcard-header">
              <div className="subcard-icon-box grey-box">
                <Users size={18} />
              </div>
              <h3 className="subcard-title-inline">Collaborative Tools</h3>
            </div>
            <p className="subcard-desc left-align">
              Seamless integration for research teams and faculty to share resources in a secure, high-speed environment.
            </p>
          </div>

          {/* Card 3: Global Scalability */}
          <div className="support-card subcard card-grey-watermark">
            <h3 className="subcard-title-left">Global Scalability</h3>
            <p className="subcard-desc left-align">
              Deploy infrastructure across multiple regions with sub-millisecond latency for distance learning.
            </p>
            <div className="watermark-icon">
              <Globe size={80} />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Real-time Global Reach / Stats */}
      <section
        className={`global-reach-section ${reachInView ? 'in-view' : ''}`}
        id="about"
        ref={reachRef}
      >
        <div className="reach-header">
          <h2 className="reach-title">Empowering Global Institutions</h2>
          <p className="reach-subtitle">
            Our Infrastructure spans the globe, providing seamless connectivity and real-time insights for the world's leading academic organizations.
          </p>
        </div>

        <div className="reach-container">
          <div className="reach-left">
            <div className="stat-row-item">
              <span className="stat-number">{partnerCount}+</span>
              <span className="stat-label">Partner Institutions</span>
            </div>
            <div className="stat-row-item">
              <span className="stat-number">{userCount}M</span>
              <span className="stat-label">Active Users Daily</span>
            </div>
            <div className="stat-row-item">
              <span className="stat-number">{centerCount}</span>
              <span className="stat-label">Global Data Centers</span>
            </div>
          </div>

          <div className="reach-right">
            <div className="monitor-mockup">
              <img
                src="/assets/images/global_reach.png"
                alt="Real-time Global Reach Map Display"
                className="monitor-img"
              />
              <div className="pulse-dot dot-1"></div>
              <div className="pulse-dot dot-2"></div>
              <div className="pulse-dot dot-3"></div>
              <div className="pulse-dot dot-4"></div>
              <div className="pulse-dot dot-5"></div>
              <div className="monitor-overlay">
                <h4 className="monitor-overlay-title">Real-time Global Reach</h4>
                <p className="monitor-overlay-desc">Connecting minds across six continents.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Call to Action Banner */}
      <section className="cta-banner-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to modernize your institution?</h2>
          <p className="cta-desc">
            Join the leading educational facilities worldwide that rely on EduProt for their mission-critical academic infrastructure.
          </p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={handleLoginClick}>
              Get Started Today
            </button>
            <button className="btn-cta-secondary" onClick={handleLoginClick}>
              Request a Quote
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <footer className="landing-footer" id="contact">
        <div className="footer-left">
          <div className="footer-logo">
            <img src="/assets/images/educroplogo.png" alt="EduCrop" className="footer-logo-img" />
          </div>
          <p className="footer-copy">© 2026 Educrop Academic Infrastructure. All rights reserved. <a href="https://www.devcreationsblr.com/" target="_blank" rel="noopener noreferrer" className="dev-highlight">Dev Creations and Solutions</a></p>
        </div>
        <div className="footer-right">
          <a
            href="/privacy"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/privacy');
            }}
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/terms');
            }}
          >
            Terms of Service
          </a>
          <a
            href="/accessibility"
            className="footer-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/accessibility');
            }}
          >
            Accessibility
          </a>
          <a href="#support" className="footer-link">Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
