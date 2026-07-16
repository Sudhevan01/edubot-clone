import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Menu, X, Shield, Check, Network, Sparkles, Users, Globe, GraduationCap, BookOpen, Award, School } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import schoolHeroVideo from '../assets/videos/school-hero.mp4';
import './Homepage.css';

const Homepage = ({ onLoginClick }) => {
  const navigate = useNavigate();

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
        {/* Background Video */}
        <video
          className="hero-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={schoolHeroVideo}
        />

        {/* Educrop Brand Overlay - Premium dark blue gradient overlay (55-60% opacity) */}
        <div className="hero-brand-overlay"></div>

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
              <img src="/assets/images/card1.png" alt="Global Scalability" />
            </div>
            <div className="support-card-3col-content">
              <h3>Global Scalability</h3>
              <p>Infrastructure designed to support millions of users across diverse geographical regions without latency.</p>
            </div>
          </div>

          {/* Card 2: Pedagogical Excellence */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card2.png" alt="Pedagogical Excellence" />
            </div>
            <div className="support-card-3col-content">
              <h3>Pedagogical Excellence</h3>
              <p>Tools crafted in collaboration with leading educators to enhance learning outcomes and engagement.</p>
            </div>
          </div>

          {/* Card 3: Administrative Efficiency */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card3.png" alt="Administrative Efficiency" />
            </div>
            <div className="support-card-3col-content">
              <h3>Administrative Efficiency</h3>
              <p>Streamline complex workflows and reporting with automated administrative dashboards.</p>
            </div>
          </div>

          {/* Card 4: Collaborative Ecosystem */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card4.png" alt="Collaborative Ecosystem" />
            </div>
            <div className="support-card-3col-content">
              <h3>Collaborative Ecosystem</h3>
              <p>Seamless communication and resource sharing across teachers, students, parents, and administration.</p>
            </div>
          </div>

          {/* Card 5: AI-Driven Insights */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card5.png" alt="AI-Driven Insights" />
            </div>
            <div className="support-card-3col-content">
              <h3>AI-Driven Insights</h3>
              <p>Predictive analytics to identify student risk factors and optimize institutional decision-making.</p>
            </div>
          </div>

          {/* Card 6: Enterprise-Grade Security */}
          <div className="support-card-3col">
            <div className="support-card-3col-img-wrapper">
              <img src="/assets/images/card6.png" alt="Enterprise-Grade Security" />
            </div>
            <div className="support-card-3col-content">
              <h3>Enterprise-Grade Security</h3>
              <p>Bank-grade encryption, role-based access control, and strict compliance with global data privacy standards.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Section 4: Call to Action Banner */}
      <section className="cta-banner-section">
        {/* Animated Ambient Glow Mesh */}
        <div className="cta-ambient-glow"></div>

        {/* World Network Connection SVG with enhanced line visibility & animated nodes */}
        <svg className="cta-world-network" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g opacity="0.25" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="5 5">
            <path d="M150 120 Q 300 60 450 140 T 750 100 T 1050 160" />
            <path d="M100 280 Q 350 200 600 300 T 1100 240" />
            <path d="M200 320 Q 500 120 800 280 T 1000 80" />
          </g>
          <g className="cta-nodes-group" opacity="0.35">
            <circle cx="150" cy="120" r="4.5" fill="#60a5fa" />
            <circle cx="450" cy="140" r="5.5" fill="#3b82f6" />
            <circle cx="750" cy="100" r="4.5" fill="#60a5fa" />
            <circle cx="1050" cy="160" r="5.5" fill="#3b82f6" />
            <circle cx="350" cy="200" r="4.5" fill="#93c5fd" />
            <circle cx="600" cy="300" r="5.5" fill="#60a5fa" />
            <circle cx="800" cy="280" r="4.5" fill="#3b82f6" />
          </g>
        </svg>

        {/* Soft Glowing Particles including Far Left & Far Right Corners */}
        <div className="cta-particles">
          <span className="cta-particle particle-1"></span>
          <span className="cta-particle particle-2"></span>
          <span className="cta-particle particle-3"></span>
          <span className="cta-particle particle-4"></span>
          <span className="cta-particle particle-5"></span>
          <span className="cta-particle particle-6"></span>
        </div>

        {/* Floating Education Icons */}
        <div className="cta-floating-icon icon-grad"><GraduationCap size={28} /></div>
        <div className="cta-floating-icon icon-book"><BookOpen size={26} /></div>
        <div className="cta-floating-icon icon-globe"><Globe size={28} /></div>
        <div className="cta-floating-icon icon-school"><School size={26} /></div>
        <div className="cta-floating-icon icon-award"><Award size={26} /></div>

        <div className="cta-content">
          {/* Soft Heading Glow */}
          <div className="cta-heading-glow"></div>
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
