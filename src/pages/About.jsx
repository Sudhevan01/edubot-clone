import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Workflow, Plug, Users, Sliders, Rocket, Globe, Leaf, Menu, X, CheckCircle, ShieldCheck, Lock, UserCheck, Cloud, Monitor, Code, ArrowRight } from 'lucide-react';
import './About.css';
import whoWeAre from '../assets/images/who we are.png';
import visionImage from '../assets/images/vision_image.png';
import missionImage from '../assets/images/mission_image.png';
import visionCampus from '../assets/images/vision_campus.png';
import heroSchoolImg from '../assets/images/about_hero_school.png';
import { useScrollReveal } from '../hooks/useScrollReveal';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';

const AnimatedNumber = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    let observer;
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        setCount(Math.floor(end * (progress / duration)));
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    const handleIntersect = (entries) => {
      if (entries[0].isIntersecting) {
        startTime = null;
        animationFrame = requestAnimationFrame(updateCount);
        observer.unobserve(nodeRef.current);
      }
    };

    observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration]);

  return (
    <span ref={nodeRef}>
      {count}{suffix}
    </span>
  );
};

const About = ({ onLoginClick }) => {
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



  return (
    <div className="about-page">
      <Header onLoginClick={onLoginClick} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-card reveal-on-scroll">
            <img
              src={heroSchoolImg}
              alt="School Campus"
              className="hero-bg-image"
            />
            <div className="hero-glass-panel">
              <div className="mission-badge stagger-1">
                <span className="mission-dot"></span>
                OUR MISSION
              </div>

              <h1 className="hero-heading stagger-2">
                Empowering Institutions <br className="hero-br" />
                Through <span className="hero-highlight">Digital Precision.</span>
              </h1>

              <p className="hero-description stagger-3">
                Educrop provides the rigorous infrastructure needed for modern academic management, balancing administrative complexity with intuitive design.
              </p>

              <div className="hero-button-group stagger-3">
                <button className="btn-learn-more">
                  Learn More About Us <ArrowRight size={18} />
                </button>
              </div>

              {/* Decorative dots inside the glass panel */}
              <div className="glass-dots">
                {[...Array(24)].map((_, i) => (
                  <span key={i} className="glass-dot"></span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="who-we-are-section">
        <div className="who-we-are-container">
          <div className="who-we-are-text">
            <h2 className="reveal-on-scroll">Who <span className="highlight-text">We Are</span></h2>
            <p className="reveal-on-scroll stagger-1" style={{ textAlign: 'justify' }}>
              <strong>Dev Creations & Solutions</strong> is a technology company that builds websites, business software, and digital brands. We focus on creating simple and effective solutions for modern businesses.
            </p>
            <p className="reveal-on-scroll stagger-2" style={{ textAlign: 'justify' }}>
              We are the proud parent company behind <strong>EduCrop</strong>, which is our flagship product. EduCrop is a powerful educational software designed specifically to help schools and colleges manage everything digitally.
            </p>

            <div className="stats-row reveal-on-scroll stagger-3">
              <div className="about-stat-card">
                <h3><AnimatedNumber end={45} suffix="+" /></h3>
                <span className="stat-label">PROJECTS DELIVERED</span>
              </div>
              <div className="about-stat-card">
                <h3><AnimatedNumber end={50} suffix="+" /></h3>
                <span className="stat-label">TRUSTED CLIENTS</span>
              </div>
              <div className="about-stat-card">
                <h3><AnimatedNumber end={10} suffix="+" /></h3>
                <span className="stat-label">CREATIVE DOMAINS</span>
              </div>
              <div className="about-stat-card">
                <h3><AnimatedNumber end={24} suffix="/7" /></h3>
                <span className="stat-label">SUPPORT SYSTEM</span>
              </div>
            </div>
          </div>

          <div className="who-we-are-image-wrapper reveal-on-scroll stagger-2">
            <img src={whoWeAre} alt="Who We Are" className="who-we-are-main-img" />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="security-container-modern">
          <div className="security-content-wrapper">
            <div className="security-text-content reveal-on-scroll">
              <h2>HOW IS YOUR DATA SECURE WITH <span className="highlight-text">EDUCROP?</span></h2>
              <p>At Educrop, the security and privacy of school data is our top priority. We follow industry best practices, legal agreements and use world-class cloud infrastructure to ensure your data is safe, secure and always protected.</p>
              <div className="security-trust-badge">
                <ShieldCheck size={36} className="trust-icon" />
                <div>
                  <strong>100% Secure & Compliant</strong>
                  <span>Your data is handled strictly as per agreement.</span>
                </div>
              </div>
            </div>

            <div className="security-features-stack">
              <div className="security-feature-row reveal-on-scroll stagger-1">
                <div className="feature-icon-box"><ShieldCheck size={20} /></div>
                <div className="feature-text-box">
                  <h4>Legal & Compliance</h4>
                  <p>Strict MOUs and comprehensive privacy policies ensure total legal protection.</p>
                </div>
              </div>

              <div className="security-feature-row reveal-on-scroll stagger-2">
                <div className="feature-icon-box"><Cloud size={20} /></div>
                <div className="feature-text-box">
                  <h4>Cloud Infrastructure</h4>
                  <p>Powered by enterprise-grade AWS, Google Cloud, and MongoDB servers.</p>
                </div>
              </div>

              <div className="security-feature-row reveal-on-scroll stagger-3">
                <div className="feature-icon-box"><Lock size={20} /></div>
                <div className="feature-text-box">
                  <h4>Data Encryption</h4>
                  <p>Bank-grade encryption safeguards your information in transit and at rest.</p>
                </div>
              </div>

              <div className="security-feature-row reveal-on-scroll stagger-4">
                <div className="feature-icon-box"><Monitor size={20} /></div>
                <div className="feature-text-box">
                  <h4>24/7 Monitoring</h4>
                  <p>Continuous threat detection and automated disaster recovery backups.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Are Section */}
      <section className="why-we-are-section">
        <div className="why-header reveal-on-scroll">
          <h2>Why <span className="highlight-text">We Are</span></h2>
          <p>A multidisciplinary creative technology studio helping businesses grow through immersive branding, modern ERP systems, and premium digital experiences.</p>
        </div>

        <div className="features-grid">
          <div className="reveal-on-scroll">
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600" alt="Creative Innovation" className="feature-img" />
              <div className="feature-content">
                <h3>Creative Innovation</h3>
                <p>We blend storytelling, UI/UX, branding, and enterprise systems into powerful business ecosystems.</p>
              </div>
            </div>
          </div>

          <div className="reveal-on-scroll stagger-1">
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600" alt="Business Focused" className="feature-img" />
              <div className="feature-content">
                <h3>Business Focused</h3>
                <p>Every solution is designed to improve growth, operations, customer experience, and scalability.</p>
              </div>
            </div>
          </div>

          <div className="reveal-on-scroll stagger-2">
            <div className="feature-card">
              <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600" alt="Premium Execution" className="feature-img" />
              <div className="feature-content">
                <h3>Premium Execution</h3>
                <p>From printing to ERP systems, we maintain premium quality across every project we deliver.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="vs-section">
        {/* Background blobs */}
        <div className="vs-blob vs-blob--l" aria-hidden="true" />
        <div className="vs-blob vs-blob--r" aria-hidden="true" />

        <div className="vs-card reveal-on-scroll">

          {/* ───── LEFT COLUMN ───── */}
          <div className="vs-left">

            {/* Badge */}
            <div className="vs-badge">
              <span className="vs-badge-star">✦</span>
              OUR VISION
            </div>

            {/* Heading + underline */}
            <h2 className="vs-heading">Our Vision</h2>
            <div className="vs-underline" aria-hidden="true" />

            {/* Feature cards */}
            <div className="vs-stack">

              <div className="vs-feature reveal-on-scroll stagger-1">
                <div className="vs-icon-circle">
                  <Rocket size={20} />
                </div>
                <div className="vs-feature-body">
                  <h3>The Autonomous Campus</h3>
                  <p>We envision a future where administrative tasks are invisible, powered by ethical AI that predicts needs before they become hurdles.</p>
                </div>
              </div>

              <div className="vs-feature reveal-on-scroll stagger-2">
                <div className="vs-icon-circle">
                  <Globe size={20} />
                </div>
                <div className="vs-feature-body">
                  <h3>Global Standards</h3>
                  <p>Setting the benchmark for how educational data is stored and shared globally, ensuring student mobility is never hindered by red tape.</p>
                </div>
              </div>

              <div className="vs-feature reveal-on-scroll stagger-3">
                <div className="vs-icon-circle">
                  <Leaf size={20} />
                </div>
                <div className="vs-feature-body">
                  <h3>Sustainability through Efficiency</h3>
                  <p>Reducing the physical footprint of institutions by digitizing every legacy paper trail, from visitor logs to academic transcripts.</p>
                </div>
              </div>

            </div>
          </div>

          {/* ───── RIGHT COLUMN ───── */}
          <div className="vs-right reveal-on-scroll stagger-2">
            <div className="vs-img-wrap">

              {/* Campus photo */}
              <img
                src={visionCampus}
                alt="Modern school campus with students and teacher"
                className="vs-img"
              />

              {/* Blue gradient overlay — matches reference color grade */}
              <div className="vs-img-tint" aria-hidden="true" />

              {/* Floating glass stat cards — stacked on right edge */}
              <div className="vs-stat vs-stat--1">
                <div className="vs-stat-icon">📊</div>
                <div className="vs-stat-body">
                  <strong>98%</strong>
                  <span>Administrative<br />Automation</span>
                </div>
              </div>

              <div className="vs-stat vs-stat--2">
                <div className="vs-stat-icon">🤖</div>
                <div className="vs-stat-body">
                  <strong>AI Driven</strong>
                  <span>Campus</span>
                </div>
              </div>

              <div className="vs-stat vs-stat--3">
                <div className="vs-stat-icon">🌍</div>
                <div className="vs-stat-body">
                  <strong>Global Education</strong>
                  <span>Network</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* Call to Action Section */}
      <section className="cta-section reveal-on-scroll">
        <div className="cta-container">
          <h2>Ready to modernize your infrastructure?</h2>
          <p className="cta-subtitle">
            Join hundreds of institutions worldwide in redefining academic management<br />
            with precision and security.
          </p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/contact')}>Schedule a Demo</button>
            <button className="btn-secondary" onClick={() => navigate('/product')}>View Product Guide</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default About;
