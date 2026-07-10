import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Shield, Receipt, GraduationCap, ArrowRight, Menu, X, Check, Copy, Terminal } from 'lucide-react';
import LandingFooter from '../components/LandingFooter';
import Header from '../components/Header';
import './Docs.css';

const Docs = ({ onLoginClick }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('getting-started');

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  const docSections = {
    'getting-started': {
      title: 'Getting Started',
      icon: <BookOpen size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>Welcome to EduCrop Platform</h2>
          <p>
            EduCrop is a modern, unified academic infrastructure that combines security, financial documentation, and academic organization. The platform is divided into three core subsystems designed for different user roles.
          </p>

          <div className="doc-image-showcase">
            <img src="/assets/images/product_hero.png" alt="EduCrop Suite Overview" className="doc-screenshot-img" />
          </div>

          <div className="system-roles-grid">
            <div className="role-card">
              <div className="role-badge security">VMS</div>
              <h4>Visitor Management</h4>
              <p>For Security Guards, Administrators, and Front Desk Operators.</p>
            </div>
            <div className="role-card">
              <div className="role-badge finance">RMS</div>
              <h4>Receipt Management</h4>
              <p>For Accounts Departments, Accountants, and Auditors.</p>
            </div>
            <div className="role-card">
              <div className="role-badge academic">AMS</div>
              <h4>Academic Management</h4>
              <p>For Teachers, Academic Coordinators, and Students.</p>
            </div>
          </div>

          <h3>Accessing your Dashboard</h3>
          <ol className="styled-list">
            <li>Click the <strong>Login</strong> button on the landing page header.</li>
            <li>You will be redirected to the secure login subdomain (<strong>org.educrop.com</strong>).</li>
            <li>Enter your <strong>Organization Code</strong>, <strong>Email Address</strong>, and <strong>Password</strong>.</li>
            <li>Click <strong>Sign In</strong> to navigate directly to your role-based workspace.</li>
          </ol>

          <div className="doc-note-box info">
            <strong>Pro-Tip:</strong> If you don't know your Organization Code, please reach out to your school administrator or system coordinator.
          </div>
        </div>
      )
    },
    'vms': {
      title: 'VMS: Visitor Management',
      icon: <Shield size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>VMS: Visitor Management System</h2>
          <p>
            The Visitor Management System secures the campus gates and front office. It replaces old paper logbooks with automated visitor badges, SMS alerts, and audit logs.
          </p>

          <div className="doc-image-showcase">
            <img src="/assets/images/vms_kiosk.png" alt="Visitor Management Tablet Kiosk" className="doc-screenshot-img" />
          </div>

          <h3>Key Operator Workflows</h3>

          <h4>1. Registering a New Visitor</h4>
          <p>When a guest arrives at the gatepass kiosk or front office:</p>
          <ul className="bullet-list">
            <li>Navigate to the <strong>Visitor Entry</strong> screen.</li>
            <li>Input the visitor's full name, mobile number, and organization.</li>
            <li>Select the host staff member they wish to meet and state the purpose of visit.</li>
            <li>Click <strong>Generate Gatepass</strong>. An SMS notification with entry details is instantly sent to the host.</li>
          </ul>

          <h4>2. Checking Out Visitors</h4>
          <ul className="bullet-list">
            <li>Under the <strong>Active Visitors</strong> directory, search for the guest by name or phone.</li>
            <li>Click the green <strong>Checkout</strong> button. The check-out timestamp is automatically registered in the system logs.</li>
          </ul>

          <h4>3. Student & Vendor Special Permits</h4>
          <p>Admin and authorized operators can create gate passes for students leaving campus early or vendors delivering inventory supplies. This ensures all movements across the campus perimeter are fully accounted for.</p>

          <div className="doc-note-box warning">
            <strong>Security Rule:</strong> All visitors must present their digital or printed gatepass QR code at the main checkpoint when exiting.
          </div>
        </div>
      )
    },
    'rms': {
      title: 'RMS: Receipt Management',
      icon: <Receipt size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>RMS: Receipt Management System</h2>
          <p>
            The Receipt Management System is a specialized module for financial records. It manages fee invoice generation, salary slips for staff, and general transaction history.
          </p>

          <div className="doc-image-showcase">
            <img src="/assets/images/rms_dashboard.png" alt="Receipt Management Slip Generator" className="doc-screenshot-img" />
          </div>

          <h3>Core Financial Modules</h3>

          <h4>1. Creating & Sending Fee Slips</h4>
          <p>Ensure student accounts are up to date by generating receipts instantly:</p>
          <ul className="bullet-list">
            <li>Go to the <strong>Fees Module</strong> and click <strong>Create Fee Slip</strong>.</li>
            <li>Select the student's Grade, Section, and Name to fetch their record.</li>
            <li>Select the payment method (Cash, Online Transfer, Card, or UPI reference).</li>
            <li>Enter the amount paid. Click <strong>Generate Receipt</strong>.</li>
            <li>The slip is generated as a secure PDF and can be sent to the parent's registered mobile number via WhatsApp.</li>
          </ul>

          <h4>2. Payroll & Salary Slips</h4>
          <ul className="bullet-list">
            <li>Go to the <strong>Salary Module</strong> and click <strong>Generate Salary Slips</strong>.</li>
            <li>Select the target Employee or upload a monthly bulk spreadsheet (.xlsx format).</li>
            <li>Verify base salary, additions (bonus/allowances), and deductions.</li>
            <li>Click <strong>Generate & Deliver</strong>. Employees receive their digital payslips instantly.</li>
          </ul>

          <h4>3. Audit & Reporting Logs</h4>
          <p>View transaction logs to filter payments by date range, payment types, and status. Export all data to Excel for monthly tax filings and audits.</p>
        </div>
      )
    },
    'ams': {
      title: 'AMS: Academic Management',
      icon: <GraduationCap size={20} />,
      content: (
        <div className="doc-rich-content">
          <h2>AMS: Academic Management System</h2>
          <p>
            The Academic Management System is the main portal for teachers, tutors, and academic coordinators to coordinate educational assets and student progress.
          </p>

          <div className="doc-image-showcase">
            <img src="/assets/images/lecture_hall.png" alt="Academic Class Management Portal" className="doc-screenshot-img" />
          </div>

          <h3>Daily Teaching Workflows</h3>

          <h4>1. Marking Class Attendance</h4>
          <ul className="bullet-list">
            <li>Log in as a Teacher and click the <strong>Attendance Module</strong>.</li>
            <li>Select your assigned Grade and Section.</li>
            <li>The screen displays the student list. Toggle present/absent checks for students.</li>
            <li>Click <strong>Submit Attendance</strong>. Parents of absent students are notified immediately.</li>
          </ul>

          <h4>2. Managing Assignments</h4>
          <ul className="bullet-list">
            <li>Go to the <strong>Assignments Portal</strong>.</li>
            <li>Click <strong>Create Assignment</strong>. Choose the subject, add a title, deadline date, and upload worksheets (PDF, JPG).</li>
            <li>Students and parents can view these details on their dashboards and upload responses directly.</li>
          </ul>

          <h4>3. Student Leave Requests</h4>
          <p>Parents submit leave applications online. The class teacher or academic coordinator receives these requests on their dashboard and can **Approve** or **Reject** them, updating the attendance logs automatically.</p>
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
            <h3>Table of Contents</h3>
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

            <div className="sidebar-divider"></div>

            <div className="sidebar-help-card">
              <h4>Install Offline Apps</h4>
              <p>Get the native desktop setup and mobile scanner companions.</p>
              <button className="sidebar-help-btn" onClick={() => navigate('/downloads')}>
                Get Apps
              </button>
            </div>
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
