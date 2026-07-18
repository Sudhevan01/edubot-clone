import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import './Header.css';

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Product', path: '/product' },
    { name: 'Docs', path: '/docs' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Benefits', path: '/benefits' }
  ];

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Lock ALL scroll when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <React.Fragment>

      {/* ── Sticky Header Bar ── */}
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/assets/images/educroplogo.png" alt="EduCrop" className="landing-logo-img" />
        </div>

        <nav className="landing-nav">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, link.path)}
            >
              {link.name}
            </a>
          ))}
        </nav>

        <div className="landing-auth">
          <button className="btn-login" onClick={onLoginClick}>Login</button>
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </header>

      {/* ── Backdrop — outside header so position:fixed works ── */}
      <div
        className={`drawer-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* ── Slide-in Drawer — outside header so position:fixed works ── */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>

        <div className="drawer-header">
          <div className="drawer-logo" onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>
            <img src="/assets/images/educroplogo.png" alt="EduCrop" className="drawer-logo-img" />
          </div>
          <button className="drawer-close-btn" onClick={() => setMobileMenuOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <nav className="drawer-nav">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.path}
              className={`drawer-nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, link.path)}
            >
              {link.name}
              {isActive(link.path) && <span className="drawer-active-dot" />}
            </a>
          ))}
        </nav>

        <div className="drawer-login-wrap">
          <button
            className="drawer-login-btn"
            onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
          >
            Login
          </button>
        </div>

        <div className="drawer-contact">
          <p className="drawer-contact-label">CONTACT</p>
          <a href="mailto:Educropblr@gmail.com" className="drawer-contact-item">
            <Mail size={14} /> Educropblr@gmail.com
          </a>
          <a href="mailto:info@devcreationsblr.com" className="drawer-contact-item">
            <Mail size={14} /> info@devcreationsblr.com
          </a>
          <a href="tel:+917337840612" className="drawer-contact-item">
            <Phone size={14} /> +91 73378 40612
          </a>
        </div>

      </div>

    </React.Fragment>
  );
};

export default Header;
