import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Menu, X, Shield, Check, Network, Sparkles, Users, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import LandingFooter from '../../../components/layout/LandingFooter';
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

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/assets/images/banner2.jpeg',
    '/assets/images/banner.jpeg',
    '/assets/images/banner3.png'
  ];

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(interval);
  }, [slides.length]);

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
          <button className="btn-login w-full mt-4" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      )}

      {/* Hero Section */}
      <main
        className="landing-hero"
        id="home"
      >
        {/* Background Slider */}
        <div
          className="hero-bg-slider"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div
              key={index}
              className="hero-bg-slide"
              style={{ backgroundImage: `url(${slide})` }}
            ></div>
          ))}
        </div>
        {/* Hero Overlay */}
        <div className={`hero-overlay slide-${currentSlide}`}></div>
        {/* Slide Navigation Arrows */}
        <button className="hero-slide-btn prev" onClick={prevSlide} aria-label="Previous Slide">
          <ChevronLeft size={36} />
        </button>
        <button className="hero-slide-btn next" onClick={nextSlide} aria-label="Next Slide">
          <ChevronRight size={36} />
        </button>

        {/* Slide Indicators */}
        <div className="hero-slide-indicators">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`slide-dot ${currentSlide === index ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            ></span>
          ))}
        </div>

        <div className="hero-left">
          <div className="hero-badge">
            The Future of Learning Infrastructure
          </div>
          <h1 className="hero-title">
            Empowering Academic Excellence
          </h1>
          <p className="hero-desc">
            Educrop provides the robust structural foundation and digital orchestration required for modern educational institutions to thrive in an era of rapid digital transformation.
          </p>
          <div className="hero-actions">
            <button className="btn-explore" onClick={handleLoginClick}>
              Explore Platform <ArrowRight size={18} />
            </button>
            <button className="btn-demo" onClick={() => navigate('/contact')}>
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

        <div className="support-grid-3col">
          {/* Card 1: Global Scalability */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card1.jpeg" alt="Global Scalability" />
            </div>
            <div className="support-card-3col-content">
              <h3>Global Scalability</h3>
              <p>Infrastructure designed to support millions of users across diverse geographical regions without latency.</p>
            </div>
          </div>

          {/* Card 2: Pedagogical Excellence */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card2.jpeg" alt="Pedagogical Excellence" />
            </div>
            <div className="support-card-3col-content">
              <h3>Pedagogical Excellence</h3>
              <p>Tools crafted in collaboration with leading educators to enhance learning outcomes and engagement.</p>
            </div>
          </div>

          {/* Card 3: Administrative Efficiency */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card3.jpeg" alt="Administrative Efficiency" />
            </div>
            <div className="support-card-3col-content">
              <h3>Administrative Efficiency</h3>
              <p>Streamline complex workflows and reporting with automated administrative dashboards.</p>
            </div>
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
            Join the leading educational facilities worldwide that rely on Educrop for their mission-critical academic infrastructure.
          </p>
          <div className="cta-buttons">
            <button className="btn-cta-primary" onClick={handleLoginClick}>
              Get Started Today
            </button>
            <button className="btn-cta-secondary" onClick={() => navigate('/contact')}>
              Request a Quote
            </button>
          </div>
        </div>
      </section>

      {/* Section 5: Footer */}
      <LandingFooter />
    </div>
  );
};

export default Homepage;
