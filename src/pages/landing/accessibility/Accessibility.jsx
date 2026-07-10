import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Eye, Ear, Keyboard, ShieldAlert } from 'lucide-react';
import './Accessibility.css';
import LandingFooter from '../../../components/layout/LandingFooter';

const Accessibility = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Enable standard page scrolling
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      // Restore dashboard layout overflow
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="accessibility-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-logo" onClick={() => navigate('/')}>
          <img src="/assets/images/educroplogo.png" alt="EduCrop" className="landing-logo-img" />
        </div>

        <nav className="landing-nav">
          <a
            href="/"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Home
          </a>
          <a
            href="/product"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/product');
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/about');
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className="nav-link"
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
            href="/"
            className="nav-link"
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
          >
            Home
          </a>
          <a
            href="/product"
            className="nav-link"
            onClick={() => {
              navigate('/product');
              setMobileMenuOpen(false);
            }}
          >
            Product
          </a>
          <a
            href="/about"
            className="nav-link"
            onClick={() => {
              navigate('/about');
              setMobileMenuOpen(false);
            }}
          >
            About
          </a>
          <a
            href="/contact"
            className="nav-link"
            onClick={() => {
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

      {/* Main Content */}
      <main className="access-main">
        <div className="access-container">
          <div className="access-header-section">
            <h1 className="access-title">Accessibility Statement</h1>
            <p className="access-subtitle">
              We embed accessibility into our design process to create better experiences for everyone. Inspired by inclusive innovation, we are committed to making our academic infrastructure accessible to all users.
            </p>
          </div>

          <div className="access-feature-block">
            <div className="access-illustration-container">
              <img src="/assets/images/accessibility_illustration.png" alt="Digital Accessibility Tools Illustration" className="access-illustration-img" />
            </div>
            <div className="access-intro-content">
              <h2>Inclusive Technology & Tools</h2>
              <p>
                Our platforms are built with compliance in mind. We constantly audit and optimize our features so that administrators, teachers, students, and guardians can interact with our software fluidly, regardless of ability or device setup.
              </p>
              <p className="reference-note">
                Reference site: Explore Microsoft's commitment to accessibility and details on inclusive tech at <a href="https://www.microsoft.com/en-us/accessibility" target="_blank" rel="noopener noreferrer">Microsoft Accessibility</a>.
              </p>
            </div>
          </div>

          <div className="access-grid">
            <div className="access-card">
              <div className="access-icon-box vision-icon">
                <Eye size={28} />
              </div>
              <h3>Vision</h3>
              <p>
                Support for screen readers, adjustable text sizing, contrast settings, and color filters to assist users with low vision, color blindness, or visual impairments.
              </p>
            </div>

            <div className="access-card">
              <div className="access-icon-box hearing-icon">
                <Ear size={28} />
              </div>
              <h3>Hearing</h3>
              <p>
                Closed captioning support, visual warning cues, mono audio merging, and speech-to-text features for auditory materials.
              </p>
            </div>

            <div className="access-card">
              <div className="access-icon-box mobility-icon">
                <Keyboard size={28} />
              </div>
              <h3>Mobility & Navigation</h3>
              <p>
                Full keyboard navigation support, skip-links, structured headings, and switch control compatibility for seamless physical interaction.
              </p>
            </div>

            <div className="access-card">
              <div className="access-icon-box cognitive-icon">
                <ShieldAlert size={28} />
              </div>
              <h3>Cognitive & Focus</h3>
              <p>
                Clutter-free reading layouts, adjustable session timeouts, clear warnings, and text suggestion helpers to minimize cognitive overload.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Accessibility;
