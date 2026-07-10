import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Terms.css';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';

const Terms = ({ onLoginClick }) => {
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
    <div className="terms-page">
      <Header onLoginClick={onLoginClick} />

      {/* Main Content */}
      <main className="terms-main">
        <div className="terms-container">
          <h1 className="terms-title">Terms of Service</h1>
          <p className="terms-date">Last Updated: July 6, 2026</p>
          
          <div className="terms-body">
            <section className="terms-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity, and Educrop, concerning your access to and use of our platform.
              </p>
              <p>
                By accessing our platform, you agree that you have read, understood, and agree to be bound by all of these Terms of Service.
              </p>
            </section>

            <section className="terms-section">
              <h2>2. Intellectual Property Rights</h2>
              <p>
                Unless otherwise indicated, the platform is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the platform and the trademarks, service marks, and logos contained therein are owned or controlled by us or licensed to us.
              </p>
            </section>

            <section className="terms-section">
              <h2>3. User Representations</h2>
              <p>
                By using the platform, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.
              </p>
            </section>

            <section className="terms-section">
              <h2>4. Prohibited Activities</h2>
              <p>
                You may not access or use the platform for any purpose other than that for which we make the platform available. The platform may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
              </p>
            </section>

            <section className="terms-section">
              <h2>5. Contact Us</h2>
              <p>
                In order to resolve a complaint regarding the platform or to receive further information regarding use of the platform, please contact us at support@educrop.com or by mail to Dev Creations and Solutions.
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

export default Terms;
