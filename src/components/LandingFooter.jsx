import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingFooter.css';

const LandingFooter = () => {
  const navigate = useNavigate();

  const handleScrollNav = (e, path, hash) => {
    e.preventDefault();
    navigate(path);
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <footer className="landing-footer" id="contact">
      <div className="footer-container">
        
        {/* Left Side: Brand and Copyright */}
        <div className="footer-left">
          <div className="footer-logo">
            <img src="/assets/images/educroplogo.png" alt="EduCrop" className="footer-logo-img" />
          </div>
          <div className="footer-tagline">
            Empowering education through seamless digital infrastructure.
          </div>
          <div className="footer-copyright-box">
            <p className="footer-copy">© 2026 Educrop Academic Infrastructure. All rights reserved.</p>
            <a href="https://www.devcreationsblr.com/" target="_blank" rel="noopener noreferrer" className="dev-highlight">
              Designed by Dev Creations and Solutions
            </a>
          </div>
        </div>

        {/* Right Side: Links Columns */}
        <div className="footer-right-columns">
          {/* Platform Column */}
          <div className="footer-col">
            <h4>Platform</h4>
            <a href="/product#vms" className="footer-link" onClick={(e) => handleScrollNav(e, '/product', 'vms')}>VMS</a>
            <a href="/product#rms" className="footer-link" onClick={(e) => handleScrollNav(e, '/product', 'rms')}>RMS</a>
            <a href="/product#ams" className="footer-link" onClick={(e) => handleScrollNav(e, '/product', 'ams')}>AMS</a>
          </div>

          {/* Navigation Column */}
          <div className="footer-col">
            <h4>Navigation</h4>
            <a href="/" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
            <a href="/product" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/product'); }}>Product</a>
            <a href="/about" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>About</a>
            <a href="/contact" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Contact</a>
            <a href="/docs" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/docs'); }}>Docs</a>
            <a href="/docs#downloads" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/docs#downloads'); }}>Downloads</a>
          </div>

          {/* Legal Column */}
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="/privacy" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>
            <a href="/terms" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Terms of Service</a>
            <a href="/accessibility" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/accessibility'); }}>Accessibility</a>
            <a href="/contact" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>Support</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
