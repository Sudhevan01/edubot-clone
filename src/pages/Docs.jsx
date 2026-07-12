import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Shield, Receipt, GraduationCap, ArrowRight, Menu, X, Check, Copy, Terminal, Building, Users, Smartphone, MessageSquare, Download, Apple } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import './Docs.css';

const FAQItem = ({ question, answer, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
      <div className="faq-question">
        <h4>{question}</h4>
        <div className="faq-toggle">{isOpen ? '-' : '+'}</div>
      </div>
      <div className="faq-answer" onClick={(e) => e.stopPropagation()}>
        {answer && <p>{answer}</p>}
        {children}
      </div>
    </div>
  );
};

const Docs = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('organization');

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['organization', 'teachers', 'parents', 'developers', 'downloads'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const docSections = {
    'organization': {
      title: 'Organization',
      icon: <Building size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Organization Overview</h2>
          <p>
            EduCrop is designed to power the entire operational infrastructure of your institution. Discover the working principles of our three core modules.
          </p>

          <div className="faq-container">
            <FAQItem 
              question="Academic Management System (AMS)"
              answer="Centralizes student data, curriculum tracking, and performance metrics. AMS automates attendance logging, grades computation, and assignment distribution, ensuring teachers spend less time on paperwork and more time teaching."
            />
            <FAQItem 
              question="Receipt Management System (RMS)"
              answer="Acts as the financial backbone of the institution. RMS completely automates fee collections, invoice generation, and staff payroll, maintaining an immutable ledger of transactions for flawless auditing and financial transparency."
            />
            <FAQItem 
              question="Visitor Management System (VMS)"
              answer="Secures the campus perimeter. VMS leverages instant ID scanning and QR codes to digitally log every entry and exit. It cross-references watchlists and sends real-time SMS alerts to hosts, replacing unsecure paper logbooks."
            />
          </div>
        </div>
      )
    },
    'teachers': {
      title: 'Teachers',
      icon: <GraduationCap size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Teacher Portal & FAQs</h2>
          <p>Everything you need to know about managing your classroom, grading, and assignments.</p>
          
          <div className="faq-container">
            <FAQItem 
              question="How do I mark daily attendance for my class?"
              answer="Navigate to the AMS module, select your assigned class under 'My Classes', and click on 'Mark Attendance'. You can mark students as present, absent, or on leave with a single click."
            />
            <FAQItem 
              question="Can I upload assignments and study materials?"
              answer="Yes, under the 'Assignments' tab in AMS, you can upload PDFs, documents, and external links. Students and parents will receive instant notifications when new material is posted."
            />
            <FAQItem 
              question="How do I enter exam grades?"
              answer="Go to 'Results & Examinations', select the exam term and subject, and enter the marks. The system will automatically compute grades, percentiles, and generate digital report cards."
            />
            <FAQItem 
              question="How can I send announcements to my class?"
              answer="You can send important updates and notifications directly to your class through the 'Announcements' module. These messages will be broadcasted instantly to the dashboards of your students and their parents."
            />
            <FAQItem 
              question="Can I register a new student to my class?"
              answer="Yes, as a designated class teacher, you have exclusive access to the 'Add Student' form for your specific section. This allows you to directly register new students and maintain an accurate class roster."
            />
          </div>
        </div>
      )
    },
    'parents': {
      title: 'Parents',
      icon: <Users size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Parent Portal</h2>
          <p>Stay connected with your child's academic journey. Find answers to common questions below.</p>

          <div className="faq-container">
            <FAQItem question="How to Register As a Parent?">
              <div className="registration-timeline-wrapper">
                <p className="guide-subtitle">Simple steps to access your child's academic portal</p>
                <div className="vertical-timeline">
                  <div className="timeline-step">
                    <div className="timeline-marker">1</div>
                    <div className="timeline-content">
                      <h4>Scan QR Code</h4>
                      <p>Scan the QR code provided by the school to download the EduCrop app.</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-marker">2</div>
                    <div className="timeline-content">
                      <h4>Open the App</h4>
                      <p>Open the EduCrop app on your mobile device. An install popup will appear. Tap "How to Install".</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-marker">3</div>
                    <div className="timeline-content">
                      <h4>Tap on Register Here</h4>
                      <p>On the login screen, click on "Register here" at the bottom right.</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-marker">4</div>
                    <div className="timeline-content">
                      <h4>Click As a Parent</h4>
                      <p>Select "As a Parent" to register using your pre-registered mobile number.</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-marker">5</div>
                    <div className="timeline-content">
                      <h4>Fill Registration Form</h4>
                      <p>Enter your registered mobile number, email address and set a new password.</p>
                    </div>
                  </div>
                  <div className="timeline-step">
                    <div className="timeline-marker">6</div>
                    <div className="timeline-content">
                      <h4>Send Verification Code</h4>
                      <p>A code will be sent to your email. Verify to complete registration. Once verified, you can log in!</p>
                    </div>
                  </div>
                </div>
              </div>
            </FAQItem>

            <FAQItem 
              question="Why is my mobile number not recognized during registration?"
              answer="Your mobile number must match the exact number provided to the school during admission. Contact the school administration to update your phone number in their records."
            />
            <FAQItem 
              question="How do I view my child's report card?"
              answer="Once logged in, navigate to the 'Academic Profile' tab and select 'Results' to view and download the latest report cards and progress reports."
            />
            <FAQItem 
              question="Can I pay school fees through the app?"
              answer="Yes! Go to the 'Fee Management' section to view pending dues and securely pay via credit card, UPI, or net banking. Receipts are generated instantly."
            />
            <FAQItem 
              question="How do I apply for leave for my child?"
              answer="Under the 'Attendance' section, select 'Apply for Leave', choose the dates, and provide a valid reason. The class teacher will approve or reject the request."
            />
          </div>
        </div>
      )
    },
    'contact': {
      title: 'Contact Us',
      icon: <MessageSquare size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Contact & Support</h2>
          <p>Have questions? Find answers to our most common support inquiries below.</p>

          <div className="faq-container">
            <FAQItem 
              question="How do I reach technical support?"
              answer="You can reach our 24/7 technical support team via email at support@educrop.com or by calling our toll-free number provided in your enterprise SLA."
            />
            <FAQItem 
              question="What is the typical response time for support tickets?"
              answer="Our standard SLA is 2 hours for critical system issues and 24-48 hours for general inquiries and non-urgent bug reports."
            />
            <FAQItem 
              question="Do you provide on-site training for staff?"
              answer="Yes, during the initial onboarding phase, our implementation team provides comprehensive on-site and virtual training for all administrative and teaching staff."
            />
            <FAQItem 
              question="Can we request custom features for our institution?"
              answer="Absolutely. Our Enterprise plan includes custom module development and tailored integrations. Contact your dedicated account manager for a consultation."
            />
          </div>
        </div>
      )
    },
    'downloads': {
      title: 'Downloads',
      icon: <Download size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Offline Apps & Resources</h2>
          <p>Get the native desktop setup and mobile scanner companions. Choose the platform you need below.</p>
          
          <div className="downloads-list-container">
            <div className="download-list-item">
              <div className="download-icon-box apk-bg">
                <Smartphone size={24} className="icon-apk" />
              </div>
              <div className="download-info">
                <h3>EduCrop Mobile APK</h3>
                <p>Used by security at the gate to instantly generate visitor gate passes via Bluetooth.</p>
              </div>
              <a href="/downloads/educrop-mobile.apk" download="educrop-mobile.apk" className="main-download-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Install APK
              </a>
            </div>
            
            <div className="download-list-item">
              <div className="download-icon-box exe-bg">
                <Terminal size={24} className="icon-exe" />
              </div>
              <div className="download-info">
                <h3>EduCrop Windows EXE</h3>
                <p>Complete desktop manager for AMS, RMS & VMS. Generates gate passes by connecting via USB.</p>
              </div>
              <a href="/downloads/educrop-setup.exe" download="educrop-setup.exe" className="main-download-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Install EXE
              </a>
            </div>

            <div className="download-list-item">
              <div className="download-icon-box qr-bg">
                <Copy size={24} className="icon-qr" />
              </div>
              <div className="download-info">
                <h3>App Registration QR Code</h3>
                <p>Provides a quick-scan QR code for parents to download and register on the app.</p>
              </div>
              <a href="/assets/qr.png" download="educrop-qr.png" className="main-download-btn qr-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Download QR Code
              </a>
            </div>
          </div>
        </div>
      )
    },
    'ios': {
      title: 'iOS App (iPhone)',
      icon: <Apple size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Install EduCrop on iPhone</h2>
          <p>Since EduCrop is built as a highly optimized Progressive Web App (PWA), you can install it directly to your iPhone without needing the App Store. Follow the steps below:</p>

          <div className="ios-install-steps">
            <div className="ios-step">
              <div className="ios-step-text">
                <span className="step-badge">Step 1</span>
                <h3>Open the Portal</h3>
                <p>Open Safari on your iPhone and navigate to <strong>org.educrop.com</strong>.</p>
              </div>
              <div className="ios-mockup-image-container">
                <img src="/assets/i-one.png" alt="Step 1: Open Portal" className="ios-guide-img" />
              </div>
            </div>

            <div className="ios-step">
              <div className="ios-step-text">
                <span className="step-badge">Step 2</span>
                <h3>Tap the Share Button</h3>
                <p>At the bottom of the Safari screen, tap the <strong>Share</strong> button (the square with an arrow pointing up). Then scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
              </div>
              <div className="ios-mockup-image-container">
                <img src="/assets/i-two.png" alt="Step 2: Tap Share" className="ios-guide-img" />
              </div>
            </div>

            <div className="ios-step">
              <div className="ios-step-text">
                <span className="step-badge">Step 3</span>
                <h3>Launch the App</h3>
                <p>The EduCrop app icon will now appear on your home screen! Tap it to launch the app in full-screen mode just like a native iOS application.</p>
              </div>
              <div className="ios-mockup-image-container">
                <img src="/assets/i-three.png" alt="Step 3: Launch App" className="ios-guide-img" />
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  const handleScrollNav = (e, path, hash) => {
    e.preventDefault();
    navigate(path);
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="docs-page">
      <Header onLoginClick={onLoginClick} />

      {/* Docs Body */}
      <section className="docs-hero">
        <div className="docs-hero-container">
          <h1>Documentation Portal</h1>
          <p>Complete guide to accessing and managing the EduCrop platform modules.</p>
        </div>
      </section>

      <main className="docs-layout">
        <aside className="docs-sidebar">
          <div className="sidebar-sticky-box">
            <h3>Documentation Topics</h3>
            <ul className="sidebar-menu">
              {Object.keys(docSections).map((key) => (
                <li key={key}>
                  <button 
                    className={`sidebar-btn ${activeTab === key ? 'active' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    {docSections[key].icon}
                    <span>{docSections[key].title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="docs-body">
          <div className="docs-content-card">
            {docSections[activeTab].content}
          </div>
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Docs;
