import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Workflow, Plug, Users, Sliders, Rocket, Globe, Leaf, Menu, X } from 'lucide-react';
import './About.css';
import whoWeAre1 from '../assets/images/who_we_are_1.png';
import whoWeAre2 from '../assets/images/who_we_are_2.png';
import whoWeAre3 from '../assets/images/who_we_are_3.png';
import whoWeAre4 from '../assets/images/who_we_are_4.png';
import visionImage from '../assets/images/vision_image.png';


const About = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="about-page">
      {/* Navigation */}
      <nav className="about-nav">
        <div className="nav-container">
          <div className="logo">EduProt</div>
          
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
            <Link to="/">HOME</Link>
            <Link to="/product">PRODUCT</Link>
            <Link to="/about" className="active">ABOUT</Link>
            <Link to="/contact">CONTACT</Link>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="login-btn">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h4 className="mission-title">OUR MISSION</h4>
            <h1 className="hero-heading">Empowering Institutions Through Digital Precision.</h1>
            <p className="hero-description">
              EduProt provides the rigorous infrastructure needed for modern academic management, balancing administrative complexity with intuitive design.
            </p>
          </div>
          <div className="hero-image-wrapper">
            <img 
              src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000" 
              alt="Modern library interior" 
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="who-we-are-section">
        <div className="who-we-are-container">
          <div className="who-we-are-text">
            <h2>Who <span className="highlight-text">We Are</span></h2>
            <p>
              Dev Creations is a web development and digital branding company that creates websites, business software, UI/UX designs, and branding solutions for startups and businesses.
            </p>
            <p>
              We work with modern businesses to build user-friendly websites, strong brand identities, and digital solutions that help them grow online.
            </p>
            
            <div className="stats-row">
              <div className="about-stat-card">
                <h3>45+</h3>
                <span>PROJECTS DELIVERED</span>
              </div>
              <div className="about-stat-card">
                <h3>50+</h3>
                <span>TRUSTED CLIENTS</span>
              </div>
              <div className="about-stat-card">
                <h3>10+</h3>
                <span>CREATIVE DOMAINS</span>
              </div>
              <div className="about-stat-card">
                <h3>24/7</h3>
                <span>SUPPORT SYSTEM</span>
              </div>
            </div>
          </div>
          
          <div className="who-we-are-grid">
            <div className="grid-col">
              <img src={whoWeAre1} alt="Professional in office" className="grid-img short" />
              <img src={whoWeAre2} alt="Team meeting" className="grid-img tall" />
            </div>
            <div className="grid-col">
              <img src={whoWeAre3} alt="Server infrastructure" className="grid-img tall" />
              <img src={whoWeAre4} alt="Data dashboard on tablet" className="grid-img short" />
            </div>
          </div>
        </div>
      </section>

      {/* Why We Are Section */}
      <section className="why-we-are-section">
        <div className="why-header">
          <h2>Why <span className="highlight-text">We Are</span></h2>
          <p>A multidisciplinary creative technology studio helping businesses grow through immersive branding, modern ERP systems, and premium digital experiences.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600" alt="Creative Innovation" className="feature-img" />
            <div className="feature-content">
              <h3>Creative Innovation</h3>
              <p>We blend storytelling, UI/UX, branding, and enterprise systems into powerful business ecosystems.</p>
            </div>
          </div>
          
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600" alt="Business Focused" className="feature-img" />
            <div className="feature-content">
              <h3>Business Focused</h3>
              <p>Every solution is designed to improve growth, operations, customer experience, and scalability.</p>
            </div>
          </div>
          
          <div className="feature-card">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600" alt="Premium Execution" className="feature-img" />
            <div className="feature-content">
              <h3>Premium Execution</h3>
              <p>From printing to ERP systems, we maintain premium quality across every project we deliver.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Vision Section */}
      <section className="vision-section">
        <div className="vision-container">
          <div className="vision-content">
            <h2>Our Vision</h2>
            
            <div className="vision-item">
              <Rocket className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>The Autonomous Campus</h3>
                <p>We envision a future where administrative tasks are invisible, powered by ethical AI that predicts needs before they become hurdles.</p>
              </div>
            </div>
            
            <div className="vision-item">
              <Globe className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>Global Standards</h3>
                <p>Setting the benchmark for how educational data is stored and shared globally, ensuring student mobility is never hindered by red tape.</p>
              </div>
            </div>
            
            <div className="vision-item">
              <Leaf className="vision-icon" size={28} />
              <div className="vision-text">
                <h3>Sustainability through Efficiency</h3>
                <p>Reducing the physical footprint of institutions by digitizing every legacy paper trail, from visitor logs to academic transcripts.</p>
              </div>
            </div>
          </div>
          <div className="vision-image-wrapper">
            <img src={visionImage} alt="Building Safer Schools" className="vision-img" />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Ready to modernize your infrastructure?</h2>
        <div className="cta-buttons">
          <button className="btn-primary">Schedule a Demo</button>
          <button className="btn-secondary">View Product Guide</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="about-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">EduProt</div>
            <div className="footer-copyright">© 2024 EduProt Academic Infrastructure. All rights reserved.</div>
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#accessibility">Accessibility</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
