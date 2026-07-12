import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Menu, X, Shield, Check, Network, Sparkles, Users, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import './Homepage.css';

const Homepage = ({ onLoginClick }) => {
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    '/assets/images/new_slide_1.png',
    '/assets/images/new_slide_2.png',
    '/assets/images/vms_dashboard_banner.png'
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

    return () => {
      // Restore the dashboard's viewport layout styling when leaving
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);



  return (
    <div className="landing-page">
      <Header onLoginClick={onLoginClick} />

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
              className={`hero-bg-slide slide-img-${index}`}
              style={{ backgroundImage: `url(${slide})` }}
            ></div>
          ))}
        </div>

        {/* Educrop Brand Overlay - Solid blue fading to transparent */}
        <div className="hero-brand-overlay"></div>

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

        <div className="hero-content-wrapper">
          <div className="hero-left">
            <div className="hero-badge">
              Smart Education Management Software
            </div>
            <h1 className="hero-title">
              <span className="hero-title-line">Empowering</span>
              <span className="hero-title-line">Academic Excellence</span>
            </h1>
            <p className="hero-desc">
              Educrop provides the robust structural foundation and digital orchestration required for modern educational institutions to thrive in an era of rapid digital transformation.
            </p>
            <div className="hero-actions">
              <button className="btn-explore" onClick={onLoginClick}>
                Explore Platform <ArrowRight size={18} />
              </button>
              <button className="btn-demo" onClick={() => navigate('/contact')}>
                Schedule Demo
              </button>
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
          <div className="support-card subcard">
            <div className="subcard-icon-box purple-box animated-icon-sparkles">
              <Sparkles size={20} />
            </div>
            <h3 className="subcard-title">AI-Driven Insights</h3>
            <p className="subcard-desc">
              Predictive analytics to identify students at risk and optimize resource allocation across departments.
            </p>
          </div>

          {/* Card 2: Collaborative Tools */}
          <div className="support-card subcard">
            <div className="subcard-icon-box grey-box animated-icon-users">
              <Users size={20} />
            </div>
            <h3 className="subcard-title">Collaborative Tools</h3>
            <p className="subcard-desc">
              Seamless integration for research teams and faculty to share resources in a secure, high-speed environment.
            </p>
          </div>

          {/* Card 3: Global Scalability */}
          <div className="support-card subcard">
            <div className="subcard-icon-box blue-box animated-icon-globe">
              <Globe size={20} />
            </div>
            <h3 className="subcard-title">Global Scalability</h3>
            <p className="subcard-desc">
              Deploy infrastructure across multiple regions with sub-millisecond latency for distance learning.
            </p>
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
            <button className="btn-cta-primary" onClick={onLoginClick}>
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
