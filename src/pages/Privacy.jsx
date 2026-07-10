import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Privacy.css';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';

const Privacy = ({ onLoginClick }) => {
  const navigate = useNavigate();


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



  return (
    <div className="privacy-page">
      <Header onLoginClick={onLoginClick} />

      {/* Main Content */}
      <main className="privacy-main">
        <div className="privacy-container">
          <h1 className="privacy-title">Privacy Policy</h1>
          <p className="privacy-date">Last Updated: July 6, 2026</p>
          
          <div className="privacy-body">
            <section className="privacy-section">
              <h2>1. Introduction</h2>
              <p>
                Welcome to Educrop. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
              </p>
            </section>

            <section className="privacy-section">
              <h2>2. Information We Collect</h2>
              <p>
                We collect personal information that you voluntarily provide to us when registering at the Services, expressing an interest in obtaining information about us or our products and services, or otherwise contact us.
              </p>
              <p>
                The personal information we collect depends on the context of your interactions with us and the choices you make, the products and features you use.
              </p>
            </section>

            <section className="privacy-section">
              <h2>3. How We Use Your Information</h2>
              <p>
                We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
            </section>

            <section className="privacy-section">
              <h2>4. Data Security and Preservation</h2>
              <p>
                We aim to protect your personal information through a system of organizational and technical security measures. We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process.
              </p>
            </section>

            <section className="privacy-section">
              <h2>5. Contact Us</h2>
              <p>
                If you have questions or comments about this policy, you may contact us at support@educrop.com or by mail to Dev Creations and Solutions.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Privacy;
