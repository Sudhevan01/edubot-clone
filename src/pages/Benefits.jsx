import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Database, Zap, Users, BookOpen, Clock,
  Smartphone, BarChart3, CheckCircle2, Cloud, Lock, Settings, LayoutDashboard,
  GraduationCap, ClipboardCheck, CreditCard, MessageSquare, Briefcase,
  ChevronRight, ArrowDown, Headphones, ChevronDown, HelpCircle
} from 'lucide-react';
import Header from '../components/Header';
import LandingFooter from '../components/LandingFooter';
import { useScrollReveal } from '../hooks/useScrollReveal';
import './Benefits.css';

const AnimatedNumber = ({ end, duration = 2000, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);
  const nodeRef = useRef(null);

  useEffect(() => {
    let observer;
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < duration) {
        setCount(end === 99.9 ? 99.9 * (progress / duration) : Math.floor(end * (progress / duration)));
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    const handleIntersect = (entries) => {
      if (entries[0].isIntersecting) {
        startTime = null;
        animationFrame = requestAnimationFrame(updateCount);
        observer.unobserve(nodeRef.current);
      }
    };

    observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });

    if (nodeRef.current) {
      observer.observe(nodeRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [end, duration]);

  const displayCount = end === 99.9 ? count.toFixed(1) : count;

  return (
    <span ref={nodeRef}>
      {prefix}{displayCount}{suffix}
    </span>
  );
};

const Benefits = ({ onLoginClick }) => {
  const navigate = useNavigate();
  useScrollReveal();

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };
  }, []);

  return (
    <div className="benefits-page">
      <Header onLoginClick={onLoginClick} />

      {/* 1. HERO SECTION */}
      <section className="ben-hero-v2">
        {/* Background Network Elements */}
        <div className="ben-hero-bg-network" aria-hidden="true">
          <div className="network-glow glow-1"></div>
          <div className="network-glow glow-2"></div>
          <div className="network-grid"></div>
        </div>

        <div className="ben-hero-v2-container">
          {/* Left Text Column */}
          <div className="ben-hero-v2-text reveal-on-scroll">
            <div className="ben-hero-v2-badge stagger-1">WHY EDUCROP</div>
            <h1 className="ben-hero-v2-title stagger-2">
              Why Thousands of<br />
              Institutions Choose<br />
              <span className="ben-hero-v2-highlight">EduCrop</span>
            </h1>
            <p className="ben-hero-v2-subtitle stagger-3">
              Educrop simplifies academic, administrative, financial, and communication processes in one secure, intelligent platform designed to help institutions grow.
            </p>
            <div className="ben-hero-v2-cta stagger-4">
              <button className="ben-hero-v2-btn-primary" onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })}>
                Explore Benefits <ArrowRight size={18} strokeWidth={2.5} />
              </button>
              <button className="ben-hero-v2-btn-secondary" onClick={() => navigate('/contact')}>
                Schedule Demo <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Right Dashboard Column */}
          <div className="ben-hero-v2-visual reveal-on-scroll stagger-2">
            <div className="ben-hero-v2-dashboard">
              {/* Dashboard Sidebar */}
              <div className="dash-sidebar">
                <div className="dash-brand">
                  <div className="dash-logo-icon"><ShieldCheck size={18} color="#ffffff" /></div>
                  <span style={{color: '#fff', fontWeight: 'bold'}}>EduCrop</span>
                </div>
                <div className="dash-nav">
                  <div className="dash-nav-item active"><LayoutDashboard size={14}/> Dashboard</div>
                  <div className="dash-nav-item"><Users size={14}/> Students</div>
                  <div className="dash-nav-item"><GraduationCap size={14}/> Teachers</div>
                  <div className="dash-nav-item"><ClipboardCheck size={14}/> Attendance</div>
                  <div className="dash-nav-item"><ClipboardCheck size={14}/> Examination</div>
                  <div className="dash-nav-item"><CreditCard size={14}/> Finance</div>
                  <div className="dash-nav-item"><BookOpen size={14}/> Library</div>
                  <div className="dash-nav-item"><BarChart3 size={14}/> Reports</div>
                  <div className="dash-nav-item"><Settings size={14}/> Settings</div>
                </div>
              </div>
              
              {/* Dashboard Main Content */}
              <div className="dash-main">
                <div className="dash-header">
                  <div className="dash-search">Search anything...</div>
                  <div className="dash-user">
                    <div className="dash-user-avatar"></div>
                    <div>
                      <div style={{fontWeight: 600, color: '#1e293b'}}>John Doe</div>
                      <div style={{fontSize: '0.65rem', color: '#64748b'}}>Administrator</div>
                    </div>
                  </div>
                </div>

                <h3 className="dash-title">Dashboard</h3>
                
                <div className="dash-stats">
                  <div className="dash-stat">
                    <span>Total Students</span>
                    <strong>2,450</strong>
                    <div className="dash-up">↑ 12.5% this month</div>
                  </div>
                  <div className="dash-stat">
                    <span>Teachers</span>
                    <strong>124</strong>
                    <div className="dash-up">↑ 8.2% this month</div>
                  </div>
                  <div className="dash-stat">
                    <span>Total Revenue</span>
                    <strong>₹12,45,000</strong>
                    <div className="dash-up">↑ 15.3% this month</div>
                  </div>
                  <div className="dash-stat">
                    <span>Attendance</span>
                    <strong>95.4%</strong>
                    <div className="dash-up">↑ 4.6% this month</div>
                  </div>
                </div>

                <div className="dash-charts">
                  <div className="dash-chart-card main-chart">
                    <div className="chart-head">
                      <span>Student Enrollment</span>
                      <small>This Year ▾</small>
                    </div>
                    <div className="chart-body">
                       <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{width: '100%', height: '100%'}}>
                         <defs>
                           <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="rgba(37, 99, 235, 0.2)"/>
                             <stop offset="100%" stopColor="rgba(37, 99, 235, 0)"/>
                           </linearGradient>
                         </defs>
                         <path d="M0,30 L10,25 L20,28 L30,20 L40,24 L50,15 L60,18 L70,10 L80,12 L90,5 L100,2 L100,40 L0,40 Z" fill="url(#chartGrad)" />
                         <path d="M0,30 L10,25 L20,28 L30,20 L40,24 L50,15 L60,18 L70,10 L80,12 L90,5 L100,2" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                         <circle cx="10" cy="25" r="1.5" fill="#2563eb" />
                         <circle cx="30" cy="20" r="1.5" fill="#2563eb" />
                         <circle cx="50" cy="15" r="1.5" fill="#2563eb" />
                         <circle cx="70" cy="10" r="1.5" fill="#2563eb" />
                         <circle cx="90" cy="5" r="1.5" fill="#2563eb" />
                       </svg>
                    </div>
                  </div>
                  <div className="dash-chart-card side-chart">
                    <div className="chart-head">
                      <span>Fee Collection</span>
                    </div>
                    <div className="chart-body donut-wrap">
                      <div className="dash-donut">
                        <div className="donut-center">
                          <strong>₹12.45L</strong>
                          <span>Total</span>
                        </div>
                      </div>
                      <div className="donut-legend">
                        <div><i style={{background: '#2563eb'}}></i> Paid (72%)</div>
                        <div><i style={{background: '#60a5fa'}}></i> Pending (20%)</div>
                        <div><i style={{background: '#f43f5e'}}></i> Overdue (8%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating KPI Cards */}
            <div className="hero-kpi-card hero-kpi-1 float-anim">
              <div className="kpi-icon-wrap"><Users size={20} color="#2563eb" /></div>
              <div className="kpi-text">
                <strong>150+</strong>
                <span>Institutions</span>
              </div>
            </div>
            
            <div className="hero-kpi-card hero-kpi-2 float-anim-delayed">
              <div className="kpi-icon-wrap"><ShieldCheck size={20} color="#10b981" /></div>
              <div className="kpi-text">
                <strong>99.9%</strong>
                <span>System Uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Trust Bar */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <div className="trust-icon"><Users size={20} /></div>
            <div className="trust-text">
              <strong>150+</strong>
              <span>Institutions Trust Us</span>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <div className="trust-icon"><ShieldCheck size={20} /></div>
            <div className="trust-text">
              <strong>99.9%</strong>
              <span>System Uptime</span>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <div className="trust-icon"><Headphones size={20} /></div>
            <div className="trust-text">
              <strong>24/7</strong>
              <span>Customer Support</span>
            </div>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <div className="trust-icon"><Lock size={20} /></div>
            <div className="trust-text">
              <strong>Secure</strong>
              <span>Data & Privacy</span>
            </div>
          </div>
        </div>
      </section>


      {/* 2. POWERFUL BENEFITS */}
      <section className="ben-benefits-section">
        <h2 className="ben-section-title reveal-on-scroll">Powerful Benefits for Modern Institutions</h2>
        <div className="ben-benefits-grid">
          <div className="ben-benefit-card reveal-on-scroll">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <GraduationCap size={26} strokeWidth={2} />
            </div>
            <h3>Academic Excellence</h3>
            <p>Streamline academic operations and improve student performance with smart tools.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
          <div className="ben-benefit-card reveal-on-scroll stagger-1">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <Settings size={26} strokeWidth={2} />
            </div>
            <h3>Complete Automation</h3>
            <p>Automate repetitive tasks and reduce manual work across all departments.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
          <div className="ben-benefit-card reveal-on-scroll stagger-2">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <ShieldCheck size={26} strokeWidth={2} />
            </div>
            <h3>Secure Cloud Infrastructure</h3>
            <p>Enterprise-grade security with encrypted data and regular backups.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
          <div className="ben-benefit-card reveal-on-scroll stagger-3">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <Clock size={26} strokeWidth={2} />
            </div>
            <h3>Faster Administration</h3>
            <p>Manage everything faster with a centralized dashboard and easy access.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
          <div className="ben-benefit-card reveal-on-scroll stagger-4">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <Users size={26} strokeWidth={2} />
            </div>
            <h3>Parent Engagement</h3>
            <p>Keep parents informed and involved in their child's academic journey.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
          <div className="ben-benefit-card reveal-on-scroll stagger-5">
            <div className="ben-card-accent"></div>
            <div className="ben-benefit-icon-wrap">
              <BarChart3 size={26} strokeWidth={2} />
            </div>
            <h3>Powerful Analytics</h3>
            <p>Make data-driven decisions with real-time reports and smart insights.</p>
            <div className="ben-card-bottom">
              <div className="ben-card-divider"></div>
              <div className="ben-card-learn-more">
                <span>Learn More</span>
                <div className="ben-card-arrow-wrap"><ArrowRight size={12} strokeWidth={2.5} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONNECTED ECOSYSTEM */}
      <section className="ben-ecosystem-section">
        {/* Decorative background blobs */}
        <div className="eco-bg-blob eco-bg-blob--tl" aria-hidden="true"></div>
        <div className="eco-bg-blob eco-bg-blob--tr" aria-hidden="true"></div>

        <div className="eco-wrap">

          {/* ── Section Header ── */}
          <div className="eco-header reveal-on-scroll">
            <div className="eco-badge">
              <LayoutDashboard size={13} />
              POWERFUL FEATURES
            </div>
            <h2 className="eco-heading">
              Everything Connected.<br />
              <span className="eco-heading-accent">Everything Simplified.</span>
            </h2>
            <div className="eco-heading-line"></div>
            <p className="eco-subtitle">
              Educrop unifies every academic, administrative, financial, and communication<br className="eco-br" />
              workflow into one intelligent platform.
            </p>
          </div>

          {/* ── Main 3-column grid ── */}
          <div className="eco-main reveal-on-scroll stagger-1">

            {/* Left feature cards */}
            <div className="eco-feat-col">
              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                  <Users size={20} color="#2563eb" />
                </div>
                <div className="eco-feat-body">
                  <h4>Student Management</h4>
                  <p>Manage student data, admissions, attendance, and performance in one place.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Student Management"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}>
                  <ClipboardCheck size={20} color="#16a34a" />
                </div>
                <div className="eco-feat-body">
                  <h4>Attendance Management</h4>
                  <p>Track attendance in real-time with automated reports and smart analytics.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Attendance Management"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)' }}>
                  <CreditCard size={20} color="#d97706" />
                </div>
                <div className="eco-feat-body">
                  <h4>Fee Management</h4>
                  <p>Automate fee collection, invoices, reminders and financial tracking.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Fee Management"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                  <BookOpen size={20} color="#7c3aed" />
                </div>
                <div className="eco-feat-body">
                  <h4>Library Management</h4>
                  <p>Digitize library operations and manage books, issues and returns easily.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Library Management"><ArrowRight size={14} /></button>
              </div>
            </div>

            {/* Center: Dashboard mockup */}
            <div className="eco-dash-wrap">
              <div className="eco-dashboard">

                {/* Sidebar */}
                <div className="eco-dash-sidebar">
                  <div className="eco-dash-brand">
                    <img src="/assets/images/educroplogo.png" alt="Educrop" className="eco-dash-logo" />
                    <span>educrop</span>
                  </div>
                  <nav className="eco-dash-nav">
                    <div className="eco-dash-nav-item eco-dash-nav-item--active"><LayoutDashboard size={13} /><span>Dashboard</span></div>
                    <div className="eco-dash-nav-item"><Users size={13} /><span>Students</span></div>
                    <div className="eco-dash-nav-item"><ClipboardCheck size={13} /><span>Attendance</span></div>
                    <div className="eco-dash-nav-item"><CreditCard size={13} /><span>Fees</span></div>
                    <div className="eco-dash-nav-item"><GraduationCap size={13} /><span>Examinations</span></div>
                    <div className="eco-dash-nav-item"><Clock size={13} /><span>Timetable</span></div>
                    <div className="eco-dash-nav-item"><BarChart3 size={13} /><span>Reports</span></div>
                    <div className="eco-dash-nav-item"><MessageSquare size={13} /><span>Communication</span></div>
                    <div className="eco-dash-nav-item"><Settings size={13} /><span>Settings</span></div>
                  </nav>
                </div>

                {/* Main content */}
                <div className="eco-dash-content">
                  {/* Stat cards */}
                  <div className="eco-dash-stats">
                    <div className="eco-dash-stat">
                      <div className="eco-dash-stat-label">Students</div>
                      <div className="eco-dash-stat-val">12,450</div>
                      <div className="eco-dash-stat-change eco-up">+12.5% this month</div>
                    </div>
                    <div className="eco-dash-stat">
                      <div className="eco-dash-stat-label">Teachers</div>
                      <div className="eco-dash-stat-val">845</div>
                      <div className="eco-dash-stat-change eco-up">+8.4% this month</div>
                    </div>
                    <div className="eco-dash-stat">
                      <div className="eco-dash-stat-label">Attendance</div>
                      <div className="eco-dash-stat-val">96.4%</div>
                      <div className="eco-dash-stat-change eco-up">+3.2% this month</div>
                    </div>
                    <div className="eco-dash-stat">
                      <div className="eco-dash-stat-label">Fee Collection</div>
                      <div className="eco-dash-stat-val">₹12.45 Cr</div>
                      <div className="eco-dash-stat-change eco-up">+15.6% this month</div>
                    </div>
                  </div>

                  {/* Attendance chart */}
                  <div className="eco-chart-section">
                    <div className="eco-chart-header">
                      <span className="eco-chart-title">Attendance Overview</span>
                      <span className="eco-chart-period">This Week ▾</span>
                    </div>
                    <div className="eco-chart-area">
                      <div className="eco-chart-yaxis">
                        <span>100%</span><span>55%</span><span>25%</span><span>0%</span>
                      </div>
                      <div className="eco-chart-plot">
                        <svg viewBox="0 0 380 72" preserveAspectRatio="none" className="eco-chart-svg">
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
                              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0 48 C25 44 50 30 75 38 C100 46 125 32 150 22 C175 12 200 26 225 16 C250 6 275 20 300 12 C325 4 355 8 380 6" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
                          <path d="M0 48 C25 44 50 30 75 38 C100 46 125 32 150 22 C175 12 200 26 225 16 C250 6 275 20 300 12 C325 4 355 8 380 6 L380 72 L0 72 Z" fill="url(#areaGrad)" />
                        </svg>
                        <div className="eco-chart-xaxis">
                          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom two cards */}
                  <div className="eco-dash-bottom">
                    <div className="eco-dash-mini-card">
                      <div className="eco-dash-mini-title">Fee Collection</div>
                      <div className="eco-dash-mini-body">
                        <div className="eco-donut eco-donut--fee">
                          <div className="eco-donut-hole"><span>75%</span></div>
                        </div>
                        <div className="eco-dash-mini-info">
                          <div className="eco-dash-mini-val">₹12.45 Cr</div>
                          <div className="eco-dash-mini-sub">Total Collection</div>
                          <div className="eco-dash-mini-chg">+15.6% from last month</div>
                        </div>
                      </div>
                    </div>
                    <div className="eco-dash-mini-card">
                      <div className="eco-dash-mini-title">Students by Grade</div>
                      <div className="eco-dash-mini-body">
                        <div className="eco-donut eco-donut--grade">
                          <div className="eco-donut-hole eco-donut-hole--sm">
                            <span className="eco-donut-val">12,450</span>
                            <span className="eco-donut-sub">Students</span>
                          </div>
                        </div>
                        <div className="eco-grade-legend">
                          <div className="eco-grade-row"><i style={{ background: '#2563eb' }}></i>Grade 1–5 <b>35%</b></div>
                          <div className="eco-grade-row"><i style={{ background: '#22c55e' }}></i>Grade 6–8 <b>30%</b></div>
                          <div className="eco-grade-row"><i style={{ background: '#f59e0b' }}></i>Grade 9–10 <b>20%</b></div>
                          <div className="eco-grade-row"><i style={{ background: '#e11d48' }}></i>Grade 11–12 <b>15%</b></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right feature cards */}
            <div className="eco-feat-col">
              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)' }}>
                  <Briefcase size={20} color="#7c3aed" />
                </div>
                <div className="eco-feat-body">
                  <h4>Staff Management</h4>
                  <p>Manage staff information, roles, leaves, and performance efficiently.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Staff Management"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
                  <MessageSquare size={20} color="#2563eb" />
                </div>
                <div className="eco-feat-body">
                  <h4>Communication</h4>
                  <p>Connect with students, parents and staff through announcements and messages.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Communication"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)' }}>
                  <BarChart3 size={20} color="#ea580c" />
                </div>
                <div className="eco-feat-body">
                  <h4>Reports & Analytics</h4>
                  <p>Get real-time insights with powerful reports and advanced analytics.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Reports and Analytics"><ArrowRight size={14} /></button>
              </div>

              <div className="eco-feat-card">
                <div className="eco-feat-icon-wrap" style={{ background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)' }}>
                  <Smartphone size={20} color="#db2777" />
                </div>
                <div className="eco-feat-body">
                  <h4>Parent Portal</h4>
                  <p>Keep parents informed and engaged with real-time updates and communication.</p>
                </div>
                <button className="eco-feat-btn" aria-label="Parent Portal"><ArrowRight size={14} /></button>
              </div>
            </div>

          </div>{/* /eco-main */}

          {/* ── Bottom feature bar ── */}
          <div className="eco-bottom-bar reveal-on-scroll stagger-2">
            <div className="eco-bottom-item">
              <div className="eco-bottom-icon eco-bottom-icon--blue"><ShieldCheck size={20} /></div>
              <div className="eco-bottom-text">
                <h5>Secure &amp; Reliable</h5>
                <p>Enterprise-grade security to keep your data safe.</p>
              </div>
            </div>
            <div className="eco-bottom-divider" aria-hidden="true"></div>
            <div className="eco-bottom-item">
              <div className="eco-bottom-icon eco-bottom-icon--sky"><Cloud size={20} /></div>
              <div className="eco-bottom-text">
                <h5>Cloud Based</h5>
                <p>Access your data anytime, anywhere, on any device.</p>
              </div>
            </div>
            <div className="eco-bottom-divider" aria-hidden="true"></div>
            <div className="eco-bottom-item">
              <div className="eco-bottom-icon eco-bottom-icon--amber"><Zap size={20} /></div>
              <div className="eco-bottom-text">
                <h5>Fast &amp; Efficient</h5>
                <p>Automate tasks and save time with smart workflows.</p>
              </div>
            </div>
            <div className="eco-bottom-divider" aria-hidden="true"></div>
            <div className="eco-bottom-item">
              <div className="eco-bottom-icon eco-bottom-icon--purple"><Headphones size={20} /></div>
              <div className="eco-bottom-text">
                <h5>24/7 Support</h5>
                <p>Our team is always here to support you.</p>
              </div>
            </div>
          </div>

        </div>{/* /eco-wrap */}
      </section>


      {/* 4. BENEFITS FOR EVERY USER */}
      <section className="ben-users-section">
        <h2 className="ben-section-title reveal-on-scroll">Benefits for Every User</h2>
        <div className="ben-users-grid">

          <div className="ben-user-card reveal-on-scroll">
            <div className="ben-user-icon"><GraduationCap size={32} /></div>
            <h3>Students</h3>
            <ul className="ben-user-list">
              <li>Easy access to timetable, assignments and results</li>
              <li>Track attendance and academic progress</li>
              <li>Receive instant notifications</li>
            </ul>
          </div>

          <div className="ben-user-card reveal-on-scroll stagger-1">
            <div className="ben-user-icon"><BookOpen size={32} /></div>
            <h3>Teachers</h3>
            <ul className="ben-user-list">
              <li>Manage attendance, marks and homework</li>
              <li>Create assignments and assessments</li>
              <li>Generate reports effortlessly</li>
            </ul>
          </div>

          <div className="ben-user-card reveal-on-scroll stagger-2">
            <div className="ben-user-icon"><Users size={32} /></div>
            <h3>Parents</h3>
            <ul className="ben-user-list">
              <li>Stay updated with real-time academic information</li>
              <li>View attendance, marks and fee details</li>
              <li>Communicate with teachers easily</li>
            </ul>
          </div>

          <div className="ben-user-card reveal-on-scroll stagger-3">
            <div className="ben-user-icon"><ShieldCheck size={32} /></div>
            <h3>Administrators</h3>
            <ul className="ben-user-list">
              <li>Manage admissions, staff and departments</li>
              <li>Control fees, expenses and budgets</li>
              <li>Generate advanced reports and analytics</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 5. STATISTICS SECTION */}
      <section className="ben-stats-section">
        <div className="ben-stats-grid">
          <div className="ben-stat-card reveal-on-scroll">
            <div className="ben-stat-icon"><ShieldCheck size={24} /></div>
            <div className="ben-stat-info">
              <h4><AnimatedNumber end={99.9} suffix="%" /></h4>
              <p>System Uptime</p>
              <span>Reliable and always available.</span>
            </div>
          </div>
          <div className="ben-stat-card reveal-on-scroll stagger-1">
            <div className="ben-stat-icon"><Clock size={24} /></div>
            <div className="ben-stat-info">
              <h4><AnimatedNumber end={95} suffix="%" /></h4>
              <p>Reduced Manual Work</p>
              <span>Save time with automation.</span>
            </div>
          </div>
          <div className="ben-stat-card reveal-on-scroll stagger-2">
            <div className="ben-stat-icon"><Cloud size={24} /></div>
            <div className="ben-stat-info">
              <h4>24/7</h4>
              <p>Cloud Access</p>
              <span>Access data anytime, anywhere.</span>
            </div>
          </div>
          <div className="ben-stat-card reveal-on-scroll stagger-3">
            <div className="ben-stat-icon"><Lock size={24} /></div>
            <div className="ben-stat-info">
              <h4><AnimatedNumber end={100} suffix="%" /></h4>
              <p>Secure Data</p>
              <span>Enterprise-grade security.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SCHOOL WORKFLOW */}
      <section className="ben-workflow-section">
        <h2 className="ben-section-title reveal-on-scroll">How Educrop Transforms Your Institution</h2>
        <div className="ben-workflow-container">
          <div className="ben-workflow-line"></div>

          <div className="ben-workflow-step reveal-on-scroll">
            <div className="ben-workflow-icon"><Users size={28} /></div>
            <div className="ben-step-num">01</div>
            <h4>Admission</h4>
            <p>Streamline admission and enrollment process.</p>
          </div>

          <div className="ben-workflow-step reveal-on-scroll stagger-1">
            <div className="ben-workflow-icon"><GraduationCap size={28} /></div>
            <div className="ben-step-num">02</div>
            <h4>Academics</h4>
            <p>Manage courses, classes, subjects and curriculum.</p>
          </div>

          <div className="ben-workflow-step reveal-on-scroll stagger-2">
            <div className="ben-workflow-icon"><ClipboardCheck size={28} /></div>
            <div className="ben-step-num">03</div>
            <h4>Attendance</h4>
            <p>Track attendance accurately in real-time.</p>
          </div>

          <div className="ben-workflow-step reveal-on-scroll stagger-3">
            <div className="ben-workflow-icon"><CreditCard size={28} /></div>
            <div className="ben-step-num">04</div>
            <h4>Fees</h4>
            <p>Collect fees, generate receipts and manage dues.</p>
          </div>

          <div className="ben-workflow-step reveal-on-scroll stagger-4">
            <div className="ben-workflow-icon"><BarChart3 size={28} /></div>
            <div className="ben-step-num">05</div>
            <h4>Reports</h4>
            <p>Get real-time reports and performance analytics.</p>
          </div>

          <div className="ben-workflow-step reveal-on-scroll stagger-5">
            <div className="ben-workflow-icon"><CheckCircle2 size={28} /></div>
            <div className="ben-step-num">06</div>
            <h4>Graduation</h4>
            <p>Ensure a smooth journey from admission to graduation.</p>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="ben-faq-section">
        {/* Decorative background elements */}
        <div className="faq-bg-blob faq-bg-blob--tl" aria-hidden="true"></div>
        <div className="faq-bg-blob faq-bg-blob--br" aria-hidden="true"></div>
        <div className="faq-bg-curve faq-bg-curve--left" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 Q50,0 200,50" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
            <path d="M-50,150 Q50,50 250,100" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
            <path d="M-100,200 Q50,100 300,150" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="faq-bg-curve faq-bg-curve--right" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M200,100 Q150,200 0,150" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
            <path d="M250,50 Q150,150 -50,100" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
            <path d="M300,0 Q150,100 -100,50" stroke="rgba(37, 99, 235, 0.05)" strokeWidth="1" fill="none" />
          </svg>
        </div>
        <div className="faq-bg-grid" aria-hidden="true"></div>

        <div className="faq-wrap">
          {/* Section Header */}
          <div className="faq-header reveal-on-scroll">
            <div className="faq-badge">
              <HelpCircle size={14} className="faq-badge-icon" />
              FAQ
            </div>
            <h2 className="faq-heading">
              Frequently Asked <span className="faq-heading-accent">Questions</span>
            </h2>
            <div className="faq-heading-line"></div>
            <p className="faq-subtitle">
              Find answers to common questions about EduCrop and how it can<br className="faq-br" />
              help transform your educational institution.
            </p>
          </div>

          <div className="ben-faq-grid">
            {/* Left Column */}
            <div className="faq-col">
              <div className="ben-faq-item reveal-on-scroll stagger-1">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Is Educrop a cloud-based platform?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-2">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>How long does implementation take?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-3">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Do you provide training and support?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-4">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Is my data secure with Educrop?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
            </div>

            {/* Right Column */}
            <div className="faq-col">
              <div className="ben-faq-item reveal-on-scroll stagger-1">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Can modules be customized?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-2">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Can I manage multiple campuses?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-3">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Can parents access the mobile app?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
              <div className="ben-faq-item reveal-on-scroll stagger-4">
                <div className="faq-item-icon"><HelpCircle size={22} className="faq-icon-svg" /></div>
                <h4>Is Educrop mobile-friendly?</h4>
                <ChevronDown size={22} className="ben-faq-icon" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="ben-final-cta">
        <div className="ben-cta-banner reveal-on-scroll">
          <h2>Ready to Modernize Your Institution?</h2>
          <p>Join hundreds of institutions already using Educrop to simplify operations, improve productivity and achieve excellence.</p>
          <div className="ben-final-cta-actions">
            <button className="ben-final-btn-primary" onClick={() => navigate('/contact')}>
              Book a Demo <ArrowRight size={18} className="btn-icon" />
            </button>
            <button className="ben-final-btn-secondary" onClick={() => navigate('/contact')}>
              Contact Our Team
            </button>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Benefits;
