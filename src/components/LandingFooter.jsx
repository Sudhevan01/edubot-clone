import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Layers, BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
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
        <div className="footer-brand-col">
          <div className="footer-logo">
            <img src="/assets/images/educroplogo.png" alt="EduCrop" className="footer-logo-img" />
          </div>
          <p className="footer-tagline">
            Empowering education through seamless digital infrastructure.
          </p>
          <div className="footer-socials">
            <a href="https://youtube.com/@educropblr?si=UbiaZohs1gdn3jsl" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2003/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://wa.me/917337840612" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="WhatsApp">
              <svg xmlns="http://www.w3.org/2003/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05 .9"></path>
                <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1"></path>
              </svg>
            </a>
            <a href="mailto:info@devcreationsblr.com" className="social-icon" aria-label="Mail">
              <Mail size={18} strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* Right Side: Links Columns */}
        <div className="footer-links-grid">
          {/* Platform Column */}
          <div className="footer-col platform-col">
            <h4>PLATFORM</h4>
            <div className="platform-item" onClick={(e) => handleScrollNav(e, '/product', 'vms')}>
              <div className="platform-icon"><ShieldCheck size={20} /></div>
              <div className="platform-text">
                <span className="platform-title">VMS</span>
                <span className="platform-sub">Visitor Management System</span>
              </div>
            </div>
            <div className="platform-item" onClick={(e) => handleScrollNav(e, '/product', 'rms')}>
              <div className="platform-icon"><Layers size={20} /></div>
              <div className="platform-text">
                <span className="platform-title">RMS</span>
                <span className="platform-sub">Resource Management System</span>
              </div>
            </div>
            <div className="platform-item" onClick={(e) => handleScrollNav(e, '/product', 'ams')}>
              <div className="platform-icon"><BookOpen size={20} /></div>
              <div className="platform-text">
                <span className="platform-title">AMS</span>
                <span className="platform-sub">Academic Management System</span>
              </div>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="footer-col nav-col">
            <h4>NAVIGATION</h4>
            <div className="nav-grid">
              <a href="/" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
                <ChevronRight size={14} className="link-arrow" /> Home
              </a>
              <a href="/contact" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>
                <ChevronRight size={14} className="link-arrow" /> Contact
              </a>
              <a href="/product" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/product'); }}>
                <ChevronRight size={14} className="link-arrow" /> Product
              </a>
              <a href="/docs" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/docs'); }}>
                <ChevronRight size={14} className="link-arrow" /> Docs
              </a>
              <a href="/about" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/about'); }}>
                <ChevronRight size={14} className="link-arrow" /> About
              </a>
              <a href="/docs#downloads" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/docs#downloads'); }}>
                <ChevronRight size={14} className="link-arrow" /> Downloads
              </a>
            </div>
          </div>

          {/* Legal Column */}
          <div className="footer-col legal-col">
            <h4>LEGAL</h4>
            <a href="/privacy" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>
              <ShieldCheck size={16} className="link-shield" /> Privacy Policy
            </a>
            <a href="/terms" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>
              <ShieldCheck size={16} className="link-shield" /> Terms of Service
            </a>
            <a href="/accessibility" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/accessibility'); }}>
              <ShieldCheck size={16} className="link-shield" /> Accessibility
            </a>
            <a href="/contact" className="footer-link" onClick={(e) => { e.preventDefault(); navigate('/contact'); }}>
              <ShieldCheck size={16} className="link-shield" /> Support
            </a>
          </div>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p className="footer-copy">© 2026 Educrop. All Rights Reserved.</p>
        <p className="footer-credit">
          Powered by <a href="https://www.devcreationsblr.com/" target="_blank" rel="noopener noreferrer" className="dev-highlight">Dev Creations and Solutions</a>
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
