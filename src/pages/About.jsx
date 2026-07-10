import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Workflow, Plug, Users, Sliders, Rocket, Globe, Leaf, Menu, X } from 'lucide-react';
import './About.css';
import whoWeAre from '../assets/images/who we are.png';
import visionImage from '../assets/images/vision_image.png';
import missionImage from '../assets/images/mission_image.png';
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
          <div className="hero-content">
            <h4 className="mission-title reveal-on-scroll">OUR MISSION</h4>
            <h1 className="hero-heading reveal-on-scroll stagger-1">
              Empowering Institutions Through Digital Precision.
            </h1>
            <p className="hero-description reveal-on-scroll stagger-2">
              Educrop provides the rigorous infrastructure needed for modern academic management, balancing administrative complexity with intuitive design.
            </p>
          </div>
          <div className="hero-image-wrapper reveal-on-scroll stagger-3">
            <img 
              src={missionImage} 
              alt="Education Network" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="who-we-are-section">
        <div className="who-we-are-container">
          <div className="who-we-are-text">
            <h2 className="reveal-on-scroll">Who <span className="highlight-text">We Are</span></h2>
            <p className="reveal-on-scroll stagger-1">
              Dev Creations is a web development and digital branding company that creates websites, business software, UI/UX designs, and branding solutions for startups and businesses.
            </p>
            <p className="reveal-on-scroll stagger-2">
              We work with modern businesses to build user-friendly websites, strong brand identities, and digital solutions that help them grow online.
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
      <section className="vision-section">
        <div className="vision-container">
          <div className="vision-content">
            <h2 className="reveal-on-scroll">Our Vision</h2>
            
            <div className="vision-item reveal-on-scroll stagger-1">
              <Rocket className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>The Autonomous Campus</h3>
                <p>We envision a future where administrative tasks are invisible, powered by ethical AI that predicts needs before they become hurdles.</p>
              </div>
            </div>
            
            <div className="vision-item reveal-on-scroll stagger-2">
              <Globe className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>Global Standards</h3>
                <p>Setting the benchmark for how educational data is stored and shared globally, ensuring student mobility is never hindered by red tape.</p>
              </div>
            </div>
            
            <div className="vision-item reveal-on-scroll stagger-3">
              <Leaf className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>Sustainability through Efficiency</h3>
                <p>Reducing the physical footprint of institutions by digitizing every legacy paper trail, from visitor logs to academic transcripts.</p>
              </div>
            </div>
          </div>
          <div className="vision-image-wrapper reveal-on-scroll stagger-2">
            <img src={visionImage} alt="Building Safer Schools" className="vision-img" />
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
