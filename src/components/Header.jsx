import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Header = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Product', path: '/product' },
    { name: 'Docs', path: '/docs' },
    { name: 'Downloads', path: '/downloads' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const handleNavClick = (e, path) => {
    e.preventDefault();
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
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
        <button className="btn-login" onClick={onLoginClick}>
          Login
        </button>
      </div>

      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
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
          <button className="btn-login w-full mt-4" onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}>
            Login
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
